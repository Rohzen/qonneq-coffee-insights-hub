import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Droplets, MapPin } from 'lucide-react';

interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    description: string;
}

interface WeatherWidgetProps {
    latitude?: number | null;
    longitude?: number | null;
    location?: string | null;
}

// Weather codes from Open-Meteo API
function getWeatherInfo(code: number): { icon: React.ReactNode; description: string } {
    if (code === 0) return { icon: <Sun className="w-8 h-8 text-yellow-500" />, description: 'Sereno' };
    if (code <= 3) return { icon: <Cloud className="w-8 h-8 text-gray-400" />, description: 'Parzialmente nuvoloso' };
    if (code <= 48) return { icon: <Cloud className="w-8 h-8 text-gray-500" />, description: 'Nuvoloso' };
    if (code <= 67) return { icon: <CloudRain className="w-8 h-8 text-blue-500" />, description: 'Pioggia' };
    if (code <= 77) return { icon: <CloudSnow className="w-8 h-8 text-blue-300" />, description: 'Neve' };
    if (code <= 82) return { icon: <CloudRain className="w-8 h-8 text-blue-600" />, description: 'Acquazzoni' };
    return { icon: <Cloud className="w-8 h-8 text-gray-500" />, description: 'Variabile' };
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    latitude,
    longitude,
    location
}) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            // Default to Milan if no coordinates
            const lat = latitude || 45.4642;
            const lon = longitude || 9.1900;

            try {
                // Using Open-Meteo API (free, no API key required)
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
                );

                if (!response.ok) throw new Error('Weather API error');

                const data = await response.json();
                const current = data.current;

                setWeather({
                    temperature: Math.round(current.temperature_2m),
                    humidity: current.relative_humidity_2m,
                    windSpeed: Math.round(current.wind_speed_10m),
                    weatherCode: current.weather_code,
                    description: getWeatherInfo(current.weather_code).description
                });
            } catch (err) {
                console.error('Weather fetch error:', err);
                setError('Meteo non disponibile');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [latitude, longitude]);

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-sky-50 to-blue-100">
                <CardContent className="pt-4">
                    <div className="animate-pulse flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                            <div className="w-20 h-4 bg-gray-200 rounded"></div>
                            <div className="w-16 h-3 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !weather) {
        return (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Cloud className="w-5 h-5" />
                        <span className="text-sm">{error || 'Meteo non disponibile'}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const weatherInfo = getWeatherInfo(weather.weatherCode);

    return (
        <Card className="bg-gradient-to-br from-sky-50 to-blue-100 border-sky-200">
            <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {weatherInfo.icon}
                        <div>
                            <p className="text-3xl font-bold text-gray-800">{weather.temperature}°C</p>
                            <p className="text-sm text-gray-600">{weather.description}</p>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Droplets className="w-4 h-4" />
                            <span>{weather.humidity}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Wind className="w-4 h-4" />
                            <span>{weather.windSpeed} km/h</span>
                        </div>
                    </div>
                </div>
                {location && (
                    <div className="mt-3 pt-3 border-t border-sky-200 flex items-center gap-1 text-sm text-sky-700">
                        <MapPin className="w-4 h-4" />
                        <span>{location}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
