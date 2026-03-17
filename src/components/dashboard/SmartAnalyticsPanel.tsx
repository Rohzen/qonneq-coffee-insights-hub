import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Cloud, Calendar, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { SmartAnalyticsData, ConfidenceLevel } from '@/types/analytics';

interface SmartAnalyticsPanelProps {
    serial: string;
    isAdmin: boolean;
}

const ConfidenceBadge: React.FC<{ level: ConfidenceLevel }> = ({ level }) => {
    const colors: Record<ConfidenceLevel, string> = {
        high: 'bg-green-100 text-green-700 border-green-300',
        medium: 'bg-amber-100 text-amber-700 border-amber-300',
        low: 'bg-red-100 text-red-700 border-red-300',
    };
    const labels: Record<ConfidenceLevel, string> = {
        high: 'Alta',
        medium: 'Media',
        low: 'Bassa',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[level]}`}>
            {labels[level]}
        </span>
    );
};

// Loading skeleton
const SkeletonCard: React.FC = () => (
    <Card className="animate-pulse">
        <CardHeader>
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
        </CardContent>
    </Card>
);

export const SmartAnalyticsPanel: React.FC<SmartAnalyticsPanelProps> = ({ serial, isAdmin }) => {
    const { apiProvider } = useAuth();
    const [data, setData] = useState<SmartAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await (apiProvider as any).getSmartAnalytics(serial, 90);
                if (cancelled) return;
                if (response.success && response.data) {
                    setData(response.data);
                } else {
                    setError(response.error || 'Errore nel recupero dei dati');
                }
            } catch (err) {
                if (!cancelled) setError('Errore di rete');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [serial, apiProvider]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Caricamento analisi avanzate...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <SkeletonCard />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-700 font-medium">{error}</p>
                    <p className="text-red-500 text-sm mt-1">Verifica che la macchina abbia coordinate e dati telemetrici.</p>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const { dataQuality, weatherElasticity, eventImpact, smartForecast } = data;

    // Forecast chart data
    const chartData = smartForecast.map((day) => ({
        name: `${day.dayOfWeek.slice(0, 3)}\n${day.date.slice(5)}`,
        previsione: day.predictedSales,
        baseline: day.baselineSales,
        meteo: day.weatherFactor,
        eventi: day.eventFactor,
    }));

    return (
        <div className="space-y-6">
            {/* Data Quality Banner */}
            <Card className="bg-gray-50 border-gray-200">
                <CardContent className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-medium text-gray-700">Qualità dati:</span>
                        <span className="text-gray-600">
                            {dataQuality.telemetryDays} giorni telemetria
                        </span>
                        <span className="text-gray-600">
                            {dataQuality.weatherCoverage}% copertura meteo
                        </span>
                        <span className={dataQuality.eventDataAvailable ? 'text-green-600' : 'text-gray-400'}>
                            {dataQuality.eventDataAvailable ? 'Ticketmaster attivo' : 'Ticketmaster non configurato'}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* 2-column grid: Weather Elasticity + Event Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weather Elasticity Card */}
                <Card className="border-sky-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Cloud className="w-5 h-5 text-sky-500" />
                                Elasticità Meteo
                            </span>
                            <ConfidenceBadge level={weatherElasticity.confidence} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <p className={`text-4xl font-bold ${weatherElasticity.elasticityIndex >= 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                                {weatherElasticity.elasticityIndex > 0 ? '+' : ''}{weatherElasticity.elasticityIndex}%
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {weatherElasticity.elasticityIndex >= 0
                                    ? 'Vendite superiori nei giorni di pioggia'
                                    : 'Vendite inferiori nei giorni di pioggia'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase">Giorni pioggia</p>
                                <p className="text-lg font-semibold text-sky-700">{weatherElasticity.rainyDays}</p>
                                <p className="text-sm text-gray-600">media {weatherElasticity.avgSalesRainy} vendite</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase">Giorni sereni</p>
                                <p className="text-lg font-semibold text-amber-600">{weatherElasticity.clearDays}</p>
                                <p className="text-sm text-gray-600">media {weatherElasticity.avgSalesClear} vendite</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Event Impact Card */}
                <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                Impatto Eventi
                            </span>
                            <ConfidenceBadge level={eventImpact.confidence} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!dataQuality.eventDataAvailable ? (
                            <div className="text-center py-4 text-gray-400">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Ticketmaster non configurato</p>
                                <p className="text-xs">Configura le credenziali per analizzare l'impatto degli eventi</p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center">
                                    <p className={`text-4xl font-bold ${eventImpact.eventUplift >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                                        {eventImpact.eventUplift > 0 ? '+' : ''}{eventImpact.eventUplift}%
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Variazione vendite nei giorni con eventi
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase">Giorni con eventi</p>
                                        <p className="text-lg font-semibold text-purple-700">{eventImpact.eventDays}</p>
                                        <p className="text-sm text-gray-600">media {eventImpact.avgSalesEventDay} vendite</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 uppercase">Giorni normali</p>
                                        <p className="text-lg font-semibold text-gray-600">{eventImpact.nonEventDays}</p>
                                        <p className="text-sm text-gray-600">media {eventImpact.avgSalesNonEventDay} vendite</p>
                                    </div>
                                </div>
                                {/* Top Events */}
                                {eventImpact.topEvents.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Top eventi per impatto</p>
                                        <div className="space-y-1">
                                            {eventImpact.topEvents.slice(0, 3).map((ev, i) => (
                                                <div key={i} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-700 truncate flex-1 mr-2">{ev.eventName}</span>
                                                    <span className={`font-medium ${ev.uplift >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {ev.uplift > 0 ? '+' : ''}{ev.uplift}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 7-Day Smart Forecast Chart */}
            <Card className="border-amber-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        Previsione Vendite (7 giorni)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'previsione' || name === 'baseline') return [value, name === 'previsione' ? 'Previsione' : 'Baseline'];
                                    return [value, name];
                                }}
                            />
                            <Legend
                                formatter={(value: string) => {
                                    if (value === 'previsione') return 'Previsione';
                                    if (value === 'baseline') return 'Baseline storica';
                                    return value;
                                }}
                            />
                            <Bar dataKey="previsione" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                            <Line type="monotone" dataKey="baseline" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>

                    {/* Forecast Detail Table */}
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-gray-500">
                                    <th className="text-left py-2 font-medium">Giorno</th>
                                    <th className="text-right py-2 font-medium">Previsione</th>
                                    <th className="text-right py-2 font-medium">Meteo</th>
                                    <th className="text-right py-2 font-medium">Fattore meteo</th>
                                    <th className="text-right py-2 font-medium">Fattore eventi</th>
                                    <th className="text-left py-2 pl-3 font-medium">Eventi</th>
                                    <th className="text-center py-2 font-medium">Confidenza</th>
                                </tr>
                            </thead>
                            <tbody>
                                {smartForecast.map((day, i) => (
                                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-2">
                                            <span className="font-medium">{day.dayOfWeek}</span>
                                            <span className="text-gray-400 ml-2 text-xs">{day.date.slice(5)}</span>
                                        </td>
                                        <td className="text-right font-semibold text-amber-700">{day.predictedSales}</td>
                                        <td className="text-right text-gray-600 text-xs">{day.weatherDescription}</td>
                                        <td className="text-right">
                                            <span className={day.weatherFactor !== 1 ? 'text-sky-600 font-medium' : 'text-gray-400'}>
                                                x{day.weatherFactor.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <span className={day.eventFactor !== 1 ? 'text-purple-600 font-medium' : 'text-gray-400'}>
                                                x{day.eventFactor.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="text-left pl-3 text-xs text-gray-600 max-w-[200px] truncate">
                                            {day.events.length > 0 ? day.events.join(', ') : '-'}
                                        </td>
                                        <td className="text-center">
                                            <ConfidenceBadge level={day.confidence} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
