import React, { useState, useEffect } from 'react';
import { ArrowLeft, Droplets, MapPin, AlertTriangle, Clock, Activity, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import waterFilterImage from '@/assets/water-filter-c150.png';

interface BritaMachineDetailProps {
    onBack: () => void;
    machine: {
        id: string;
        name?: string;
        brand?: string;
        model?: string;
        serial: string;
        provider?: string;
        status?: string;
        companyName?: string;
        serial_number?: string;
        customer_name?: string;
        company_id?: string;
        external_id?: string;
        latitude?: number | null;
        longitude?: number | null;
        location?: string | null;
        metadata?: any;
    };
    isAdmin?: boolean;
}

export const BritaMachineDetail: React.FC<BritaMachineDetailProps> = ({
    onBack,
    machine,
    isAdmin = false
}) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('details');
    const [britaDetail, setBritaDetail] = useState<any>(null);
    const [machineData, setMachineData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const metadata = machine.metadata || {};

    // Prefer machineData (fresh from API) over machine (props)
    const serialNumber = machineData?.serial || machineData?.serial_number || machine.serial || machine.serial_number || '';
    const machineName = machineData?.name || machine.name || metadata.name || `${machineData?.model || metadata.model || 'BRITA'} (${serialNumber})`;
    const brand = machineData?.brand || machine.brand || metadata.brand || 'BRITA';
    const model = machineData?.model || machine.model || metadata.model || 'N/D';
    const resourceType = machineData?.resourceType || metadata.resourceType || 'Unknown';
    const status = machineData?.status || machine.status || metadata.status;
    const isOnline = status === 'online';
    const companyName = machineData?.customer_name || machine.companyName || machine.customer_name || 'Non assegnata';

    useEffect(() => {
        fetchBritaDetail(false);
    }, [machine.id]);

    const fetchBritaDetail = async (showToast = false) => {
        setIsLoading(true);
        try {
            const endpoint = `/api/admin/machines/brita-detail?machineId=${encodeURIComponent(machine.id)}`;
            const token = localStorage.getItem('qonneq_portal_auth_token');
            const res = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const response = await res.json();

            if (response.success && response.data) {
                setBritaDetail(response.data.britaDetail);
                setMachineData(response.data.machine);
                if (showToast) {
                    toast({
                        title: 'Dati aggiornati',
                        description: 'I dati BRITA sono stati aggiornati con successo.'
                    });
                }
            } else {
                toast({
                    title: 'Errore',
                    description: response.error || 'Impossibile recuperare i dettagli BRITA',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    // Extract resource data based on type
    const resource = britaDetail?.resource || {};
    const detectedType = resource.type || resourceType;

    // API sometimes returns flattened structure
    const purityCiQ = resource.purityCiQ || resource;
    const iqMeter = resource.iqMeter || resource;
    const dispenser = resource.dispenser || resource;

    const formatFirmware = (fw: any) => {
        if (!fw) return 'N/D';
        if (typeof fw === 'string') return fw;
        if (typeof fw === 'object') {
            return `${fw.major}.${fw.minor}.${fw.patch}${fw.addition ? `-${fw.addition}` : ''}`;
        }
        return 'N/D';
    };

    const lat = machineData?.latitude || machine.latitude || metadata.latitude;
    const lng = machineData?.longitude || machine.longitude || metadata.longitude;
    const loc = machineData?.location || machine.location || metadata.location;

    const renderPurityCiQDetails = () => {
        const reported = purityCiQ.reported || {};
        const cartridge = reported.cartridge || {};
        const configuration = reported.configuration || {};
        const rawWater = reported.rawWater || {};
        const volume = reported.volume || {};
        const softener = reported.softener || {};

        // Map API fields with fallbacks: API uses remainingLifetime, remainingVolume, volume.lastPeriod
        const remainingWeeks = cartridge.remainingLifetime ?? cartridge.remainingLifetimeWeeks ?? 'N/D';
        const remainingCapacity = cartridge.remainingVolume ?? cartridge.remainingCapacityLiters ?? cartridge.remainingCapacity ?? 'N/D';
        const weeklyConsumption = volume.lastPeriod ?? cartridge.weeklyConsumptionLiters ?? cartridge.weeklyConsumption ?? 'N/D';

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Droplets size={20} className="text-blue-500" />
                            Stato Cartuccia
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Clock size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">DURATA RIMANENTE</p>
                                    <p className="text-2xl font-bold">{remainingWeeks} <span className="text-sm font-normal">settimane</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Activity size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">CAPACITA RIMANENTE</p>
                                    <p className="text-2xl font-bold">{remainingCapacity} <span className="text-sm font-normal">litri</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Droplets size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">CONSUMO SETTIMANA</p>
                                    <p className="text-2xl font-bold">{weeklyConsumption} <span className="text-sm font-normal">litri</span></p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Dettagli Cartuccia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Tipo</p>
                                <p className="font-semibold text-sm">{cartridge.type?.replace(/_/g, ' ') || 'N/D'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Data Installazione</p>
                                <p className="font-semibold text-sm">
                                    {cartridge.installationDate
                                        ? new Date(cartridge.installationDate).toLocaleDateString('it-IT')
                                        : 'N/D'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Stato Lavaggio</p>
                                <p className="font-semibold text-sm">{cartridge.flushingState || reported.flushStatus || cartridge.flushStatus || 'N/D'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Bypass Correction</p>
                                <p className="font-semibold text-sm">{configuration.bypassCorrection ?? reported.bypassCorrection ?? cartridge.bypassCorrection ?? 'N/D'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Firmware</p>
                                <p className="font-semibold text-sm">{formatFirmware(reported.firmwareVersion || purityCiQ.firmwareVersion)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Droplets size={20} className="text-cyan-500" />
                            Qualita Acqua
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Durezza Carbonatica</p>
                                <p className="font-semibold text-sm">{rawWater.carbonateHardness ?? configuration.carbonateHardnessPreset ?? 'N/D'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Stato Addolcitore</p>
                                <p className="font-semibold text-sm">{softener.preset || softener.determined || 'N/D'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderIqMeterDetails = () => {
        const totalVolume = iqMeter.totalVolumeLiters ?? iqMeter.totalVolume ?? 'N/D';
        const weeklyConsumption = iqMeter.weeklyConsumptionLiters ?? iqMeter.weeklyConsumption ?? 'N/D';
        const batteryStatus = iqMeter.batteryStatus || 'N/D';
        const lastEvent = iqMeter.lastDeviceEvent
            ? new Date(iqMeter.lastDeviceEvent).toLocaleString('it-IT')
            : 'N/D';

        const filterSystem = iqMeter.filterSystem || {};

        const batteryColor = batteryStatus === 'OK' || batteryStatus === 'GOOD'
            ? 'bg-green-100 text-green-700'
            : batteryStatus === 'LOW'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-700';

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Activity size={20} className="text-blue-500" />
                            Stato Dispositivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Volume Totale</p>
                                <p className="font-semibold text-sm">{totalVolume} litri</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Consumo Settimanale</p>
                                <p className="font-semibold text-sm">{weeklyConsumption} litri</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Stato Batteria</p>
                                <Badge className={batteryColor}>{batteryStatus}</Badge>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Ultimo Evento</p>
                                <p className="font-semibold text-sm">{lastEvent}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Installazione Filtro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Tipo Sistema Filtro</p>
                                <p className="font-semibold text-sm">{filterSystem.type || 'N/D'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Volume Rimanente</p>
                                <p className="font-semibold text-sm">{filterSystem.remainingVolumeLiters ?? filterSystem.remainingVolume ?? 'N/D'} litri</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Durata Rimanente</p>
                                <p className="font-semibold text-sm">{filterSystem.remainingLifetimeWeeks ?? filterSystem.remainingLifetime ?? 'N/D'} settimane</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderDispenserDetails = () => {
        const serial = dispenser.serialNumber || serialNumber;
        const lastEvent = dispenser.lastDeviceEventUtc
            ? new Date(dispenser.lastDeviceEventUtc).toLocaleString('it-IT')
            : 'N/D';

        const filters = dispenser.filters || {};
        const hotCapacity = filters.hotRemainingCapacityPercent ?? filters.hotRemainingCapacity ?? null;
        const coldCapacity = filters.coldRemainingCapacityPercent ?? filters.coldRemainingCapacity ?? null;

        const co2 = dispenser.co2 || {};
        const co2Level = co2.bottleLevelPercent ?? co2.bottleLevel ?? null;

        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Activity size={20} className="text-blue-500" />
                            Stato Dispenser
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500">Seriale</p>
                                <p className="font-semibold text-sm">{serial}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Ultimo Evento</p>
                                <p className="font-semibold text-sm">{lastEvent}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Droplets size={20} className="text-blue-500" />
                            Stato Filtri
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <p className="text-sm text-gray-600">Capacita Residua Caldo</p>
                                    <p className="text-sm font-semibold">{hotCapacity !== null ? `${hotCapacity}%` : 'N/D'}</p>
                                </div>
                                {hotCapacity !== null && <Progress value={hotCapacity} className="h-3" />}
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <p className="text-sm text-gray-600">Capacita Residua Freddo</p>
                                    <p className="text-sm font-semibold">{coldCapacity !== null ? `${coldCapacity}%` : 'N/D'}</p>
                                </div>
                                {coldCapacity !== null && <Progress value={coldCapacity} className="h-3" />}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Stato CO2</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <div className="flex justify-between mb-1">
                                <p className="text-sm text-gray-600">Livello Bottiglia</p>
                                <p className="text-sm font-semibold">{co2Level !== null ? `${co2Level}%` : 'N/D'}</p>
                            </div>
                            {co2Level !== null && <Progress value={co2Level} className="h-3" />}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const renderDetailsTab = () => {
        if (isLoading) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                        Caricamento dettagli BRITA...
                    </CardContent>
                </Card>
            );
        }

        if (!britaDetail) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        Dettagli BRITA non disponibili. I dati verranno aggiornati con la prossima sincronizzazione.
                    </CardContent>
                </Card>
            );
        }

        switch (detectedType) {
            case 'PURITY_C_IQ':
                return renderPurityCiQDetails();
            case 'IQ_METER':
                return renderIqMeterDetails();
            case 'DISPENSER':
                return renderDispenserDetails();
            default:
                return (
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            Tipo risorsa sconosciuto: {detectedType}
                        </CardContent>
                    </Card>
                );
        }
    };

    const renderLocationTab = () => {
        if (lat && lng) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <MapPin size={20} />
                            Geolocalizzazione
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card>
                <CardContent className="text-center py-8 text-gray-500">
                    <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Geolocalizzazione non disponibile per questa macchina.</p>
                    <p className="text-sm mt-1">I dati di posizione verranno sincronizzati con il prossimo aggiornamento.</p>
                </CardContent>
            </Card>
        );
    };

    const renderErrorsTab = () => {
        if (isLoading) {
            return (
                <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                        Caricamento...
                    </CardContent>
                </Card>
            );
        }

        if (detectedType === 'PURITY_C_IQ') {
            const errors = purityCiQ.errors || [];
            if (errors.length === 0) {
                return (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-8 text-center">
                            <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
                            <p className="text-green-700 font-semibold">Nessun errore attivo</p>
                        </CardContent>
                    </Card>
                );
            }
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <AlertTriangle size={20} className="text-amber-500" />
                            Errori ({errors.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Codice</TableHead>
                                    <TableHead>Descrizione</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {errors.map((err: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-mono">{err.code || err.errorCode || 'N/D'}</TableCell>
                                        <TableCell>{err.description || err.message || 'N/D'}</TableCell>
                                        <TableCell>{err.timestamp ? new Date(err.timestamp).toLocaleString('it-IT') : 'N/D'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            );
        }

        if (detectedType === 'DISPENSER') {
            const activities = dispenser.activities || [];
            if (activities.length === 0) {
                return (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-8 text-center">
                            <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
                            <p className="text-green-700 font-semibold">Nessun errore attivo</p>
                        </CardContent>
                    </Card>
                );
            }
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <AlertTriangle size={20} className="text-amber-500" />
                            Attivita ({activities.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descrizione</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.map((act: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-mono">{act.type || 'N/D'}</TableCell>
                                        <TableCell>{act.description || act.message || 'N/D'}</TableCell>
                                        <TableCell>{act.timestamp ? new Date(act.timestamp).toLocaleString('it-IT') : 'N/D'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            );
        }

        // IQ_METER and others - no error table
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-8 text-center">
                    <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
                    <p className="text-green-700 font-semibold">Nessun errore attivo</p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex items-start gap-6">
                            <div className="hidden md:block bg-blue-50 rounded-lg p-4 flex-shrink-0">
                                <img
                                    src={waterFilterImage}
                                    alt="BRITA Filter"
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
                                        <p className="font-semibold text-sm capitalize">brita</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Tipo Risorsa</p>
                                        <p className="font-semibold text-sm">{resourceType.replace(/_/g, ' ')}</p>
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

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                onClick={() => fetchBritaDetail(true)}
                                disabled={isLoading}
                            >
                                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                {isLoading ? 'Caricamento...' : 'Aggiorna Dati'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-12">
                    <TabsTrigger value="details" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">DETTAGLI</TabsTrigger>
                    <TabsTrigger value="location" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">POSIZIONE</TabsTrigger>
                    <TabsTrigger value="errors" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">ERRORI</TabsTrigger>
                    <TabsTrigger value="debug" className="text-sm text-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white font-semibold">DEBUG</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    {renderDetailsTab()}
                </TabsContent>

                <TabsContent value="location" className="space-y-6">
                    {renderLocationTab()}
                </TabsContent>

                <TabsContent value="errors" className="space-y-6">
                    {renderErrorsTab()}
                </TabsContent>

                <TabsContent value="debug" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Raw API Response</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs max-h-[500px]">
                                {JSON.stringify(britaDetail, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
