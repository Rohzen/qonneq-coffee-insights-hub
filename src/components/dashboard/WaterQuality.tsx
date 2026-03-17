import React from 'react';
import { ArrowLeft, Droplet, Clock, Activity, Calendar, Settings, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import waterFilterImage from '@/assets/water-filter-c150.png';

interface WaterQualityProps {
  onBack: () => void;
  onBackToList: () => void;
  machine: {
    name: string;
    serial: string;
  };
}

export const WaterQuality: React.FC<WaterQualityProps> = ({ onBack, onBackToList, machine }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft size={20} />
          Indietro
        </Button>
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <span>Dashboard</span>
          <span>&gt;</span>
          <button 
            onClick={onBackToList}
            className="hover:text-primary hover:underline cursor-pointer"
          >
            Macchine
          </button>
          <span>&gt;</span>
          <button 
            onClick={onBack}
            className="hover:text-primary hover:underline cursor-pointer"
          >
            {machine.serial}
          </button>
          <span>&gt;</span>
          <span>Qualità dell'acqua</span>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">Qualità dell'acqua</h1>
        <p className="text-gray-600">{machine.name} - {machine.serial}</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Ultima Lettura</p>
                <p className="text-lg font-bold">01/01/2025</p>
                <p className="text-sm text-gray-600">13:22</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installed Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Filtro installato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <div className="bg-white rounded-lg flex items-center justify-center mb-4">
                <img 
                  src={waterFilterImage} 
                  alt="PURITY C150 iQ Quell ST Water Filter" 
                  className="h-48 w-auto object-contain"
                />
              </div>
              <p className="text-lg font-semibold text-center">PURITY C150 iQ Quell ST</p>
            </div>
          </CardContent>
        </Card>

        {/* State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Stato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">Durezza Acqua Grezza</span>
                </div>
                <span className="text-sm font-semibold">14 °dH</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Droplet className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">Lavaggio Corretto</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
