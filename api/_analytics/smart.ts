import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { query } from '../_lib/db';
import { getHistoricalWeather, parseHourlyData, getWeatherDescription } from '../_lib/weather';
import { getNearbyEvents } from '../_lib/ticketmaster';
import {
    aggregateDailySales,
    aggregateDailyPrecipitation,
    computeWeatherElasticity,
    computeEventImpact,
    computeSmartForecast,
} from '../_lib/analytics';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const auth = verifyAuth(req);
    if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const decoded = auth as any;
    const serial = req.query.serial as string;
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 90;

    if (!serial) {
        return res.status(400).json({ success: false, error: 'serial is required' });
    }

    try {
        console.log(`[Analytics] Smart analytics for serial=${serial}, lookback=${lookbackDays}`);

        // 1. Look up machine coordinates (stored in metadata JSONB)
        const machineResult = await query(
            'SELECT metadata FROM machines WHERE serial_number = $1',
            [serial]
        );

        if (!machineResult.rowCount || machineResult.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Machine not found' });
        }

        const metadata = typeof machineResult.rows[0].metadata === 'string'
            ? JSON.parse(machineResult.rows[0].metadata)
            : machineResult.rows[0].metadata || {};
        const lat = metadata.latitude ? parseFloat(metadata.latitude) : null;
        const lon = metadata.longitude ? parseFloat(metadata.longitude) : null;

        if (!lat || !lon) {
            return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        }

        // 2. Date ranges
        const now = new Date();
        const lookbackStart = new Date();
        lookbackStart.setDate(now.getDate() - lookbackDays);

        const startStr = lookbackStart.toISOString().split('T')[0];
        const endStr = now.toISOString().split('T')[0];

        // 3. Look up API credentials
        const companyId = decoded.partner_id;
        const tmCredsResult = await query(
            "SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'ticketmaster'",
            [companyId]
        );
        const tmKey = extractApiKey(tmCredsResult);

        // 4. Fetch all data in parallel
        console.log(`[Analytics] Fetching data: telemetry, weather, events for ${serial}`);
        const [telemetryResult, historicalWeatherResult, pastEventsResult, forecastWeatherResult, futureEventsResult] =
            await Promise.allSettled([
                // Telemetry from DB (90 days)
                query(
                    `SELECT timestamp, coffee_count, espresso_count
                     FROM telemetry
                     WHERE serial_number = $1 AND timestamp >= $2
                     ORDER BY timestamp ASC`,
                    [serial, startStr]
                ),
                // Historical weather (90 days) - for precipitation
                getHistoricalWeather(lat, lon, lookbackStart, now),
                // Historical events from Ticketmaster (90 days)
                tmKey
                    ? getNearbyEvents(tmKey, lat, lon, 1, lookbackDays, lookbackStart, now)
                    : Promise.resolve(null),
                // Forecast weather (7 days ahead)
                getHistoricalWeather(lat, lon, now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
                // Future events (7 days ahead)
                tmKey
                    ? getNearbyEvents(tmKey, lat, lon, 1, 7)
                    : Promise.resolve(null),
            ]);

        // 5. Extract results
        const telemetryRows =
            telemetryResult.status === 'fulfilled' ? telemetryResult.value.rows : [];
        const historicalWeatherRaw =
            historicalWeatherResult.status === 'fulfilled' ? historicalWeatherResult.value : null;
        const pastEvents =
            pastEventsResult.status === 'fulfilled' ? (pastEventsResult.value || []) : [];
        const forecastWeatherRaw =
            forecastWeatherResult.status === 'fulfilled' ? forecastWeatherResult.value : null;
        const futureEvents =
            futureEventsResult.status === 'fulfilled' ? (futureEventsResult.value || []) : [];

        console.log(`[Analytics] Data fetched: ${telemetryRows.length} telemetry rows, weather=${!!historicalWeatherRaw}, events=${pastEvents.length}, forecast=${!!forecastWeatherRaw}, futureEvents=${futureEvents.length}`);

        // 6. Parse weather data
        const historicalWeather = historicalWeatherRaw ? parseHourlyData(historicalWeatherRaw) : [];
        const forecastWeather = forecastWeatherRaw ? parseHourlyData(forecastWeatherRaw) : [];

        // 7. Aggregate daily data
        const dailySales = aggregateDailySales(telemetryRows);
        const dailyPrecip = aggregateDailyPrecipitation(historicalWeather);

        // Count unique dates with weather data
        const weatherDates = new Set(historicalWeather.map(w => w.date));
        const telemetryDates = new Set(dailySales.map(d => d.date));
        const weatherCoverage = telemetryDates.size > 0
            ? Math.round((weatherDates.size / telemetryDates.size) * 100)
            : 0;

        // 8. Compute analytics
        const weatherElasticity = computeWeatherElasticity(dailySales, dailyPrecip);
        const eventImpact = computeEventImpact(dailySales, pastEvents);
        const smartForecast = computeSmartForecast(
            dailySales,
            weatherElasticity.elasticityIndex,
            eventImpact.eventUplift,
            forecastWeather,
            futureEvents,
            getWeatherDescription
        );

        console.log(`[Analytics] Computed: elasticity=${weatherElasticity.elasticityIndex}%, eventUplift=${eventImpact.eventUplift}%`);

        return res.status(200).json({
            success: true,
            data: {
                serial,
                lookbackDays,
                dataQuality: {
                    telemetryDays: dailySales.length,
                    weatherCoverage: Math.min(100, weatherCoverage),
                    eventDataAvailable: !!tmKey,
                },
                weatherElasticity,
                eventImpact,
                smartForecast,
            },
        });
    } catch (error) {
        console.error('[Analytics] Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

function extractApiKey(result: any): string | null {
    if (!result.rowCount || result.rowCount === 0) return null;
    const creds =
        typeof result.rows[0].credentials === 'string'
            ? JSON.parse(result.rows[0].credentials)
            : result.rows[0].credentials;
    return creds.api_key || null;
}
