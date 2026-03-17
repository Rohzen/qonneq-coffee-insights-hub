import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Wifi, WifiOff, RefreshCw, Database, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { TelemetryCharts } from '@/components/dashboard/TelemetryCharts';
import { WeatherWidget } from '@/components/dashboard/WeatherWidget';

interface AdminMachineDetailProps {
    machine: {
        id: string;
        serial_number: string;
        provider: string;
        model?: string;
        customer_name?: string;
        status?: string;
    };
    onBack: () => void;
}

export const AdminMachineDetail: React.FC<AdminMachineDetailProps> = ({ machine, onBack }) => {
    const { apiProvider } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('details');
    const [machineDetail, setMachineDetail] = useState<any>(null);
    const [telemetryData, setTelemetryData] = useState<any>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(true);
    const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

    // Telemetry Dialog State
    const [isTelemetryDialogOpen, setIsTelemetryDialogOpen] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // Fetch machine detail on mount
    useEffect(() => {
        fetchMachineDetail();
    }, [machine.id]);

    const fetchMachineDetail = async () => {
        setIsLoadingDetail(true);
        try {
            const response = await (apiProvider as any).getAdminMachineDetail(machine.id);
            if (response.success && response.data) {
                setMachineDetail(response.data);
            } else {
                toast({ title: 'Errore', description: response.error || 'Impossibile caricare i dettagli', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error fetching machine detail:', error);
            toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleGetTelemetry = async () => {
        setIsLoadingTelemetry(true);
        setIsTelemetryDialogOpen(false);
        try {
            const response = await (apiProvider as any).getAdminMachineTelemetry(machine.id, {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });

            if (response.success && response.data) {
                setTelemetryData(response.data);
                const recordCount = response.data.telemetry?.length || 0;
                toast({ title: 'Telemetria recuperata', description: `Ricevuti ${recordCount} record` });
            } else {
                toast({ title: 'Errore', description: response.error || 'Impossibile recuperare telemetria', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error fetching telemetry:', error);
            toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
        } finally {
            setIsLoadingTelemetry(false);
        }
    };

    const detail = machineDetail || machine;
    const isOnline = detail.isOnline || detail.status === 'online';

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div>
                                <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 mb-2 -ml-2">
                                    <ArrowLeft size={18} />
                                    <span className="text-sm">Torna alla lista macchine</span>
                                </Button>
                                <h1 className="text-3xl font-bold">{detail.serial_number || detail.serial}</h1>
                                <p className="text-gray-600">{detail.name || detail.model || 'Macchina'}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                                <div>
                                    <p className="text-xs text-gray-500">Brand</p>
                                    <p className="font-semibold text-sm">{detail.brand || detail.provider?.toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Modello</p>
                                    <p className="font-semibold text-sm">{detail.model || 'N/D'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Provider</p>
                                    <p className="font-semibold text-sm capitalize">{detail.provider}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Cliente</p>
                                    <p className="font-semibold text-sm">{detail.customer_name || 'Non assegnata'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Stato</p>
                                    <div className="flex items-center gap-2">
                                        {isOnline ? (
                                            <>
                                                <Wifi size={16} className="text-green-500" />
                                                <span className="text-green-600 font-semibold text-sm">Online</span>
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff size={16} className="text-gray-400" />
                                                <span className="text-gray-500 font-semibold text-sm">Offline</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchMachineDetail}
                                disabled={isLoadingDetail}
                            >
                                <RefreshCw size={16} className={isLoadingDetail ? 'animate-spin mr-2' : 'mr-2'} />
                                Test Connessione
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => setIsTelemetryDialogOpen(true)}
                                disabled={isLoadingTelemetry}
                            >
                                {isLoadingTelemetry ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Database size={16} className="mr-2" />}
                                {isLoadingTelemetry ? 'Caricamento...' : 'Recupera Telemetria'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isLoadingDetail && (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw size={32} className="animate-spin text-gray-400" />
                </div>
            )}

            {/* Telemetry Display */}
            {telemetryData && (
                <div className="space-y-6">
                    {/* Weather Widget if geolocation available */}
                    {(telemetryData.machine?.latitude || detail.latitude) && (
                        <WeatherWidget
                            latitude={telemetryData.machine?.latitude || detail.latitude}
                            longitude={telemetryData.machine?.longitude || detail.longitude}
                            location={telemetryData.machine?.location || detail.location}
                        />
                    )}

                    {/* Telemetry Charts */}
                    <TelemetryCharts
                        telemetry={telemetryData.telemetry || []}
                        dailyData={telemetryData.dailyData || []}
                        summary={telemetryData.summary || { totalCoffee: 0, totalEspresso: 0, totalDrinks: 0, periodDays: 7 }}
                        weather={telemetryData.weather || []}
                    />

                    {/* Alerts Section */}
                    {telemetryData.alerts && telemetryData.alerts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-yellow-500" />
                                    Allarmi Attivi ({telemetryData.alerts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {telemetryData.alerts.map((alert: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <AlertTriangle size={18} className="text-yellow-600" />
                                            <div>
                                                <p className="font-medium text-sm">{alert.type || alert.code || 'Allarme'}</p>
                                                <p className="text-xs text-gray-600">{alert.message || alert.description || 'Nessun dettaglio disponibile'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Tabs Section */}
            {!isLoadingDetail && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                        <TabsTrigger value="details" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">DETTAGLI</TabsTrigger>
                        <TabsTrigger value="location" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">POSIZIONE</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Machine Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Informazioni Macchina</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Serial Number</p>
                                            <p className="font-semibold text-sm">{detail.serial_number || detail.serial}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">External ID</p>
                                            <p className="font-semibold text-sm">{detail.external_id || 'N/D'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Modello</p>
                                            <p className="font-semibold text-sm">{detail.model || 'N/D'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Brand</p>
                                            <p className="font-semibold text-sm">{detail.brand || detail.provider?.toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Provider</p>
                                            <p className="font-semibold text-sm capitalize">{detail.provider}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Ultima Connessione</p>
                                            <p className="font-semibold text-sm">{detail.lastConnection || detail.lastSync || 'N/D'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Customer Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Cliente Assegnato</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Nome Cliente</p>
                                            <p className="font-semibold text-sm">{detail.customer_name || 'Non assegnata'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Company ID</p>
                                            <p className="font-semibold text-sm">{detail.company_id || 'N/D'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="location" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <MapPin size={20} />
                                    Geolocalizzazione
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {detail.latitude && detail.longitude ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Latitudine</p>
                                                <p className="font-semibold text-sm">{detail.latitude}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Longitudine</p>
                                                <p className="font-semibold text-sm">{detail.longitude}</p>
                                            </div>
                                        </div>
                                        {detail.location && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Indirizzo</p>
                                                <p className="font-semibold text-sm">{detail.location}</p>
                                            </div>
                                        )}
                                        {/* Embed OpenStreetMap */}
                                        <div className="mt-4 rounded-lg overflow-hidden border">
                                            <iframe
                                                title="Machine Location"
                                                width="100%"
                                                height="300"
                                                frameBorder="0"
                                                scrolling="no"
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${detail.longitude - 0.01}%2C${detail.latitude - 0.01}%2C${detail.longitude + 0.01}%2C${detail.latitude + 0.01}&layer=mapnik&marker=${detail.latitude}%2C${detail.longitude}`}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                                        <p>Geolocalizzazione non disponibile per questa macchina.</p>
                                        <p className="text-sm mt-1">Prova a recuperare i dati dal provider.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Telemetry Range Dialog */}
            {isTelemetryDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md mx-4 bg-white animate-in zoom-in-95">
                        <CardHeader>
                            <CardTitle>Recupera Telemetria</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Inizio</label>
                                <input
                                    type="date"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Fine</label>
                                <input
                                    type="date"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsTelemetryDialogOpen(false)}>Annulla</Button>
                                <Button onClick={handleGetTelemetry}>Recupera</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
