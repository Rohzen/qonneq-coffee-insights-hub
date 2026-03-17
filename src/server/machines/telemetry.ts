import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../lib/auth.js';
import { getDbPool } from '../lib/db.js';
import { getCimbaliTelemetry, getCimbaliMachineInfo, CimbaliCredentials } from '../lib/cimbali.js';
import { buildWeatherIndex, getDateKeyAndHour, getHistoricalWeather, getWeatherDescription, getWeatherIconKey, parseHourlyData } from '../lib/weather.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authResult = verifyAuth(req);
        if (!authResult) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Get serial number from URL
        const { serial } = req.query;
        if (!serial || typeof serial !== 'string') {
            return res.status(400).json({ success: false, error: 'Serial number required' });
        }

        const forceRefresh = req.query.refresh === 'true';

        // Get date range from query params
        const days = parseInt(req.query.days as string) || 7;
        const startDateParam = req.query.startDate as string | undefined;
        const endDateParam = req.query.endDate as string | undefined;

        let startDateMs: number;
        let endDateMs: number;

        if (startDateParam || endDateParam) {
            const startDate = startDateParam ? new Date(`${startDateParam}T00:00:00`) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const endDate = endDateParam ? new Date(`${endDateParam}T23:59:59`) : new Date();
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({ success: false, error: 'Invalid startDate or endDate' });
            }
            startDateMs = startDate.getTime();
            endDateMs = endDate.getTime();
        } else {
            endDateMs = Date.now();
            startDateMs = endDateMs - (days * 24 * 60 * 60 * 1000);
        }

        const pool = getDbPool();

        // Find the machine and its credential
        const machineResult = await pool.query(`
            SELECT m.*, c.name as company_name, ac.credentials
            FROM machines m
            LEFT JOIN companies c ON m.company_id = c.id
            LEFT JOIN api_credentials ac ON ac.company_id = m.company_id AND ac.provider = 'cimbali'
            WHERE m.serial_number = $1
        `, [serial]);

        if (machineResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Machine not found' });
        }

        const machine = machineResult.rows[0];
        const credentialsJson = machine.credentials;

        if (!credentialsJson) {
            return res.status(400).json({
                success: false,
                error: 'No Cimbali credentials found for this company'
            });
        }

        // Check DB for existing data if not refreshing
        let normalizedTelemetry: any[] = [];
        let machineInfo: any = null;

        if (!forceRefresh) {
            const dbResult = await pool.query(`
                SELECT data 
                FROM machine_telemetry 
                WHERE machine_serial = $1 
                AND timestamp >= $2 
                AND timestamp <= $3 
                ORDER BY timestamp ASC
            `, [serial, new Date(startDateMs), new Date(endDateMs)]);

            if (dbResult.rows.length > 0) {
                normalizedTelemetry = dbResult.rows.map(row => row.data);
            }
        }

        const creds: CimbaliCredentials = {
            username: credentialsJson.username || credentialsJson.apiKey,
            password: credentialsJson.password || credentialsJson.apiSecret
        };

        // If no data found in DB or force refresh, fetch from API
        if (normalizedTelemetry.length === 0 || forceRefresh) {

            // Fetch telemetry from Cimbali API
            const telemetryData = await getCimbaliTelemetry(creds, serial, startDateMs, endDateMs);

            // Also fetch machine info for location data
            machineInfo = await getCimbaliMachineInfo(creds, serial);

            // Fetch weather data if location available
            let weatherData: any[] = [];
            if (machineInfo?.latitude && machineInfo?.longitude) {
                const weatherRaw = await getHistoricalWeather(
                    machineInfo.latitude,
                    machineInfo.longitude,
                    new Date(startDateMs),
                    new Date(endDateMs)
                );
                if (weatherRaw) {
                    weatherData = parseHourlyData(weatherRaw);
                }
            }

            const weatherIndex = buildWeatherIndex(weatherData);

            // Debug: weather fetch info
            if (machineInfo?.latitude && machineInfo?.longitude) {
                const startStr = new Date(startDateMs).toISOString().split('T')[0];
                const endStr = new Date(endDateMs).toISOString().split('T')[0];
                console.log(`[Weather Debug] lat=${machineInfo.latitude}, lng=${machineInfo.longitude}, range=${startStr}..${endStr}, weatherRecords=${weatherData.length}`);
                // Log sample keys
                const sampleWeatherKeys = Array.from(weatherIndex.keys()).slice(0, 5);
                console.log(`[Weather Debug] Sample weather index keys: ${sampleWeatherKeys.join(', ')}`);
            }

            // Normalize telemetry (calculate deltas for both coffee and espresso)
            let previousTotalCounter: number | null = null;
            let previousCoffeeTotal: number | null = null;

            normalizedTelemetry = telemetryData.map(record => {
                const currentTotal = record.total_count ?? record.coffee_count ?? 0;
                const currentCoffeeTotal = record.coffee_count ?? currentTotal;

                let espressoDelta = 0;
                let coffeeDelta = 0;

                if (currentTotal > 0 && previousTotalCounter !== null) {
                    const delta = currentTotal - previousTotalCounter;
                    espressoDelta = delta >= 0 ? delta : 0;
                }

                if (currentCoffeeTotal > 0 && previousCoffeeTotal !== null) {
                    const delta = currentCoffeeTotal - previousCoffeeTotal;
                    coffeeDelta = delta >= 0 ? delta : 0;
                } else if (previousCoffeeTotal === null && currentCoffeeTotal > 0) {
                    coffeeDelta = 0;
                }

                if (currentTotal > 0) {
                    previousTotalCounter = currentTotal;
                }
                if (currentCoffeeTotal > 0) {
                    previousCoffeeTotal = currentCoffeeTotal;
                }

                const timestampDate = new Date(record.timestamp);
                const { dateKey, hour } = getDateKeyAndHour(timestampDate);
                const weatherKey = `${dateKey}-${hour}`;
                const weather = weatherIndex.get(weatherKey);

                return {
                    ...record,
                    coffee_count: coffeeDelta,
                    espresso_count: espressoDelta,
                    total_count: currentTotal,
                    cumulative_coffee: currentCoffeeTotal,
                    weather_code: weather?.weather_code ?? null,
                    weather_description: getWeatherDescription(weather?.weather_code),
                    weather_icon: getWeatherIconKey(weather?.weather_code),
                    weather_temperature: weather?.temperature ?? null,
                };
            });

            // Debug: weather enrichment stats
            {
                const withWeather = normalizedTelemetry.filter(r => r.weather_code !== null).length;
                const withoutWeather = normalizedTelemetry.length - withWeather;
                console.log(`[Weather Debug] Telemetry records: ${normalizedTelemetry.length}, with weather: ${withWeather}, without: ${withoutWeather}`);
                if (normalizedTelemetry.length > 0) {
                    const sampleTs = new Date(normalizedTelemetry[0].timestamp);
                    const { dateKey, hour } = getDateKeyAndHour(sampleTs);
                    console.log(`[Weather Debug] Sample telemetry key: ${dateKey}-${hour}`);
                }
            }

            // Persist to DB
            if (normalizedTelemetry.length > 0) {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    for (const record of normalizedTelemetry) {
                        await client.query(`
                            INSERT INTO machine_telemetry (machine_serial, timestamp, data)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (machine_serial, timestamp) 
                            DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
                        `, [serial, record.timestamp, record]);
                    }
                    await client.query('COMMIT');
                } catch (e) {
                    await client.query('ROLLBACK');
                    console.error('Error persisting telemetry:', e);
                } finally {
                    client.release();
                }
            }
        } else {
            // If loading from DB, fetch machine info for header if needed
            if (!machineInfo) {
                machineInfo = await getCimbaliMachineInfo(creds, serial);
            }
        }

        // Aggregate daily data for charts
        const dailyDataMap: Record<string, { coffee: number; espresso: number }> = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        normalizedTelemetry.forEach(record => {
            const date = new Date(record.timestamp);
            const dayName = dayNames[date.getDay()];
            if (!dailyDataMap[dayName]) {
                dailyDataMap[dayName] = { coffee: 0, espresso: 0 };
            }
            dailyDataMap[dayName].coffee += record.coffee_count;
            dailyDataMap[dayName].espresso += record.espresso_count;
        });

        const dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
            name: day,
            coffee: dailyDataMap[day]?.coffee || 0,
            espresso: dailyDataMap[day]?.espresso || 0
        }));

        const totalCoffee = normalizedTelemetry.reduce((sum, r) => sum + r.coffee_count, 0);
        const totalEspresso = normalizedTelemetry.reduce((sum, r) => sum + r.espresso_count, 0);

        // Get the last record's cumulative counters
        const lastRecord = normalizedTelemetry.length > 0 ? normalizedTelemetry[normalizedTelemetry.length - 1] : null;

        // Calculate max values to avoid issues with zero-count records
        const numcaffegenerale = normalizedTelemetry.length > 0
            ? Math.max(...normalizedTelemetry.map(r => r.total_count || 0))
            : null;
        const numcappuccino = normalizedTelemetry.length > 0
            ? Math.max(...normalizedTelemetry.map(r => r.cappuccino_count || 0))
            : null;
        const numlatte = normalizedTelemetry.length > 0
            ? Math.max(...normalizedTelemetry.map(r => r.latte_count || 0))
            : null;

        console.log('[DEBUG TELEMETRY] Computed summary (using MAX):', { numcaffegenerale, numcappuccino, numlatte });

        const periodDays = Math.max(1, Math.ceil((endDateMs - startDateMs) / (24 * 60 * 60 * 1000)));

        // Collect debug raw counters: union of all parameter names with values from the last record
        const debugRawCounters: Record<string, number> = {};
        for (const record of normalizedTelemetry) {
            if (record.raw_counters) {
                for (const [key, val] of Object.entries(record.raw_counters)) {
                    debugRawCounters[key] = val as number; // last value wins
                }
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                machine: {
                    serial: serial,
                    model: machine.metadata?.model || machineInfo?.model,
                    brand: 'CIMBALI',
                    status: machineInfo?.status || 'unknown',
                    location: machineInfo?.location || null,
                    latitude: machineInfo?.latitude || null,
                    longitude: machineInfo?.longitude || null
                },
                telemetry: normalizedTelemetry,
                dailyData: dailyData,
                summary: {
                    totalCoffee,
                    totalEspresso,
                    totalDrinks: totalCoffee + totalEspresso,
                    periodDays: periodDays,
                    numcaffegenerale,
                    numcappuccino,
                    numlatte
                },
                debugFirstRecord: normalizedTelemetry.length > 0 ? normalizedTelemetry[0] : null,
                debugRawCounters: Object.keys(debugRawCounters).length > 0 ? debugRawCounters : null
            }
        });

    } catch (error) {
        console.error('Telemetry endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch telemetry data'
        });
    }
}
