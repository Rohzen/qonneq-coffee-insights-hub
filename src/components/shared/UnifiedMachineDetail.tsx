import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, BarChart3, AlertTriangle, Wifi, WifiOff, Phone, Activity, MapPin, Droplets, Clock, Droplet, Calendar, RefreshCw, Database, Cloud, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TelemetryCharts } from '../dashboard/TelemetryCharts';
import { WeatherWidget } from '../dashboard/WeatherWidget';
import { TelemetryDateRangeDialog } from './TelemetryDateRangeDialog';
import { TelemetryRecordsTree } from './TelemetryRecordsTree';
import { WaterFilterSelector } from './WaterFilterSelector';
import { SmartAnalyticsPanel } from '../dashboard/SmartAnalyticsPanel';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import coffeeMachineImage from '@/assets/coffee-machine-s30.png';

interface UnifiedMachineDetailProps {
    onBack: () => void;
    machine: {
        id: string;
        name?: string;
        brand?: string;
        family?: string;
        model?: string;
        serial: string;
        lastSync?: string;
        hasAlarm?: boolean;
        isOnline?: boolean;
        provider?: string;
        status?: string;
        companyName?: string;
        waterFilter?: string;
        waterFilterName?: string;
        // Geodata fields
        latitude?: number | null;
        longitude?: number | null;
        location?: string | null;
        // Admin fields
        serial_number?: string;
        customer_name?: string;
        company_id?: string;
        external_id?: string;
    };
    isAdmin?: boolean;
}

export const UnifiedMachineDetail: React.FC<UnifiedMachineDetailProps> = ({
    onBack,
    machine,
    isAdmin = false
}) => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('details');
    const [telemetryData, setTelemetryData] = useState<any>(null);
    const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
    const [isTelemetryDialogOpen, setIsTelemetryDialogOpen] = useState(false);
    const [dataSizeKb, setDataSizeKb] = useState<number | null>(null);
    const [waterFilter, setWaterFilter] = useState({
        id: machine.waterFilter,
        name: machine.waterFilterName || 'PURITY C150 iQ Quell ST'
    });

    // Normalize machine data for display
    const serialNumber = machine.serial || machine.serial_number || '';
    const machineName = machine.name || `${machine.model || machine.family || 'Macchina'} (${serialNumber})`;
    const brand = machine.brand || machine.provider?.toUpperCase() || 'N/D';
    const model = machine.model || machine.family || 'N/D';
    const isOnline = machine.isOnline || machine.status === 'online';
    const hasAlarm = machine.hasAlarm || machine.status === 'alarm' || machine.status === 'warning';
    const provider = machine.provider || 'cimbali';
    const companyName = machine.companyName || machine.customer_name || 'Non assegnata';
    const lastSync = machine.lastSync || 'N/D';


    // Load default telemetry (7 days) from cache on mount
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 7);
        const endStr = end.toISOString().split('T')[0];
        const startStr = start.toISOString().split('T')[0];
        handleGetTelemetry(startStr, endStr, false);
    }, [machine.serial, machine.id]);

    const handleGetTelemetry = async (startDate: string, endDate: string, refresh: boolean = true) => {
        setIsLoadingTelemetry(true);
        setIsTelemetryDialogOpen(false);
        try {
            const params = { startDate, endDate, refresh };
            const response = isAdmin
                ? await (apiProvider as any).getAdminMachineTelemetry(machine.id, params)
                : await apiProvider.getMachineTelemetry(serialNumber, params);

            if (response.success && response.data) {
                setTelemetryData(response.data);
                const data = response.data as any;
                const recordCount = data.telemetry?.length || 0;

                // Calculate approximate data size in KB
                const jsonString = JSON.stringify(response.data);
                const sizeBytes = new Blob([jsonString]).size;
                const sizeKb = sizeBytes / 1024;
                setDataSizeKb(sizeKb);

                if (refresh) {
                    toast({
                        title: 'Telemetria recuperata',
                        description: `Ricevuti ${recordCount} record (${sizeKb.toFixed(2)} KB)`
                    });
                }
            } else {
                toast({
                    title: 'Errore',
                    description: response.error || 'Impossibile recuperare telemetria',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
        } finally {
            setIsLoadingTelemetry(false);
        }
    };

    const handleWaterFilterChange = (filterId: string, filterName: string) => {
        setWaterFilter({ id: filterId, name: filterName });
    };

    return (
        <div className="space-y-6">
            {/* Header Section with Machine Info and Quick Actions */}
            <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Machine Header Info */}
                        <div className="flex items-start gap-6">
                            <div className="hidden md:block bg-gray-50 rounded-lg p-4 flex-shrink-0">
                                <img
                                    src={coffeeMachineImage}
                                    alt="Coffee Machine"
                                    className="w-32 h-32 object-contain"
                                />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 mb-2 -ml-2">
                                        <ArrowLeft size={18} />
                                        <span className="text-sm flex items-center gap-1">
                                            <span>Dashboard</span>
                                            <span>&gt;</span>
                                            <span className="text-primary">Macchine</span>
                                        </span>
                                    </Button>
                                    <h1 className="text-3xl font-bold">{serialNumber}</h1>
                                    <p className="text-gray-600">{machineName}</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Brand / Modello</p>
                                        <p className="font-semibold text-sm">{brand} - {model}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Provider</p>
                                        <p className="font-semibold text-sm capitalize">{provider}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Ultima Sincronizzazione</p>
                                        <p className="font-semibold text-sm">{lastSync}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Azienda</p>
                                        <p className="font-semibold text-sm">{companyName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Stato</p>
                                        <div className="flex items-center gap-2">
                                            {isOnline ? (
                                                <>
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    <span className="text-green-600 font-semibold text-sm">Connesso</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                                    <span className="text-gray-500 font-semibold text-sm">Offline</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="flex items-center gap-2" style={{ display: 'none' }}>
                                <BarChart3 size={16} />
                                Consumi
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center gap-2" style={{ display: 'none' }}>
                                <AlertTriangle size={16} />
                                Guasti
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2" style={{ display: 'none' }}
                            >
                                <Droplets size={16} />
                                Qualità dell'acqua
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center gap-2" style={{ display: 'none' }}>
                                <Wifi size={16} />
                                Connettività
                            </Button>
                            <Button variant="outline" size="sm" className="flex items-center gap-2" style={{ display: 'none' }}>
                                <Phone size={16} />
                                Contatti
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                onClick={() => setIsTelemetryDialogOpen(true)}
                                disabled={isLoadingTelemetry}
                            >
                                {isLoadingTelemetry ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
                                {isLoadingTelemetry ? 'Caricamento...' : 'Recupera Telemetria'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={async () => {
                                    const end = new Date();
                                    const start = new Date();
                                    start.setDate(end.getDate() - 7);
                                    const endStr = end.toISOString().split('T')[0];
                                    const startStr = start.toISOString().split('T')[0];
                                    setIsLoadingTelemetry(true);
                                    try {
                                        const params = { startDate: startStr, endDate: endStr, refresh: true };
                                        const response = isAdmin
                                            ? await (apiProvider as any).getAdminMachineTelemetry(machine.id, params)
                                            : await apiProvider.getMachineTelemetry(serialNumber, params);
                                        if (response.success && response.data) {
                                            setTelemetryData(response.data);
                                            const records = response.data.telemetry || [];
                                            const withWeather = records.filter((r: any) => r.weather_code !== null && r.weather_code !== undefined).length;
                                            toast({
                                                title: 'Weather Debug',
                                                description: `${withWeather}/${records.length} record con dati meteo`
                                            });
                                        } else {
                                            toast({ title: 'Errore', description: response.error || 'Errore meteo', variant: 'destructive' });
                                        }
                                    } catch {
                                        toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
                                    } finally {
                                        setIsLoadingTelemetry(false);
                                    }
                                }}
                                disabled={isLoadingTelemetry}
                            >
                                {isLoadingTelemetry ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
                                Get Weather
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 h-12">
                    <TabsTrigger value="details" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">DETTAGLI</TabsTrigger>
                    <TabsTrigger value="location" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">POSIZIONE</TabsTrigger>
                    <TabsTrigger value="performance" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">MANUTENZIONE/PERFORMANCE</TabsTrigger>
                    <TabsTrigger value="analytics" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">ANALYTICS</TabsTrigger>
                    <TabsTrigger value="debug" className="text-sm text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white font-semibold">DEBUG</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    {/* Telemetry Display Section */}
                    {telemetryData && (
                        <div className="space-y-6">
                            {/* Telemetry Charts */}
                            <TelemetryCharts
                                telemetry={telemetryData.telemetry || []}
                                dailyData={telemetryData.dailyData || []}
                                summary={telemetryData.summary || { totalCoffee: 0, totalEspresso: 0, totalDrinks: 0, periodDays: 7 }}
                            />

                            {/* Telemetry Records Tree */}
                            <TelemetryRecordsTree
                                telemetry={telemetryData.telemetry || []}
                                dataSizeKb={dataSizeKb || undefined}
                            />
                        </div>
                    )}

                    {/* Water Filter Section */}
                    <WaterFilterSelector
                        machineId={machine.id}
                        currentFilter={waterFilter}
                        isAdmin={isAdmin}
                        onFilterChange={handleWaterFilterChange}
                    />
                </TabsContent>

                <TabsContent value="location" className="space-y-6">
                    {/* Weather Widget */}
                    <WeatherWidget
                        latitude={telemetryData?.machine?.latitude || machine.latitude}
                        longitude={telemetryData?.machine?.longitude || machine.longitude}
                        location={telemetryData?.machine?.location || machine.location}
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <MapPin size={20} />
                                Geolocalizzazione
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Use machine props as primary source, telemetry as fallback */}
                            {(() => {
                                const lat = machine.latitude || telemetryData?.machine?.latitude;
                                const lng = machine.longitude || telemetryData?.machine?.longitude;
                                const loc = machine.location || telemetryData?.machine?.location;

                                if (lat && lng) {
                                    return (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Latitudine</p>
                                                    <p className="font-semibold text-sm">{lat}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Longitudine</p>
                                                    <p className="font-semibold text-sm">{lng}</p>
                                                </div>
                                            </div>
                                            {loc && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Indirizzo</p>
                                                    <p className="font-semibold text-sm">{loc}</p>
                                                </div>
                                            )}
                                            {/* Map Embed */}
                                            <div className="mt-4 rounded-lg overflow-hidden border">
                                                <iframe
                                                    title="Machine Location"
                                                    width="100%"
                                                    height="300"
                                                    frameBorder="0"
                                                    scrolling="no"
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.01}%2C${Number(lat) - 0.01}%2C${Number(lng) + 0.01}%2C${Number(lat) + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div className="text-center py-8 text-gray-500">
                                            <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                                            <p>Geolocalizzazione non disponibile per questa macchina.</p>
                                            <p className="text-sm mt-1">I dati di posizione verranno sincronizzati con il prossimo aggiornamento.</p>
                                        </div>
                                    );
                                }
                            })()}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    {/* Maintenance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-blue-700">Giorni di manutenzione</p>
                                    <Activity size={16} className="text-blue-500" />
                                </div>
                                <p className="text-xs text-blue-600">Manutenzione</p>
                                <div className="mt-4 flex justify-center">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#e0e7ff"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="3"
                                                strokeDasharray="74, 100"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-bold text-blue-700">74 %</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-gray-600 mt-2">138 Giorni</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-blue-700">Cicli di manutenzione</p>
                                    <Activity size={16} className="text-blue-500" />
                                </div>
                                <p className="text-xs text-blue-600">Manutenzione</p>
                                <div className="mt-4 flex justify-center">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#e0e7ff"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="3"
                                                strokeDasharray="89, 100"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-bold text-blue-700">89 %</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-gray-600 mt-2">26850 Cicli</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-amber-700">Coffee</p>
                                    <Activity size={16} className="text-amber-500" />
                                </div>
                                <p className="text-xs text-amber-600">Performance</p>
                                <div className="mt-4 flex justify-center">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#fef3c7"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#f59e0b"
                                                strokeWidth="3"
                                                strokeDasharray="18.5, 100"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-bold text-amber-700">18.50 %</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-gray-600 mt-2">53.2 Caffè/Giorno</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-rose-50 to-rose-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-rose-700">Latte</p>
                                    <Activity size={16} className="text-rose-500" />
                                </div>
                                <p className="text-xs text-rose-600">Performance</p>
                                <div className="mt-4 flex justify-center">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#fce7f3"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#f43f5e"
                                                strokeWidth="3"
                                                strokeDasharray="24.5, 100"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-bold text-rose-700">24.50 %</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-gray-600 mt-2">45.8 Porzioni/Giorno</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-emerald-700">Coffee Cleaning</p>
                                    <Activity size={16} className="text-emerald-500" />
                                </div>
                                <p className="text-xs text-emerald-600">Performance</p>
                                <div className="mt-4 flex justify-center">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#d1fae5"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#10b981"
                                                strokeWidth="3"
                                                strokeDasharray="7.2, 100"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-bold text-emerald-700">7.20 %</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-gray-600 mt-2">3 Lavaggi Eseguiti</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Water Filter Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Stato filtro dell'acqua</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Clock size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">DURATA RIMANENTE</p>
                                        <p className="text-2xl font-bold">7 settimane</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Activity size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">CAPACITÀ RIMANENTE</p>
                                        <p className="text-2xl font-bold">20 litri</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Droplet size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">CONSUMO SETTIMANA SCORSA</p>
                                        <p className="text-2xl font-bold">50 litri</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <SmartAnalyticsPanel serial={serialNumber} isAdmin={isAdmin} />
                </TabsContent>

                <TabsContent value="debug" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-red-600">Debug: Telemetry Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs max-h-[300px]">
                                {JSON.stringify(telemetryData?.summary || {}, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-red-600">Debug: First Telemetry Record (raw from API)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs max-h-[300px]">
                                {JSON.stringify(telemetryData?.debugFirstRecord || telemetryData?.telemetry?.[0] || {}, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-red-600">Debug: Last Telemetry Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs max-h-[300px]">
                                {JSON.stringify(telemetryData?.telemetry?.[telemetryData?.telemetry?.length - 1] || {}, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-red-600">
                                Debug: Raw Cimbali API Counters (all parameter names from GetReportConsumeBetween)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {telemetryData?.debugRawCounters ? (
                                <div className="overflow-auto max-h-[400px]">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-red-50 sticky top-0">
                                                <th className="text-left p-2 border-b font-semibold text-red-700">#</th>
                                                <th className="text-left p-2 border-b font-semibold text-red-700">Parameter Name</th>
                                                <th className="text-right p-2 border-b font-semibold text-red-700">Value (last record)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(telemetryData.debugRawCounters)
                                                .sort(([a], [b]) => a.localeCompare(b))
                                                .map(([name, value], idx) => (
                                                    <tr key={name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="p-2 border-b text-gray-400">{idx + 1}</td>
                                                        <td className="p-2 border-b font-mono text-xs">{name}</td>
                                                        <td className="p-2 border-b text-right font-mono text-xs">{String(value)}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Total: {Object.keys(telemetryData.debugRawCounters).length} parameters
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No raw counters available. Fetch fresh telemetry data with "Recupera Telemetria" to see API parameter names.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Telemetry Date Range Dialog */}
            <TelemetryDateRangeDialog
                open={isTelemetryDialogOpen}
                onClose={() => setIsTelemetryDialogOpen(false)}
                onSubmit={handleGetTelemetry}
                isLoading={isLoadingTelemetry}
            />
        </div>
    );
};
