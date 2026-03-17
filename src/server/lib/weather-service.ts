import { query } from './db';
import { getHourlyHistory, OWMHourlyResult } from './openweathermap';
import { getHistoricalWeather, parseHourlyData } from './weather';

export interface NormalizedHourlyWeather {
    date: string;
    hour: number;
    temperature: number | null;
    apparent_temperature: number | null;
    humidity: number | null;
    precipitation: number | null;
    weather_condition: string;
    weather_code: number | null;
    wind_speed: number | null;
    wind_direction: number | null;
    cloud_cover: number | null;
}

/**
 * Map WMO weather codes (Open-Meteo) to human-readable condition strings.
 */
function wmoCodeToCondition(code: number | null): string {
    if (code === null) return 'Unknown';
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Clouds';
    if (code <= 49) return 'Fog';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 84) return 'Rain';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
}

/**
 * Normalize OWM data to common format.
 */
function normalizeOWM(records: OWMHourlyResult[]): NormalizedHourlyWeather[] {
    return records.map((r) => ({
        date: r.date,
        hour: r.hour,
        temperature: r.temperature,
        apparent_temperature: r.apparent_temperature,
        humidity: r.humidity,
        precipitation: r.precipitation,
        weather_condition: r.weather_condition,
        weather_code: r.weather_code,
        wind_speed: r.wind_speed,
        wind_direction: r.wind_direction,
        cloud_cover: r.cloud_cover,
    }));
}

/**
 * Normalize Open-Meteo parsed data to common format.
 */
function normalizeOpenMeteo(records: any[]): NormalizedHourlyWeather[] {
    return records.map((r) => ({
        date: r.date,
        hour: r.hour,
        temperature: r.temperature,
        apparent_temperature: r.apparent_temperature,
        humidity: r.humidity,
        precipitation: r.precipitation,
        weather_condition: wmoCodeToCondition(r.weather_code),
        weather_code: r.weather_code,
        wind_speed: r.wind_speed,
        wind_direction: r.wind_direction,
        cloud_cover: r.cloud_cover,
    }));
}

/**
 * Weather service facade: uses OWM if an API key is configured for the company,
 * otherwise falls back to Open-Meteo (free, no key required).
 */
export async function getWeatherData(
    companyId: number,
    lat: number,
    lon: number,
    days: number = 7
): Promise<{ provider: string; data: NormalizedHourlyWeather[] }> {
    // Check if OpenWeatherMap credentials exist
    let owmKey: string | null = null;
    try {
        const result = await query(
            "SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'openweathermap'",
            [companyId]
        );
        if (result.rowCount && result.rowCount > 0) {
            const creds = typeof result.rows[0].credentials === 'string'
                ? JSON.parse(result.rows[0].credentials)
                : result.rows[0].credentials;
            owmKey = creds.api_key || null;
        }
    } catch (err) {
        console.error('Error fetching OWM credentials:', err);
    }

    if (owmKey) {
        // Use OpenWeatherMap
        const allRecords: NormalizedHourlyWeather[] = [];
        for (let d = 0; d < days; d++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - d));
            const hourly = await getHourlyHistory(owmKey, lat, lon, date);
            if (hourly) {
                allRecords.push(...normalizeOWM(hourly));
            }
        }
        return { provider: 'openweathermap', data: allRecords };
    }

    // Fallback to Open-Meteo
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const raw = await getHistoricalWeather(lat, lon, startDate, endDate);
    const parsed = parseHourlyData(raw);
    return { provider: 'open-meteo', data: normalizeOpenMeteo(parsed) };
}
