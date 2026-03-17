
import fetch from 'node-fetch';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

// Hourly weather variables to fetch - matching Odoo implementation
const HOURLY_VARIABLES = [
    'temperature_2m',
    'apparent_temperature',
    'relative_humidity_2m',
    'precipitation',
    'rain',
    'weather_code',
    'wind_speed_10m',
    'wind_direction_10m',
    'surface_pressure',
    'cloud_cover',
    'uv_index',
];

export interface WeatherData {
    date: string;
    hour: number;
    temperature: number | null;
    apparent_temperature: number | null;
    humidity: number | null;
    precipitation: number | null;
    rain: number | null;
    weather_code: number | null;
    wind_speed: number | null;
    wind_direction: number | null;
    pressure: number | null;
    cloud_cover: number | null;
    uv_index: number | null;
}

export async function getHistoricalWeather(latitude: number, longitude: number, startDate: Date, endDate: Date): Promise<any> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        start_date: startStr,
        end_date: endStr,
        hourly: HOURLY_VARIABLES.join(','),
        timezone: 'UTC',
    });

    // Use archive API for older dates (>5 days ago), forecast for recent
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const useArchive = startDate < fiveDaysAgo;
    const baseUrl = useArchive ? ARCHIVE_URL : FORECAST_URL;
    const url = `${baseUrl}?${params.toString()}`;

    console.log(`[Weather] Fetching from ${useArchive ? 'archive' : 'forecast'} API: ${startStr}..${endStr} (lat=${latitude}, lng=${longitude})`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const body = await response.text();
            console.error(`[Weather] API error ${response.status}: ${body}`);
            // If archive fails, try forecast as fallback
            if (useArchive) {
                console.log('[Weather] Archive API failed, trying forecast API as fallback...');
                const fallbackUrl = `${FORECAST_URL}?${params.toString()}`;
                const fallbackResponse = await fetch(fallbackUrl);
                if (fallbackResponse.ok) {
                    return await fallbackResponse.json();
                }
            }
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('[Weather] API error:', error);
        return null;
    }
}

export function parseHourlyData(data: any): WeatherData[] {
    if (!data || !data.hourly) {
        return [];
    }

    const hourly = data.hourly;
    const times = hourly.time || [];
    const result: WeatherData[] = [];

    times.forEach((timestamp: string, i: number) => {
        // Parse timestamp: '2024-01-15T14:00'
        const [dateStr, timeStr] = timestamp.split('T');
        const hour = parseInt(timeStr.split(':')[0], 10);

        // Helper to safely get value at index i
        const getValue = (key: string) => {
            const arr = hourly[key];
            return (arr && i < arr.length) ? arr[i] : null;
        };

        result.push({
            date: dateStr,
            hour: hour,
            temperature: getValue('temperature_2m'),
            apparent_temperature: getValue('apparent_temperature'),
            humidity: getValue('relative_humidity_2m'),
            precipitation: getValue('precipitation'),
            rain: getValue('rain'),
            weather_code: getValue('weather_code'),
            wind_speed: getValue('wind_speed_10m'),
            wind_direction: getValue('wind_direction_10m'),
            pressure: getValue('surface_pressure'),
            cloud_cover: getValue('cloud_cover'),
            uv_index: getValue('uv_index'),
        });
    });

    return result;
}

export const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
    0: 'Sereno',
    1: 'Prevalentemente sereno',
    2: 'Parzialmente nuvoloso',
    3: 'Coperto',
    45: 'Nebbia',
    48: 'Nebbia con brina',
    51: 'Pioviggine leggera',
    53: 'Pioviggine moderata',
    55: 'Pioviggine intensa',
    56: 'Pioviggine gelata leggera',
    57: 'Pioviggine gelata intensa',
    61: 'Pioggia debole',
    63: 'Pioggia moderata',
    65: 'Pioggia forte',
    66: 'Pioggia gelata leggera',
    67: 'Pioggia gelata forte',
    71: 'Neve debole',
    73: 'Neve moderata',
    75: 'Neve forte',
    77: 'Granuli di neve',
    80: 'Rovesci di pioggia deboli',
    81: 'Rovesci di pioggia moderati',
    82: 'Rovesci di pioggia violenti',
    85: 'Rovesci di neve deboli',
    86: 'Rovesci di neve forti',
    95: 'Temporale',
    96: 'Temporale con grandine debole',
    99: 'Temporale con grandine forte',
};

export function getWeatherDescription(code?: number | null): string | null {
    if (code === null || code === undefined) return null;
    return WEATHER_CODE_DESCRIPTIONS[code] || 'Unknown';
}

export function getWeatherIconKey(code?: number | null): string | null {
    if (code === null || code === undefined) return null;
    if (code === 0) return 'sun';
    if (code <= 3) return 'cloud';
    if (code <= 48) return 'fog';
    if (code <= 57) return 'drizzle';
    if (code <= 67) return 'rain';
    if (code <= 77) return 'snow';
    if (code <= 82) return 'rain';
    return 'thunder';
}

export function buildWeatherIndex(weatherData: WeatherData[]): Map<string, WeatherData> {
    const index = new Map<string, WeatherData>();
    for (const entry of weatherData) {
        index.set(`${entry.date}-${entry.hour}`, entry);
    }
    return index;
}

export function getDateKeyAndHour(date: Date): { dateKey: string; hour: number } {
    // Use UTC to match weather data fetched with timezone: 'UTC'
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return {
        dateKey: `${year}-${month}-${day}`,
        hour: date.getUTCHours(),
    };
}
