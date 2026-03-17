import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';
import { getCimbaliTelemetry, getCimbaliAlerts, getCimbaliMachineInfo, CimbaliCredentials } from '../../_lib/cimbali';
import { buildWeatherIndex, getDateKeyAndHour, getHistoricalWeather, getWeatherDescription, getWeatherIconKey, parseHourlyData } from '../../_lib/weather';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = await verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    const { machineId } = req.query;
    const days = parseInt(req.query.days as string) || 7;
    const startDateParam = req.query.startDate as string | undefined;
    const endDateParam = req.query.endDate as string | undefined;

    if (!machineId || typeof machineId !== 'string') {
        return res.status(400).json({ success: false, error: 'Machine ID is required' });
    }

    try {
        // Fetch machine from database
        const machineResult = await query(`
            SELECT 
                m.id,
                m.serial_number,
                m.provider,
                m.company_id,
                m.metadata,
                c.name as customer_name
            FROM machines m
            LEFT JOIN companies c ON m.company_id = c.id
            WHERE m.id = $1
        `, [machineId]);

        if (machineResult.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Machine not found' });
        }

        const dbMachine = machineResult.rows[0];
        const metadata = dbMachine.metadata || {};

        let telemetryData: any[] = [];
        let alerts: any[] = [];
        let weatherData: any[] = [];
        let dailyData: { day: string; coffee: number; espresso: number }[] = [];
        let summary = {
            totalCoffee: 0,
            totalEspresso: 0,
            totalDrinks: 0,
            periodDays: days
        };

        // Fetch telemetry from provider (Cimbali)
        if (dbMachine.provider === 'cimbali' && dbMachine.company_id) {
            try {
                // Find credentials for this machine's company
                const credResult = await query(
                    'SELECT * FROM api_credentials WHERE company_id = $1 AND provider = $2',
                    [dbMachine.company_id, 'cimbali']
                );

                if (credResult.rowCount && credResult.rowCount > 0) {
                    const cred = credResult.rows[0];
                    const cimbaliCreds: CimbaliCredentials = {
                        username: cred.username,
                        password: cred.password
                    };

                    // Calculate date range
                    let startDate: Date;
                    let endDate: Date;

                    if (startDateParam || endDateParam) {
                        startDate = startDateParam ? new Date(`${startDateParam}T00:00:00`) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                        endDate = endDateParam ? new Date(`${endDateParam}T23:59:59`) : new Date();
                        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            return res.status(400).json({ success: false, error: 'Invalid startDate or endDate' });
                        }
                    } else {
                        endDate = new Date();
                        startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
                    }

                    // Fetch telemetry
                    telemetryData = await getCimbaliTelemetry(
                        cimbaliCreds,
                        dbMachine.serial_number,
                        startDate.getTime(),
                        endDate.getTime()
                    );

                    // Fetch alerts
                    alerts = await getCimbaliAlerts(cimbaliCreds, dbMachine.serial_number);

                    // Fetch Weather Data (if location available)
                    // Try metadata first, then fallback to Cimbali API for GPS
                    let lat = metadata.latitude;
                    let lng = metadata.longitude;
                    if (!lat || !lng) {
                        try {
                            const machineInfo = await getCimbaliMachineInfo(cimbaliCreds, dbMachine.serial_number);
                            if (machineInfo?.latitude && machineInfo?.longitude) {
                                lat = machineInfo.latitude;
                                lng = machineInfo.longitude;
                                console.log(`[Weather] GPS from Cimbali API: lat=${lat}, lng=${lng}`);
                            }
                        } catch (e) {
                            console.error('[Weather] Failed to get GPS from Cimbali API:', e);
                        }
                    }
                    if (lat && lng) {
                        try {
                            const weatherRaw = await getHistoricalWeather(
                                lat,
                                lng,
                                startDate,
                                endDate
                            );
                            if (weatherRaw) {
                                weatherData = parseHourlyData(weatherRaw);
                            }
                        } catch (wErr) {
                            console.error('[Weather] Fetch error:', wErr);
                        }
                    }

                    const weatherIndex = buildWeatherIndex(weatherData);

                    // Normalize telemetry (espresso_count as delta, keep unchanged rows)
                    let previousCounter: number | null = null;
                    telemetryData = telemetryData.map(record => {
                        const totalCounter = record.total_count ?? record.coffee_count ?? 0;
                        let espressoCount = 0;

                        if (totalCounter > 0 && previousCounter !== null) {
                            const delta = totalCounter - previousCounter;
                            espressoCount = delta >= 0 ? delta : totalCounter;
                        }

                        if (totalCounter > 0) {
                            previousCounter = totalCounter;
                        }

                        const timestampDate = new Date(record.timestamp);
                        const { dateKey, hour } = getDateKeyAndHour(timestampDate);
                        const weatherKey = `${dateKey}-${hour}`;
                        const weather = weatherIndex.get(weatherKey);

                        return {
                            ...record,
                            coffee_count: totalCounter,
                            espresso_count: espressoCount,
                            total_count: totalCounter,
                            weather_code: weather?.weather_code ?? null,
                            weather_description: getWeatherDescription(weather?.weather_code),
                            weather_icon: getWeatherIconKey(weather?.weather_code),
                            weather_temperature: weather?.temperature ?? null,
                        };
                    });

                    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
                    summary.periodDays = periodDays;

                    // Aggregate daily data for charts
                    const dayBuckets: Record<string, { coffee: number; espresso: number }> = {};
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                    for (const record of telemetryData) {
                        const date = new Date(record.timestamp);
                        const dayName = dayNames[date.getDay()];

                        if (!dayBuckets[dayName]) {
                            dayBuckets[dayName] = { coffee: 0, espresso: 0 };
                        }
                        dayBuckets[dayName].coffee += record.coffee_count || 0;
                        dayBuckets[dayName].espresso += record.espresso_count || 0;
                    }

                    // Reorder to start from Monday
                    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    dailyData = orderedDays.map(day => ({
                        day,
                        coffee: dayBuckets[day]?.coffee || 0,
                        espresso: dayBuckets[day]?.espresso || 0
                    }));

                    // Calculate summary
                    summary.totalCoffee = telemetryData.reduce((sum, r) => sum + (r.coffee_count || 0), 0);
                    summary.totalEspresso = telemetryData.reduce((sum, r) => sum + (r.espresso_count || 0), 0);
                    summary.totalDrinks = summary.totalCoffee + summary.totalEspresso;

                    // Get the last record's cumulative counters
                    const lastRecord = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1] : null;
                    (summary as any).numcaffegenerale = lastRecord?.total_count ?? null;
                    (summary as any).numcappuccino = lastRecord?.cappuccino_count ?? null;
                    (summary as any).numlatte = lastRecord?.latte_count ?? null;
                }
            } catch (providerError) {
                console.error('Error fetching telemetry from provider:', providerError);
                // Return empty telemetry if provider call fails
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                machine: {
                    id: dbMachine.id,
                    serial_number: dbMachine.serial_number,
                    provider: dbMachine.provider,
                    customer_name: dbMachine.customer_name,
                    model: metadata.model,
                    latitude: metadata.latitude,
                    longitude: metadata.longitude,
                    location: metadata.location
                },
                telemetry: telemetryData,
                dailyData,
                summary,
                alerts,
                weather: weatherData
            }
        });

    } catch (error) {
        console.error('Get machine telemetry error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
