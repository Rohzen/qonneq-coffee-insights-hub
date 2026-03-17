import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coffee, Thermometer, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApiMachineData } from '@/hooks/useApiMachineData';
import { useAuth } from '@/context/AuthContext';

interface GlobalStatisticsProps {
    onBack: () => void;
}

interface AggregatedDaily {
    name: string;
    coffee: number;
    espresso: number;
}

interface MachineSummary {
    serial: string;
    name: string;
    totalCoffee: number;
    totalEspresso: number;
}

export const GlobalStatistics: React.FC<GlobalStatisticsProps> = ({ onBack }) => {
    const { machines, isLoading: machinesLoading } = useApiMachineData();
    const { apiProvider } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [totalCoffee, setTotalCoffee] = useState(0);
    const [totalEspresso, setTotalEspresso] = useState(0);
    const [totalDrinks, setTotalDrinks] = useState(0);
    const [avgTemperature, setAvgTemperature] = useState<number | null>(null);
    const [dailyData, setDailyData] = useState<AggregatedDaily[]>([]);
    const [machineSummaries, setMachineSummaries] = useState<MachineSummary[]>([]);

    useEffect(() => {
        if (machinesLoading || machines.length === 0) return;
        loadAllTelemetry();
    }, [machinesLoading, machines]);

    const loadAllTelemetry = async () => {
        setIsLoading(true);

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        const endStr = end.toISOString().split('T')[0];
        const startStr = start.toISOString().split('T')[0];

        let aggCoffee = 0;
        let aggEspresso = 0;
        let tempSum = 0;
        let tempCount = 0;
        const dailyMap: Record<string, { coffee: number; espresso: number }> = {};
        const summaries: MachineSummary[] = [];

        const promises = machines.map(async (machine) => {
            const serial = machine.serialNumber || machine.machineId || machine.id;
            try {
                const response = await apiProvider.getMachineTelemetry(serial, {
                    startDate: startStr,
                    endDate: endStr,
                    refresh: false,
                });

                if (response.success && response.data) {
                    const data = response.data as any;
                    const summary = data.summary || { totalCoffee: 0, totalEspresso: 0 };
                    const telemetry = data.telemetry || [];
                    const daily = data.dailyData || [];

                    aggCoffee += summary.totalCoffee || 0;
                    aggEspresso += summary.totalEspresso || 0;

                    summaries.push({
                        serial,
                        name: machine.name || serial,
                        totalCoffee: summary.totalCoffee || 0,
                        totalEspresso: summary.totalEspresso || 0,
                    });

                    // Aggregate temperatures
                    telemetry.forEach((r: any) => {
                        if (r.temperature != null) {
                            tempSum += r.temperature;
                            tempCount++;
                        }
                    });

                    // Aggregate daily data
                    daily.forEach((d: any) => {
                        if (!dailyMap[d.name]) {
                            dailyMap[d.name] = { coffee: 0, espresso: 0 };
                        }
                        dailyMap[d.name].coffee += d.coffee || 0;
                        dailyMap[d.name].espresso += d.espresso || 0;
                    });
                }
            } catch (err) {
                console.error(`Failed to load telemetry for ${serial}:`, err);
            }
        });

        await Promise.all(promises);

        setTotalCoffee(aggCoffee);
        setTotalEspresso(aggEspresso);
        setTotalDrinks(aggCoffee + aggEspresso);
        setAvgTemperature(tempCount > 0 ? tempSum / tempCount : null);
        setMachineSummaries(summaries.sort((a, b) => (b.totalCoffee + b.totalEspresso) - (a.totalCoffee + a.totalEspresso)));

        // Convert daily map to sorted array
        const sortedDaily = Object.entries(dailyMap)
            .map(([name, vals]) => ({ name, ...vals }))
            .sort((a, b) => a.name.localeCompare(b.name));
        setDailyData(sortedDaily);

        setIsLoading(false);
    };

    if (machinesLoading || isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                        <ArrowLeft size={18} />
                        <span className="text-sm">Indietro</span>
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-12 text-center">
                        <Loader2 size={48} className="mx-auto mb-3 text-blue-500 animate-spin" />
                        <p className="text-gray-600">Caricamento statistiche globali...</p>
                        <p className="text-sm text-gray-400 mt-1">Aggregando dati da {machines.length} macchine</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
                    <ArrowLeft size={18} />
                    <span className="text-sm flex items-center gap-1">
                        <span>Dashboard</span>
                        <span>&gt;</span>
                        <span className="text-primary">Statistiche</span>
                    </span>
                </Button>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={24} />
                Statistiche Globali
            </h2>
            <p className="text-sm text-gray-500">Dati aggregati da {machines.length} macchine - ultimi 7 giorni</p>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-amber-600" />
                            <span className="text-sm text-amber-700">Caffè Totali</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-800 mt-1">{totalCoffee}</p>
                        <p className="text-xs text-amber-600">tutte le macchine</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-orange-600" />
                            <span className="text-sm text-orange-700">Espressi Totali</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-800 mt-1">{totalEspresso}</p>
                        <p className="text-xs text-orange-600">tutte le macchine</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-700">Bevande Totali</span>
                        </div>
                        <p className="text-2xl font-bold text-green-800 mt-1">{totalDrinks}</p>
                        <p className="text-xs text-green-600">caffè + espressi</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-700">Temp. Media</span>
                        </div>
                        <p className="text-2xl font-bold text-red-800 mt-1">
                            {avgTemperature !== null ? `${avgTemperature.toFixed(1)}°C` : 'N/A'}
                        </p>
                        <p className="text-xs text-red-600">media boiler</p>
                    </CardContent>
                </Card>
            </div>

            {/* Aggregated Daily Consumption Chart */}
            {dailyData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Coffee className="w-5 h-5" />
                            Consumi Giornalieri Aggregati
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="coffee" name="Caffè" fill="#d97706" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="espresso" name="Espresso" fill="#ea580c" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Per-Machine Breakdown */}
            {machineSummaries.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Riepilogo per Macchina
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {machineSummaries.map((ms) => {
                                const total = ms.totalCoffee + ms.totalEspresso;
                                const maxTotal = machineSummaries[0]
                                    ? machineSummaries[0].totalCoffee + machineSummaries[0].totalEspresso
                                    : 1;
                                const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                                return (
                                    <div key={ms.serial} className="flex items-center gap-4">
                                        <div className="w-40 text-sm font-medium text-gray-700 truncate" title={ms.name}>
                                            {ms.name}
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-amber-500 transition-all"
                                                    style={{ width: `${maxTotal > 0 ? (ms.totalCoffee / maxTotal) * 100 : 0}%` }}
                                                />
                                                <div
                                                    className="h-full bg-orange-500 transition-all"
                                                    style={{ width: `${maxTotal > 0 ? (ms.totalEspresso / maxTotal) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-24 text-right text-sm text-gray-600">
                                            {total} bevande
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-amber-500" />
                                <span>Caffè</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-orange-500" />
                                <span>Espresso</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
