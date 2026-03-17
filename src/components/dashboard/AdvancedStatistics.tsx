import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ScatterChart, Scatter, Cell, Legend, ZAxis
} from 'recharts';
import { EnrichedMachineContext } from '@/types/dashboard';
import { Cloud, Sun, CloudRain, Loader2 } from 'lucide-react';

interface AdvancedStatisticsProps {
    context: EnrichedMachineContext | null;
    isLoading: boolean;
    telemetryData: any;
}

type WeatherFilter = 'all' | 'clear' | 'clouds' | 'rain';

const WEATHER_FILTERS: { value: WeatherFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Tutti', icon: null },
    { value: 'clear', label: 'Sereno', icon: <Sun size={14} /> },
    { value: 'clouds', label: 'Nuvoloso', icon: <Cloud size={14} /> },
    { value: 'rain', label: 'Pioggia', icon: <CloudRain size={14} /> },
];

function classifyWeather(condition: string): WeatherFilter {
    const c = condition.toLowerCase();
    if (c.includes('clear') || c.includes('sun')) return 'clear';
    if (c.includes('rain') || c.includes('drizzle') || c.includes('thunder') || c.includes('storm')) return 'rain';
    if (c.includes('cloud') || c.includes('overcast') || c.includes('fog')) return 'clouds';
    return 'clear';
}

const WEATHER_COLORS: Record<WeatherFilter, string> = {
    all: '#6b7280',
    clear: '#f59e0b',
    clouds: '#9ca3af',
    rain: '#3b82f6',
};

export const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({ context, isLoading, telemetryData }) => {
    const [weatherFilter, setWeatherFilter] = useState<WeatherFilter>('all');

    // Build hourly coffee data from telemetry
    const hourlyCoffeeMap = useMemo(() => {
        const map: Record<number, number[]> = {};
        const telemetry = telemetryData?.telemetry || [];

        for (const record of telemetry) {
            if (record.timestamp) {
                const hour = new Date(record.timestamp).getHours();
                if (!map[hour]) map[hour] = [];
                const coffeeCount = (record.coffee || 0) + (record.espresso || 0);
                if (coffeeCount > 0) {
                    map[hour].push(coffeeCount);
                }
            }
        }

        return map;
    }, [telemetryData]);

    // Build hourly weather map
    const hourlyWeatherMap = useMemo(() => {
        if (!context?.weather?.hourly) return {};
        const map: Record<number, { conditions: string[]; temps: number[] }> = {};

        for (const w of context.weather.hourly) {
            if (!map[w.hour]) map[w.hour] = { conditions: [], temps: [] };
            map[w.hour].conditions.push(w.weather_condition);
            if (w.temperature !== null) map[w.hour].temps.push(w.temperature);
        }

        return map;
    }, [context?.weather?.hourly]);

    // Get footfall for today
    const todayFootfall = useMemo(() => {
        if (!context?.footfall?.forecast?.days) return null;
        const dayOfWeek = (new Date().getDay() + 6) % 7; // Monday=0
        return context.footfall.forecast.days[dayOfWeek] || null;
    }, [context?.footfall?.forecast]);

    // Composed chart data (hourly)
    const composedData = useMemo(() => {
        const data = [];
        for (let h = 0; h < 24; h++) {
            const coffeeValues = hourlyCoffeeMap[h] || [];
            const avgCoffee = coffeeValues.length > 0
                ? Math.round(coffeeValues.reduce((a, b) => a + b, 0) / coffeeValues.length)
                : 0;

            const footfallEntry = todayFootfall?.hourly?.find((f) => f.hour === h);
            const footfallIntensity = footfallEntry?.intensity || 0;

            const weatherData = hourlyWeatherMap[h];
            const dominantCondition = weatherData?.conditions?.length
                ? getMostCommon(weatherData.conditions)
                : 'Clear';
            const weatherClass = classifyWeather(dominantCondition);

            // Apply weather filter
            if (weatherFilter !== 'all' && weatherClass !== weatherFilter) {
                continue;
            }

            data.push({
                hour: `${h}:00`,
                coffee: avgCoffee,
                footfall: footfallIntensity,
                weather: weatherClass,
            });
        }
        return data;
    }, [hourlyCoffeeMap, todayFootfall, hourlyWeatherMap, weatherFilter]);

    // Scatter chart data (correlation)
    const scatterData = useMemo(() => {
        if (!todayFootfall?.hourly) return [];
        return todayFootfall.hourly
            .filter((f) => f.intensity > 0)
            .map((f) => {
                const coffeeValues = hourlyCoffeeMap[f.hour] || [];
                const avgCoffee = coffeeValues.length > 0
                    ? Math.round(coffeeValues.reduce((a, b) => a + b, 0) / coffeeValues.length)
                    : 0;

                const weatherData = hourlyWeatherMap[f.hour];
                const dominantCondition = weatherData?.conditions?.length
                    ? getMostCommon(weatherData.conditions)
                    : 'Clear';

                return {
                    footfall: f.intensity,
                    coffee: avgCoffee,
                    weather: classifyWeather(dominantCondition),
                };
            });
    }, [todayFootfall, hourlyCoffeeMap, hourlyWeatherMap]);

    // KPI: event days vs normal days
    const kpiData = useMemo(() => {
        const eventDates = new Set(context?.events?.items?.map((e) => e.date) || []);
        const dailyCoffee: Record<string, number> = {};

        const telemetry = telemetryData?.telemetry || [];
        for (const record of telemetry) {
            if (record.timestamp) {
                const dateStr = new Date(record.timestamp).toISOString().split('T')[0];
                const coffeeCount = (record.coffee || 0) + (record.espresso || 0);
                dailyCoffee[dateStr] = (dailyCoffee[dateStr] || 0) + coffeeCount;
            }
        }

        let eventDayTotal = 0, eventDayCount = 0;
        let normalDayTotal = 0, normalDayCount = 0;

        for (const [date, count] of Object.entries(dailyCoffee)) {
            if (eventDates.has(date)) {
                eventDayTotal += count;
                eventDayCount++;
            } else {
                normalDayTotal += count;
                normalDayCount++;
            }
        }

        return {
            eventDayAvg: eventDayCount > 0 ? Math.round(eventDayTotal / eventDayCount) : 0,
            normalDayAvg: normalDayCount > 0 ? Math.round(normalDayTotal / normalDayCount) : 0,
            eventDays: eventDayCount,
            normalDays: normalDayCount,
        };
    }, [context?.events?.items, telemetryData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-500">Caricamento statistiche avanzate...</span>
            </div>
        );
    }

    if (!context && !telemetryData) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-gray-500">
                    <p>Recupera la telemetria per visualizzare le statistiche avanzate.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Weather filter toolbar */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 mr-2">Filtro meteo:</span>
                {WEATHER_FILTERS.map((filter) => (
                    <Badge
                        key={filter.value}
                        variant={weatherFilter === filter.value ? 'default' : 'outline'}
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => setWeatherFilter(filter.value)}
                    >
                        {filter.icon}
                        {filter.label}
                    </Badge>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Media caffe giorni evento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-600">{kpiData.eventDayAvg}</p>
                        <p className="text-xs text-gray-400 mt-1">{kpiData.eventDays} giorni con eventi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Media caffe giorni normali</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gray-700">{kpiData.normalDayAvg}</p>
                        <p className="text-xs text-gray-400 mt-1">{kpiData.normalDays} giorni normali</p>
                    </CardContent>
                </Card>
            </div>

            {/* Composed Chart: Coffee + Footfall by hour */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Consumi orari vs Affluenza</CardTitle>
                </CardHeader>
                <CardContent>
                    {composedData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={composedData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" label={{ value: 'Caffe', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Affluenza %', angle: 90, position: 'insideRight', style: { fontSize: 12 } }} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="coffee" name="Caffe" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="footfall" name="Affluenza %" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Nessun dato disponibile per il filtro selezionato</p>
                    )}
                </CardContent>
            </Card>

            {/* Scatter Chart: Correlation */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Correlazione Affluenza - Consumi</CardTitle>
                </CardHeader>
                <CardContent>
                    {scatterData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="footfall" name="Affluenza" unit="%" tick={{ fontSize: 12 }} />
                                <YAxis type="number" dataKey="coffee" name="Caffe" tick={{ fontSize: 12 }} />
                                <ZAxis range={[40, 200]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Orario" data={scatterData}>
                                    {scatterData.map((entry, index) => (
                                        <Cell key={index} fill={WEATHER_COLORS[entry.weather] || '#6b7280'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-gray-500 py-8">
                            Dati di affluenza non disponibili. Configura BestTime.app nelle impostazioni API.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

function getMostCommon(arr: string[]): string {
    const freq: Record<string, number> = {};
    for (const item of arr) {
        freq[item] = (freq[item] || 0) + 1;
    }
    let maxCount = 0;
    let result = arr[0];
    for (const [key, count] of Object.entries(freq)) {
        if (count > maxCount) {
            maxCount = count;
            result = key;
        }
    }
    return result;
}
