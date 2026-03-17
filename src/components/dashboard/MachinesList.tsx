import React, { useState } from 'react';
import { ArrowLeft, Search, Settings2, ChevronRight, CheckCircle2, AlertTriangle, CloudOff, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedMachineDetail } from '../shared/UnifiedMachineDetail';
import { BritaMachineDetail } from '../shared/BritaMachineDetail';
import { WaterQuality } from './WaterQuality';
import { useApiMachineData } from '@/hooks/useApiMachineData';

interface Machine {
  id: string;
  name: string;
  brand: string;
  family: string;
  model: string;
  serial: string;
  waterFilter: string;
  lastSync: string;
  hasAlarm: boolean;
  isOnline: boolean;
  provider: string;
  status: string;
  companyName: string;
  // Geodata fields
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
}

interface MachinesListProps {
  onBack: () => void;
}

export const MachinesList: React.FC<MachinesListProps> = ({ onBack }) => {
  const { machines: apiMachines, isLoading } = useApiMachineData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [showWaterQuality, setShowWaterQuality] = useState<Machine | null>(null);

  if (selectedMachine) {
    if (selectedMachine.provider === 'brita') {
      return <BritaMachineDetail onBack={() => setSelectedMachine(null)} machine={selectedMachine} isAdmin={false} />;
    }
    return <UnifiedMachineDetail onBack={() => setSelectedMachine(null)} machine={selectedMachine} isAdmin={false} />;
  }

  if (showWaterQuality) {
    return (
      <WaterQuality
        onBack={() => setShowWaterQuality(null)}
        onBackToList={() => setShowWaterQuality(null)}
        machine={showWaterQuality}
      />
    );
  }

  // Map API machines to component format
  const machines: Machine[] = apiMachines.map(m => ({
    id: m.id || m.machineId || m.serialNumber,
    name: m.name,
    brand: m.brand || 'N/A',
    family: m.model || 'N/A',
    model: m.model || 'N/A',
    serial: m.serialNumber || m.machineId,
    waterFilter: m.waterFilterName || 'PURITY C150 iQ Quell ST',
    lastSync: m.lastConnection ? new Date(m.lastConnection).toLocaleString('it-IT') : 'Mai',
    hasAlarm: m.status === 'alarm',
    isOnline: m.status === 'online',
    provider: m.provider || 'unknown',
    status: m.status || 'offline',
    companyName: m.companyName || 'Non assegnata',
    // Geodata from API
    latitude: m.latitude,
    longitude: m.longitude,
    location: m.location,
  }));

  const filteredMachines = machines.filter(machine =>
    (machine.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (machine.serial?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Removed Indietro button */}
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Caricamento macchine...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {/* Removed Indietro button */}
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <span>Dashboard</span>
          <span>&gt;</span>
          <button
            onClick={onBack}
            className="hover:text-primary hover:underline cursor-pointer"
          >
            Macchine
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Search and filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Cerca"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Settings2 size={20} />
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Modello</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Famiglia</TableHead>
                  <TableHead>Seriale</TableHead>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Filtro Acqua</TableHead>
                  <TableHead>Ultima Sincronizzazione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Allarme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMachines.map((machine) => (
                  <TableRow key={machine.serial} className="hover:bg-gray-50">
                    <TableCell
                      className="font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setSelectedMachine(machine)}
                    >
                      {machine.name}
                    </TableCell>
                    <TableCell>{machine.brand}</TableCell>
                    <TableCell>{machine.family}</TableCell>
                    <TableCell>{machine.serial}</TableCell>
                    <TableCell>{machine.companyName}</TableCell>
                    <TableCell
                      className="font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setShowWaterQuality(machine)}
                    >
                      {machine.waterFilter}
                    </TableCell>
                    <TableCell className="text-sm">{machine.lastSync}</TableCell>
                    <TableCell>
                      {machine.isOnline ? (
                        <Cloud className="w-5 h-5 text-green-500" />
                      ) : (
                        <CloudOff className="w-5 h-5 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      {machine.hasAlarm ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              1 - 10 / {filteredMachines.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <select className="border rounded px-2 py-1 text-sm">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
