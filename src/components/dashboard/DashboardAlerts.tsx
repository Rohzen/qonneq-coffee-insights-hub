
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MachineData } from '@/types/dashboard';
import { AlertTriangle, Coffee, Thermometer, Monitor, Cpu } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DashboardAlertsProps {
  machineData: MachineData;
}

export const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ machineData }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-4 w-4 text-red-500" />;
      case 'coffee':
        return <Coffee className="h-4 w-4 text-amber-500" />;
      case 'system':
        return <Cpu className="h-4 w-4 text-purple-500" />;
      case 'connection':
        return <Monitor className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 text-red-700 border-l-4 border-red-500';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-l-4 border-amber-500';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-l-4 border-blue-500';
      default:
        return 'bg-gray-50 text-gray-700 border-l-4 border-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Stato macchina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`mb-4 p-4 rounded ${machineData.status === 'online' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 mr-2 rounded-full ${machineData.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">
                {machineData.status === 'online' ? 'Macchina online' : 'Macchina offline'}
              </span>
            </div>
            <p className="text-sm mt-1">
              {machineData.status === 'online' 
                ? 'La macchina sta funzionando correttamente' 
                : 'La macchina non è connessa alla rete'}
            </p>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
              Avvisi recenti
            </h4>
            
            {machineData.alertsData.length > 0 ? (
              <div className="space-y-3">
                {machineData.alertsData.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-md ${getAlertClass(alert.severity)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        {getAlertIcon(alert.type)}
                        <span className="ml-2 font-medium">{alert.title}</span>
                      </div>
                      <span className="text-xs">{alert.time}</span>
                    </div>
                    <p className="text-sm mt-1 ml-6">{alert.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nessun avviso attivo</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Report manutenzione</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Prossima manutenzione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Filtro acqua</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-full h-2 bg-gray-200 rounded-full mr-2">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">65%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{machineData.maintenanceDays} giorni</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Gruppo erogazione</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-full h-2 bg-gray-200 rounded-full mr-2">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: '28%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">28%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">5 giorni</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Macine</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-full h-2 bg-gray-200 rounded-full mr-2">
                      <div className="h-2 bg-red-500 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">12%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">1 giorno</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
