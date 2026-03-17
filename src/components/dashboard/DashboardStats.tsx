
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MachineData } from '@/types/dashboard';
import { Coffee, Gauge, Calendar, DatabaseBackup } from 'lucide-react';

interface DashboardStatsProps {
  machineData: MachineData;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ machineData }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Caffè oggi</p>
            <h3 className="text-2xl font-bold">{machineData.dailyCoffee}</h3>
            <p className="text-xs text-green-600 mt-1">+{Math.floor(machineData.dailyCoffee * 0.12)} rispetto a ieri</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Coffee className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Temperatura</p>
            <h3 className="text-2xl font-bold">{machineData.temperature}°C</h3>
            <p className="text-xs text-gray-600 mt-1">Ottimale: 88-94°C</p>
          </div>
          <div className="p-3 bg-red-100 rounded-lg">
            <Gauge className="h-6 w-6 text-red-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Erogazioni mese</p>
            <h3 className="text-2xl font-bold">{machineData.monthlyTotal}</h3>
            <p className="text-xs text-green-600 mt-1">+{Math.floor(machineData.monthlyTotal * 0.05)} rispetto al mese scorso</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Manutenzione</p>
            <h3 className="text-2xl font-bold">{machineData.maintenanceDays} giorni</h3>
            <p className="text-xs text-amber-600 mt-1">Alla prossima manutenzione</p>
          </div>
          <div className="p-3 bg-amber-100 rounded-lg">
            <DatabaseBackup className="h-6 w-6 text-amber-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
