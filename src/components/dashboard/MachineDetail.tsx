import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Plus, BarChart3, AlertTriangle, Wifi, Phone, Activity, MapPin, Droplets, Clock, Droplet, Calendar, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CounterAnalysis } from './CounterAnalysis';
import { WaterQuality } from './WaterQuality';
import { TelemetryCharts } from './TelemetryCharts';
import { WeatherWidget } from './WeatherWidget';
import { MachineMap } from './MachineMap';
import { ContextAlerts } from './ContextAlerts';
import { AdvancedStatistics } from './AdvancedStatistics';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useEnrichedContext } from '@/hooks/useEnrichedContext';
import coffeeMachineImage from '@/assets/coffee-machine-s30.png';

interface MachineDetailProps {
  onBack: () => void;
  machine: {
    id: string;
    name: string;
    brand: string;
    family: string;
    model: string;
    serial: string;
    lastSync: string;
    hasAlarm: boolean;
    isOnline: boolean;
    provider: string;
    status: string;
  };
}

export const MachineDetail: React.FC<MachineDetailProps> = ({ onBack, machine }) => {
  const { apiProvider } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [showCounterAnalysis, setShowCounterAnalysis] = useState(false);
  const [showWaterQuality, setShowWaterQuality] = useState(false);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);

  const machineLatitude = telemetryData?.machine?.latitude;
  const machineLongitude = telemetryData?.machine?.longitude;
  const hasCoordinates = machineLatitude != null && machineLongitude != null;
  const { data: enrichedContext, isLoading: isLoadingContext } = useEnrichedContext(
    machine.serial,
    hasCoordinates
  );

  // Load data on mount
  useEffect(() => {
    handleGetTelemetry(false);
  }, [machine.serial]);

  const handleGetTelemetry = async (refresh: boolean = false) => {
    setIsLoadingTelemetry(true);
    try {
      const response = await apiProvider.getMachineTelemetry(machine.serial, { refresh });
      if (response.success && response.data) {
        setTelemetryData(response.data);
        const recordCount = response.data.telemetry?.length || 0;
        if (refresh) {
          toast({ title: 'Telemetria recuperata', description: `Ricevuti ${recordCount} record` });
        }
      } else {
        // Only show error on explicit refresh or if it's a critical failure?
        // Maybe just show error always if it fails.
        toast({ title: 'Errore', description: response.error || 'Impossibile recuperare telemetria', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  if (showCounterAnalysis) {
    return (
      <CounterAnalysis
        onBack={() => setShowCounterAnalysis(false)}
        onBackToList={onBack}
        machine={machine}
      />
    );
  }

  if (showWaterQuality) {
    return (
      <WaterQuality
        onBack={() => setShowWaterQuality(false)}
        onBackToList={onBack}
        machine={machine}
      />
    );
  }

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
                  alt="Coffee Machine S30"
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBack();
                        }}
                        className="hover:text-primary hover:underline cursor-pointer"
                      >
                        Macchine
                      </button>
                    </span>
                  </Button>
                  <h1 className="text-3xl font-bold">{machine.serial}</h1>
                  <p className="text-gray-600">{machine.name}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">Brand / Modello</p>
                    <p className="font-semibold text-sm">{machine.brand} - {machine.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="font-semibold text-sm capitalize">{machine.provider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ultima Sincronizzazione</p>
                    <p className="font-semibold text-sm">{machine.lastSync}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stato</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${machine.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <p className={`font-semibold text-sm ${machine.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                        {machine.isOnline ? 'Connesso' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="items-center gap-2"
                onClick={() => setShowCounterAnalysis(true)}
                style={{ display: 'none' }}
              >
                <BarChart3 size={16} />
                Consumi
              </Button>
              <Button variant="outline" size="sm" className="items-center gap-2" style={{ display: 'none' }}>
                <AlertTriangle size={16} />
                Guasti
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="items-center gap-2"
                onClick={() => setShowWaterQuality(true)}
                style={{ display: 'none' }}
              >
                <Droplets size={16} />
                Qualità dell'acqua
              </Button>
              <Button variant="outline" size="sm" className="items-center gap-2" style={{ display: 'none' }}>
                <Wifi size={16} />
                Connettività
              </Button>
              <Button variant="outline" size="sm" className="items-center gap-2" style={{ display: 'none' }}>
                <Phone size={16} />
                Contatti
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleGetTelemetry(true)}
                disabled={isLoadingTelemetry}
              >
                {isLoadingTelemetry ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
                {isLoadingTelemetry ? 'Caricamento...' : 'Recupera Telemetria'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Display Section */}
      {telemetryData && (
        <div className="space-y-6">
          {/* Weather Widget */}
          <WeatherWidget
            latitude={telemetryData.machine?.latitude}
            longitude={telemetryData.machine?.longitude}
            location={telemetryData.machine?.location}
          />

          {/* Telemetry Charts */}
          <TelemetryCharts
            telemetry={telemetryData.telemetry || []}
            dailyData={telemetryData.dailyData || []}
            summary={telemetryData.summary || { totalCoffee: 0, totalEspresso: 0, totalDrinks: 0, periodDays: 7 }}
          />
        </div>
      )}

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="details" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">DETTAGLI</TabsTrigger>
          <TabsTrigger value="location" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">POSIZIONE</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">MANUTENZIONE/PERFORMANCE</TabsTrigger>
          <TabsTrigger value="advanced-stats" className="text-sm text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold flex items-center gap-1">
            <BarChart3 size={14} />
            STATISTICHE AVANZATE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Machine Information */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold">Informazioni Macchina</CardTitle>
                <Button variant="ghost" size="icon">
                  <Edit size={16} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Modello</p>
                    <p className="font-semibold text-sm">{machine.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Brand</p>
                    <p className="font-semibold text-sm">{machine.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Famiglia</p>
                    <p className="font-semibold text-sm">{machine.family}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Provider</p>
                    <p className="font-semibold text-sm capitalize">{machine.provider}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Data Installazione</p>
                    <p className="font-semibold text-sm">15/11/2016</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Data Vendita</p>
                    <p className="font-semibold text-sm">08/11/2016</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Fine Garanzia</p>
                    <p className="font-semibold text-sm">08/11/2017</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operating Times */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Tempi Operativi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Up Time</p>
                    <p className="font-semibold text-sm">21 GG - 17 HH - 38 MM</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tempo Operativo</p>
                    <p className="font-semibold text-sm">2999 GG - 17 HH</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold">Cliente</CardTitle>
                <Button variant="ghost" size="icon">
                  <Edit size={16} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nome</p>
                    <p className="font-semibold text-sm">Bar Centro</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Indirizzo</p>
                    <p className="font-semibold text-sm">Via Dante 15</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Città</p>
                    <p className="font-semibold text-sm">Milano</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Information */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Manutenzione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ultima Manutenzione</p>
                    <p className="font-semibold text-sm">15/02/2025</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Prossima Manutenzione</p>
                    <p className="font-semibold text-sm">15/06/2026</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Giorni di manutenzione</p>
                    <p className="font-semibold text-sm">141</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cicli totali</p>
                    <p className="font-semibold text-sm">27750</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Media Caffè</p>
                    <p className="font-semibold text-sm">- Caffè/Giorno</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Allarme</p>
                    <p className={`font-semibold text-sm ${machine.hasAlarm ? 'text-red-600' : 'text-green-600'}`}>
                      {machine.hasAlarm ? 'Sì' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin size={20} />
                    Posizione Geografica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hasCoordinates ? (
                      <MachineMap
                        latitude={parseFloat(machineLatitude)}
                        longitude={parseFloat(machineLongitude)}
                        serial={machine.serial}
                        context={enrichedContext}
                      />
                    ) : (
                      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        Coordinate non disponibili. Recupera la telemetria per visualizzare la mappa.
                      </div>
                    )}
                    {telemetryData?.machine?.location && (
                      <div className="flex items-start gap-2 text-sm bg-gray-50 p-4 rounded-lg">
                        <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">{telemetryData.machine.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Context Alerts below the map */}
              {hasCoordinates && (
                <ContextAlerts
                  alerts={enrichedContext?.alerts || []}
                  isLoading={isLoadingContext}
                />
              )}
            </div>

            {/* Location Details - 1 column */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold">Dettagli Posizione</CardTitle>
                  <Button variant="ghost" size="icon">
                    <Edit size={16} />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Indirizzo Completo</p>
                      <p className="font-semibold text-sm">Via Dante, 15</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">CAP</p>
                      <p className="font-semibold text-sm">20123</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Città</p>
                      <p className="font-semibold text-sm">Milano</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Provincia</p>
                      <p className="font-semibold text-sm">Milano (MI)</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Regione</p>
                      <p className="font-semibold text-sm">Lombardia</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Paese</p>
                      <p className="font-semibold text-sm">Italia</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Info Installazione</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tipo di Locale</p>
                      <p className="font-semibold text-sm">Bar / Caffetteria</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Area di Installazione</p>
                      <p className="font-semibold text-sm">Bancone principale</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Accessibilità</p>
                      <p className="font-semibold text-sm">Buona</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Note</p>
                      <p className="font-semibold text-sm">Centro storico di Milano</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Days of maintenance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giorni di manutenzione</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <div className="h-3 w-3 rounded-full border border-gray-400 flex items-center justify-center text-xs">i</div>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">Manutenzione</p>
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#f3f4f6"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${74 * 2.64} 263.89`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">74 %</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium">138 Giorni</p>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance cycles */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cicli di manutenzione</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <div className="h-3 w-3 rounded-full border border-gray-400 flex items-center justify-center text-xs">i</div>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">Manutenzione</p>
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#f3f4f6"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${89 * 2.64} 263.89`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">89 %</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium">26850 Cicli</p>
                </div>
              </CardContent>
            </Card>

            {/* Coffee */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coffee</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <div className="h-3 w-3 rounded-full border border-gray-400 flex items-center justify-center text-xs">i</div>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">Performance</p>
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#f3f4f6"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${18.5 * 2.64} 263.89`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">18.50 %</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium">53.2 Caffè/Giorno</p>
                </div>
              </CardContent>
            </Card>

            {/* Milk */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latte</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <div className="h-3 w-3 rounded-full border border-gray-400 flex items-center justify-center text-xs">i</div>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">Performance</p>
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#f3f4f6"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${24.5 * 2.64} 263.89`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">24.50 %</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium">45.8 Porzioni/Giorno</p>
                </div>
              </CardContent>
            </Card>

            {/* Coffee Cleaning */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coffee Cleaning</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <div className="h-3 w-3 rounded-full border border-gray-400 flex items-center justify-center text-xs">i</div>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">Performance</p>
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#f3f4f6"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#3b82f6"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${7.2 * 2.64} 263.89`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">7.20 %</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium">3 Lavaggi Eseguiti</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Water Filter Status Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Stato filtro dell'acqua</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Durata Rimanente</p>
                      <p className="text-2xl font-bold">7 settimane</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Capacità Rimanente</p>
                      <p className="text-2xl font-bold">20 litri</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-2">Consumo Settimana Scorsa</p>
                      <p className="text-2xl font-bold">50 litri</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center">
                      <Droplet className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-6">
            {/* Time Range Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Intervallo di tempo</label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>Last 24h</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>Last year</option>
                    <option>Custom range</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Counters */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                onClick={() => setShowCounterAnalysis(true)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <BarChart3 className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">COUNTERS</h3>
                </CardContent>
              </Card>

              {/* Counter Selection & Cycles */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Activity className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">COUNTER SELECTION & CYCLES</h3>
                </CardContent>
              </Card>

              {/* Missed Washes */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Activity className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">MISSED WASHES</h3>
                </CardContent>
              </Card>

              {/* Failures */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">FAILURES</h3>
                </CardContent>
              </Card>

              {/* Coffee Delivery */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <Activity className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">COFFEE DELIVERY</h3>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced-stats">
          <AdvancedStatistics
            context={enrichedContext}
            isLoading={isLoadingContext}
            telemetryData={telemetryData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
