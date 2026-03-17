import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Coffee, Thermometer, Droplet, Zap, Cloud } from 'lucide-react';

interface TelemetryRecord {
    timestamp: string;
    coffee_count: number;
    espresso_count: number;
    total_count: number;
    temperature?: number;
    water_ph?: number;
    water_tds?: number;
    pressure?: number;
    power_consumption?: number;
}

interface DailyData {
    name: string;
    coffee: number;
    espresso: number;
}

interface TelemetryChartsProps {
    telemetry: TelemetryRecord[];
    dailyData: DailyData[];
    summary: {
        totalCoffee: number;
        totalEspresso: number;
        totalDrinks: number;
        periodDays: number;
        numcaffegenerale?: number | null;
        numcappuccino?: number | null;
        numlatte?: number | null;
    };
    weather?: any[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
    telemetry,
    dailyData,
    summary,
    weather = []
}) => {
    // Get last 24 records for temperature chart
    const temperatureData = telemetry
        .filter(r => r.temperature != null)
        .slice(0, 24)
        .reverse()
        .map(r => ({
            time: new Date(r.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            temperature: r.temperature
        }));

    // Get last 24 records for weather chart (if available)
    const weatherChartData = (weather && weather.length > 0)
        ? weather
            .slice(0, 24)
            .reverse() // Assuming weather is sorted desc like telemetry, but weather from backend might be sorted asc? Let's check.
            // Weather from backend is typically chronological (asc). Telemetry from DB usually desc?
            // Actually telemetry.ts sorts telemetry? No, getCimbaliTelemetry sorts?
            // getCimbaliTelemetry returns array. Probably chronological if API returns it so.
            // But let's check weather data structure.
            // parseHourlyData returns { date, hour, temperature... }
            .map(w => ({
                time: `${w.hour}:00`,
                temperature: w.temperature,
                timestamp: new Date(`${w.date}T${w.hour.toString().padStart(2, '0')}:00`).getTime()
            }))
            .sort((a, b) => a.timestamp - b.timestamp) // Ensure chronological
            .slice(-24) // Last 24 hours
        : [];

    // Get latest telemetry for current readings
    const latestTelemetry: Partial<TelemetryRecord> = telemetry[0] || {};

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-amber-600" />
                            <span className="text-sm text-amber-700">Caffè Totali (Contatore)</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-800 mt-1">
                            {(summary.numcaffegenerale ?? summary.totalCoffee).toLocaleString('it-IT')}
                        </p>
                        <p className="text-xs text-amber-600">
                            {summary.numcaffegenerale ? 'numcaffegenerale' : `ultimi ${summary.periodDays} giorni`}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-orange-600" />
                            <span className="text-sm text-orange-700">Cappuccini</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-800 mt-1">
                            {(summary.numcappuccino ?? 0).toLocaleString('it-IT')}
                        </p>
                        <p className="text-xs text-orange-600">numcappuccino</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-rose-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Coffee className="w-5 h-5 text-rose-600" />
                            <span className="text-sm text-rose-700">Latte</span>
                        </div>
                        <p className="text-2xl font-bold text-rose-800 mt-1">
                            {(summary.numlatte ?? 0).toLocaleString('it-IT')}
                        </p>
                        <p className="text-xs text-rose-600">numlatte</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-700">Temperatura</span>
                        </div>
                        <p className="text-2xl font-bold text-red-800 mt-1">
                            {latestTelemetry.temperature ? `${latestTelemetry.temperature}°C` : 'N/A'}
                        </p>
                        <p className="text-xs text-red-600">attuale</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Droplet className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-blue-700">Acqua pH</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-800 mt-1">
                            {latestTelemetry.water_ph ? latestTelemetry.water_ph.toFixed(1) : 'N/A'}
                        </p>
                        <p className="text-xs text-blue-600">qualità</p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Consumption Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Coffee className="w-5 h-5" />
                        Consumi Giornalieri
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

            {/* Temperature Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Machine Temperature Chart */}
                {temperatureData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Thermometer className="w-5 h-5" />
                                Temp. Macchina (24h)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={temperatureData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} unit="°C" />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="temperature"
                                        stroke="#dc2626"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Boiler"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Weather Temperature Chart */}
                {weatherChartData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Cloud className="w-5 h-5 text-blue-500" />
                                Temp. Esterna (24h)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={weatherChartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} unit="°C" />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="temperature"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Esterna"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
