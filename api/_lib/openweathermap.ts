import fetch from 'node-fetch';

interface OWMHourlyRecord {
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    clouds: number;
    weather: { id: number; main: string; description: string }[];
    rain?: { '1h': number };
    snow?: { '1h': number };
}

export interface OWMHourlyResult {
    date: string;
    hour: number;
    temperature: number;
    apparent_temperature: number;
    humidity: number;
    precipitation: number;
    weather_condition: string;
    weather_code: number;
    wind_speed: number;
    wind_direction: number;
    cloud_cover: number;
}

/**
 * Fetch hourly historical weather from OpenWeatherMap One Call 3.0 timemachine endpoint.
 * Returns 24 hourly records for the given date.
 */
export async function getHourlyHistory(
    apiKey: string,
    lat: number,
    lon: number,
    date: Date
): Promise<OWMHourlyResult[] | null> {
    const dt = Math.floor(date.getTime() / 1000);
    const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${dt}&appid=${encodeURIComponent(apiKey)}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`OWM API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = (await response.json()) as { data: OWMHourlyRecord[] };
        const hourlyRecords = data.data || [];

        return hourlyRecords.map((record) => {
            const d = new Date(record.dt * 1000);
            return {
                date: d.toISOString().split('T')[0],
                hour: d.getUTCHours(),
                temperature: record.temp,
                apparent_temperature: record.feels_like,
                humidity: record.humidity,
                precipitation: (record.rain?.['1h'] || 0) + (record.snow?.['1h'] || 0),
                weather_condition: record.weather?.[0]?.main || 'Unknown',
                weather_code: record.weather?.[0]?.id || 0,
                wind_speed: record.wind_speed,
                wind_direction: record.wind_deg,
                cloud_cover: record.clouds,
            };
        });
    } catch (error) {
        console.error('OWM API error:', error);
        return null;
    }
}
