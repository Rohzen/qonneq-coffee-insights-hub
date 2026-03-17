import React, { useState } from 'react';
import { ArrowLeft, Search, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CounterAnalysisProps {
  onBack: () => void;
  onBackToList: () => void;
  machine: {
    name: string;
    family: string;
    serial: string;
  };
}

export const CounterAnalysis: React.FC<CounterAnalysisProps> = ({ onBack, onBackToList, machine }) => {
  const [activeView, setActiveView] = useState<'counters' | 'selection'>('counters');
  const [measureType, setMeasureType] = useState('Tot Coffees');
  const [timeRange, setTimeRange] = useState('Settimana');
  const [granularity, setGranularity] = useState('Giorno');
  const [activeTab, setActiveTab] = useState('counters');

  // Generate chart data based on time range and granularity
  const generateChartData = () => {
    const baseValue = 50;
    const variance = 15;
    
    // Giorno con granularità Ora = 24 ore
    if (timeRange === 'Giorno' && granularity === 'Ora') {
      return Array.from({ length: 24 }, (_, i) => ({
        date: `${i.toString().padStart(2, '0')}:00`,
        value: Math.round(baseValue * (i >= 7 && i <= 22 ? 1.5 : 0.3) + (Math.random() * variance - variance / 2))
      }));
    }
    
    // Settimana con granularità Giorno = 7 giorni
    if (timeRange === 'Settimana' && granularity === 'Giorno') {
      return Array.from({ length: 7 }, (_, i) => ({
        date: `${18 + i}/09`,
        value: Math.round(baseValue + (Math.random() * variance - variance / 2))
      }));
    }
    
    // Settimana con granularità Ora = 24 ore (media oraria della settimana)
    if (timeRange === 'Settimana' && granularity === 'Ora') {
      return Array.from({ length: 24 }, (_, i) => ({
        date: `${i.toString().padStart(2, '0')}:00`,
        value: Math.round(baseValue * (i >= 7 && i <= 22 ? 1.5 : 0.3) + (Math.random() * variance - variance / 2))
      }));
    }
    
    // Mese con granularità Giorno = 30 giorni
    if (timeRange === 'Mese' && granularity === 'Giorno') {
      return Array.from({ length: 30 }, (_, i) => ({
        date: `${i + 1}/09`,
        value: Math.round(baseValue + (Math.random() * variance - variance / 2))
      }));
    }
    
    // Mese con granularità Settimana = 4 settimane
    if (timeRange === 'Mese' && granularity === 'Settimana') {
      return Array.from({ length: 4 }, (_, i) => ({
        date: `Sett. ${i + 1}`,
        value: Math.round(baseValue * 7 + (Math.random() * variance * 7 - variance * 3.5))
      }));
    }
    
    // Anno con granularità Mese = 12 mesi
    if (timeRange === 'Anno' && granularity === 'Mese') {
      const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      return months.map(month => ({
        date: month,
        value: Math.round(baseValue * 30 + (Math.random() * variance * 30 - variance * 15))
      }));
    }
    
    // Anno con granularità Settimana = 52 settimane (semplificato a 12 punti)
    if (timeRange === 'Anno' && granularity === 'Settimana') {
      return Array.from({ length: 12 }, (_, i) => ({
        date: `S${i * 4 + 1}`,
        value: Math.round(baseValue * 7 + (Math.random() * variance * 7 - variance * 3.5))
      }));
    }

    // Default fallback - Settimana per Giorno
    return Array.from({ length: 7 }, (_, i) => ({
      date: `${18 + i}/09`,
      value: Math.round(baseValue + (Math.random() * variance - variance / 2))
    }));
  };

  const chartData = generateChartData();

  const calculateStats = () => {
    const values = chartData.map(d => d.value);
    return {
      max: Math.max(...values).toFixed(2),
      min: Math.min(...values).toFixed(2),
      sum: values.reduce((a, b) => a + b, 0).toFixed(2),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Compact Header with Machine Info */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 -ml-2 mb-2">
                <ArrowLeft size={18} />
                <span className="text-sm flex items-center gap-1">
                  <span>Dashboard</span>
                  <span>&gt;</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onBackToList();
                    }}
                    className="hover:text-primary hover:underline cursor-pointer"
                  >
                    Macchine
                  </button>
                  <span>&gt;</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onBack();
                    }}
                    className="hover:text-primary hover:underline cursor-pointer"
                  >
                    {machine.serial}
                  </button>
                  <span>&gt;</span>
                  <span>Analisi consumi</span>
                </span>
              </Button>
              <h1 className="text-2xl font-bold">{machine.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Seriale:</span>{' '}
                  <span className="font-semibold">{machine.serial}</span>
                </div>
                <div>
                  <span className="text-gray-500">Famiglia:</span>{' '}
                  <span className="font-semibold">{machine.family}</span>
                </div>
                <div>
                  <span className="text-gray-500">Cliente:</span>{' '}
                  <span className="font-semibold">Bar Centro</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm">
                CONFRONTA
              </Button>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input placeholder="Cerca" className="pl-9 h-9" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings2 size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* View Toggle & Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex items-center gap-6 lg:flex-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={activeView === 'counters'}
                  onChange={() => setActiveView('counters')}
                  className="text-primary"
                />
                <span className="text-sm font-medium">Consumi</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={activeView === 'selection'}
                  onChange={() => setActiveView('selection')}
                  className="text-primary"
                />
                <span className="text-sm font-medium">Selezione Consumi e Cicli</span>
              </label>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:w-2/3">
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">Misura</label>
                <select 
                  value={measureType}
                  onChange={(e) => setMeasureType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Tot Caffè</option>
                  <option>Espresso</option>
                  <option>Cappuccino</option>
                  <option>Latte</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">Intervallo Temporale</label>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Ora</option>
                  <option>Giorno</option>
                  <option>Settimana</option>
                  <option>Mese</option>
                  <option>Anno</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="counters" className="text-sm">CONSUMI</TabsTrigger>
              <TabsTrigger value="average" className="text-sm">MEDIA CONSUMI 24H</TabsTrigger>
            </TabsList>

            <TabsContent value="counters" className="space-y-6 mt-6">
              {/* Granularity & Header Row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1.5 block">Granularità</label>
                    <select 
                      value={granularity}
                      onChange={(e) => setGranularity(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[140px]"
                    >
                      <option>Ora</option>
                      <option>Giorno</option>
                      <option>Settimana</option>
                      <option>Mese</option>
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">CONSUMI TOTALI</p>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Massimo</p>
                    <p className="text-2xl font-bold">{stats.max}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Minimo</p>
                    <p className="text-2xl font-bold">{stats.min}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Totale</p>
                    <p className="text-2xl font-bold">{stats.sum}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 mb-1">Media</p>
                    <p className="text-2xl font-bold">{stats.avg}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardContent className="p-6">
                  <div className="h-[450px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--primary))',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '12px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                          formatter={() => `${machine.serial} - Tot Coffees`}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#0ea5e9" 
                          name={`${machine.serial} - Tot Coffees`}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="average">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Dati Media 24H - Da implementare</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
