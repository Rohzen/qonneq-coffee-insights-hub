
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MachineData } from '@/types/dashboard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Calendar, Clock, AlertTriangle, CheckCircle, AlertCircle, Wrench, Shield } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface MaintenanceTabProps {
  machineData: MachineData;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ machineData }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Generate maintenance history data
  const getMaintenanceHistory = () => {
    return [
      { id: 1, type: 'Manutenzione ordinaria', date: '15/05/2023', technician: 'Mario Rossi', status: 'completed', notes: 'Sostituzione filtri e pulizia completa' },
      { id: 2, type: 'Intervento tecnico', date: '03/08/2023', technician: 'Luigi Verdi', status: 'completed', notes: 'Riparazione valvola erogazione' },
      { id: 3, type: 'Manutenzione ordinaria', date: '12/11/2023', technician: 'Mario Rossi', status: 'completed', notes: 'Decalcificazione e manutenzione' },
      { id: 4, type: 'Calibrazione', date: '25/01/2024', technician: 'Luigi Verdi', status: 'completed', notes: 'Calibrazione pressione e temperatura' },
      { id: 5, type: 'Manutenzione ordinaria', date: '10/04/2024', technician: 'Mario Rossi', status: 'scheduled', notes: 'Sostituzione filtri e pulizia completa' }
    ];
  };

  // Generate components health data
  const getComponentsHealth = () => {
    return [
      { name: 'Gruppo erogatore', health: 78, nextMaintenance: 21 },
      { name: 'Pompa', health: 92, nextMaintenance: 45 },
      { name: 'Caldaia', health: 85, nextMaintenance: 38 },
      { name: 'Macine', health: 65, nextMaintenance: 14 },
      { name: 'Sistema idrico', health: 88, nextMaintenance: 30 }
    ];
  };

  // Generate usage metrics data
  const getUsageMetrics = () => {
    return [
      { name: 'Lun', cycles: 55, hours: 8 },
      { name: 'Mar', cycles: 62, hours: 8.5 },
      { name: 'Mer', cycles: 78, hours: 9 },
      { name: 'Gio', cycles: 69, hours: 9 },
      { name: 'Ven', cycles: 81, hours: 10 },
      { name: 'Sab', cycles: 46, hours: 6 },
      { name: 'Dom', cycles: 35, hours: 5 }
    ];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Prossima manutenzione</p>
              <h3 className="text-2xl font-bold text-amber-900">{machineData.maintenanceDays} giorni</h3>
              <p className="text-xs text-amber-700 mt-1">Programmata per il 10/06/2025</p>
            </div>
            <div className="p-3 bg-amber-200 rounded-lg">
              <Calendar className="h-6 w-6 text-amber-700" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Ore di attività</p>
              <h3 className="text-2xl font-bold">1,280</h3>
              <p className="text-xs text-gray-600 mt-1">Dall'ultima revisione</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Problemi rilevati</p>
              <h3 className="text-2xl font-bold">{machineData.alerts}</h3>
              <p className="text-xs text-gray-600 mt-1">Negli ultimi 30 giorni</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Stato generale</p>
              <h3 className="text-2xl font-bold text-green-600">Buono</h3>
              <p className="text-xs text-gray-600 mt-1">85% efficienza</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Stato componenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  health: { color: "#8B5CF6" }
                }}
              >
                <BarChart
                  layout="vertical"
                  data={getComponentsHealth()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="health" name="Stato di salute (%)" radius={[0, 4, 4, 0]}>
                    {getComponentsHealth().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.health > 80 ? "#22C55E" : entry.health > 60 ? "#F59E0B" : "#EF4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Cicli di utilizzo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  cycles: { color: "#7E69AB" },
                  hours: { color: "#0EA5E9" }
                }}
              >
                <LineChart data={getUsageMetrics()}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="cycles" 
                    name="Cicli di erogazione"
                    stroke="var(--color-cycles)" 
                    strokeWidth={2} 
                    dot={{ fill: "var(--color-cycles)" }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="hours" 
                    name="Ore di attività"
                    stroke="var(--color-hours)" 
                    strokeWidth={2} 
                    dot={{ fill: "var(--color-hours)" }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Storico interventi</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? "Nascondi completati" : "Mostra tutti"}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tecnico</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getMaintenanceHistory()
                .filter(item => showCompleted || item.status !== 'completed')
                .map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.technician}</TableCell>
                  <TableCell>
                    {item.status === 'completed' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Completato
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex w-fit items-center gap-1">
                        <Clock className="h-3 w-3" /> Programmato
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Operazioni consigliate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Sostituzione filtro acqua consigliata</h4>
                  <p className="text-sm mt-1 text-amber-700">Il filtro acqua ha superato il 75% della sua vita utile. Si consiglia la sostituzione entro 7 giorni.</p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" className="mr-2 border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200">
                      Programma sostituzione
                    </Button>
                    <Button size="sm" variant="ghost" className="text-amber-700">
                      Ignora
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Calibrazione macine necessaria</h4>
                  <p className="text-sm mt-1 text-red-700">Le macine necessitano di calibrazione per garantire una qualità ottimale del caffè. Si raccomanda un intervento entro 3 giorni.</p>
                  <div className="mt-3">
                    <Button size="sm" variant="default" className="mr-2 bg-red-600 hover:bg-red-700">
                      Richiedi intervento
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-700">
                      Posticipa
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Ciclo pulizia automatica</h4>
                  <p className="text-sm mt-1 text-blue-700">Si consiglia di eseguire un ciclo completo di pulizia automatica. Ultimo ciclo eseguito 14 giorni fa.</p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" className="mr-2 border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Avvia ciclo
                    </Button>
                    <Button size="sm" variant="ghost" className="text-blue-700">
                      Ignora
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
