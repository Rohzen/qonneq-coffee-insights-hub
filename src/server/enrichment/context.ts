import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../lib/auth';
import { query } from '../lib/db';
import { getWeatherData, NormalizedHourlyWeather } from '../lib/weather-service';
import { getNearbyEvents, TicketmasterEvent } from '../lib/ticketmaster';
import { findNearbyVenue, getWeeklyForecast, BestTimeVenue, BestTimeWeeklyForecast } from '../lib/besttime';

interface ContextAlert {
    type: 'event' | 'weather' | 'footfall';
    severity: 'info' | 'warning';
    message: string;
}

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

    if (!serial) {
        return res.status(400).json({ success: false, error: 'serial is required' });
    }

    try {
        // Look up machine coordinates from metadata JSONB
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
        if (!metadata.latitude || !metadata.longitude) {
            return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        }

        const lat = parseFloat(metadata.latitude);
        const lon = parseFloat(metadata.longitude);
        const companyId = decoded.partner_id;

        // Load API credentials in parallel
        const [tmCreds, btCreds] = await Promise.all([
            query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'ticketmaster'", [companyId]),
            query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'besttime'", [companyId]),
        ]);

        const tmKey = extractApiKey(tmCreds);
        const btKey = extractApiKey(btCreds);

        // Fetch all data in parallel
        const [weatherResult, eventsResult, footfallResult] = await Promise.allSettled([
            getWeatherData(companyId, lat, lon, 7),
            tmKey ? getNearbyEvents(tmKey, lat, lon, 1, 7) : Promise.resolve(null),
            btKey ? fetchFootfall(btKey, lat, lon) : Promise.resolve({ venue: null, forecast: null }),
        ]);

        const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : { provider: 'none', data: [] };
        const events = eventsResult.status === 'fulfilled' ? (eventsResult.value || []) : [];
        const footfall = footfallResult.status === 'fulfilled' ? footfallResult.value : { venue: null, forecast: null };

        // Generate context alerts
        const alerts = generateAlerts(weather.data, events as TicketmasterEvent[], footfall);

        return res.status(200).json({
            success: true,
            data: {
                serial,
                weather: {
                    provider: weather.provider,
                    hourly: weather.data,
                },
                events: {
                    items: events,
                    configured: !!tmKey,
                },
                footfall: {
                    venue: footfall.venue,
                    forecast: footfall.forecast,
                    configured: !!btKey,
                },
                alerts,
            },
        });
    } catch (error) {
        console.error('Context endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

function extractApiKey(result: any): string | null {
    if (!result.rowCount || result.rowCount === 0) return null;
    const creds = typeof result.rows[0].credentials === 'string'
        ? JSON.parse(result.rows[0].credentials)
        : result.rows[0].credentials;
    return creds.api_key || null;
}

async function fetchFootfall(apiKey: string, lat: number, lon: number) {
    const venue = await findNearbyVenue(apiKey, lat, lon, 100);
    if (!venue) return { venue: null, forecast: null };
    const forecast = await getWeeklyForecast(apiKey, venue.venue_id);
    return { venue, forecast };
}

function generateAlerts(
    weather: NormalizedHourlyWeather[],
    events: TicketmasterEvent[],
    footfall: { venue: BestTimeVenue | null; forecast: BestTimeWeeklyForecast | null }
): ContextAlert[] {
    const alerts: ContextAlert[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Event alerts
    if (events && events.length > 0) {
        const todayEvents = events.filter((e) => e.date === today);
        const upcomingEvents = events.filter((e) => e.date > today).slice(0, 3);

        todayEvents.forEach((e) => {
            alerts.push({
                type: 'event',
                severity: 'warning',
                message: `Previsto "${e.name}" oggi a ${e.distance_km} km (${e.venue}) - Ticketmaster`,
            });
        });

        upcomingEvents.forEach((e) => {
            alerts.push({
                type: 'event',
                severity: 'info',
                message: `Evento "${e.name}" il ${e.date} a ${e.distance_km} km (${e.venue})`,
            });
        });
    }

    // Weather alerts
    if (weather && weather.length > 0) {
        const todayWeather = weather.filter((w) => w.date === today);
        const hasRain = todayWeather.some((w) => w.precipitation && w.precipitation > 2);
        const hasStorm = todayWeather.some((w) => w.weather_condition === 'Thunderstorm');

        if (hasStorm) {
            alerts.push({
                type: 'weather',
                severity: 'warning',
                message: 'Temporale previsto oggi - possibile impatto sui consumi',
            });
        } else if (hasRain) {
            alerts.push({
                type: 'weather',
                severity: 'info',
                message: 'Pioggia prevista oggi - possibile aumento consumi indoor',
            });
        }
    }

    // Footfall alerts
    if (footfall.forecast) {
        const dayOfWeek = (new Date().getDay() + 6) % 7; // Convert to Monday=0
        const todayForecast = footfall.forecast.days[dayOfWeek];
        if (todayForecast && todayForecast.peak_intensity > 80) {
            alerts.push({
                type: 'footfall',
                severity: 'warning',
                message: `Alta affluenza prevista oggi presso "${footfall.venue?.venue_name}" (picco ${todayForecast.peak_intensity}%)`,
            });
        }
    }

    return alerts;
}
