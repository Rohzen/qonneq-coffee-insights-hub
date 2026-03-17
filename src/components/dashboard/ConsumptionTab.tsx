
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MachineData } from '@/types/dashboard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Coffee, Droplets, Package, Leaf } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface ConsumptionTabProps {
  machineData: MachineData;
}

export const ConsumptionTab: React.FC<ConsumptionTabProps> = ({ machineData }) => {
  const [resourceTab, setResourceTab] = useState('water');
  
  // Generate consumption distribution data
  const getConsumptionData = () => {
    return [
      { name: 'Espresso', value: 35, color: '#9b87f5' },
      { name: 'Caffè', value: 40, color: '#7E69AB' },
      { name: 'Cappuccino', value: 15, color: '#6E59A5' },
      { name: 'Latte', value: 10, color: '#D6BCFA' },
    ];
  };

  // Generate water consumption data
  const getWaterConsumptionData = () => {
    return [
      { name: 'Lun', amount: Math.floor(Math.random() * 5) + 3 },
      { name: 'Mar', amount: Math.floor(Math.random() * 5) + 3 },
      { name: 'Mer', amount: Math.floor(Math.random() * 5) + 3 },
      { name: 'Gio', amount: Math.floor(Math.random() * 5) + 3 },
      { name: 'Ven', amount: Math.floor(Math.random() * 5) + 3 },
      { name: 'Sab', amount: Math.floor(Math.random() * 5) + 3 },
      { name: 'Dom', amount: Math.floor(Math.random() * 5) + 3 },
    ];
  };

  // Generate coffee consumption data
  const getCoffeeConsumptionData = () => {
    return [
      { name: 'Lun', amount: Math.floor(Math.random() * 3) + 1 },
      { name: 'Mar', amount: Math.floor(Math.random() * 3) + 1 },
      { name: 'Mer', amount: Math.floor(Math.random() * 3) + 1 },
      { name: 'Gio', amount: Math.floor(Math.random() * 3) + 1 },
      { name: 'Ven', amount: Math.floor(Math.random() * 3) + 1 },
      { name: 'Sab', amount: Math.floor(Math.random() * 3) + 1 },
      { name: 'Dom', amount: Math.floor(Math.random() * 3) + 1 },
    ];
  };

  // Generate supplies inventory data
  const getSuppliesData = () => {
    return [
      { name: 'Caffè in grani', remaining: 65, total: 100, unit: 'kg', daysLeft: 14 },
      { name: 'Filtri acqua', remaining: 3, total: 10, unit: 'pezzi', daysLeft: 30 },
      { name: 'Prodotto decalcificante', remaining: 1, total: 3, unit: 'l', daysLeft: 20 },
      { name: 'Pastiglie pulizia', remaining: 24, total: 50, unit: 'pezzi', daysLeft: 45 },
    ];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Acqua consumata</p>
              <h3 className="text-2xl font-bold">24 L</h3>
              <p className="text-xs text-gray-600 mt-1">Questa settimana</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Caffè consumato</p>
              <h3 className="text-2xl font-bold">8.5 kg</h3>
              <p className="text-xs text-gray-600 mt-1">Questa settimana</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Coffee className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Materiali consumo</p>
              <h3 className="text-2xl font-bold">12 pz</h3>
              <p className="text-xs text-gray-600 mt-1">Questa settimana</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Efficienza energetica</p>
              <h3 className="text-2xl font-bold">A+</h3>
              <p className="text-xs text-green-600 mt-1">Ottimale</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Distribuzione bevande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  espresso: { color: "#9b87f5" },
                  caffè: { color: "#7E69AB" },
                  cappuccino: { color: "#6E59A5" },
                  latte: { color: "#D6BCFA" },
                }}
              >
                <PieChart>
                  <Pie
                    data={getConsumptionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {getConsumptionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Consumo risorse</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={resourceTab} onValueChange={setResourceTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="water">Acqua</TabsTrigger>
                <TabsTrigger value="coffee">Caffè</TabsTrigger>
              </TabsList>
              <TabsContent value="water">
                <div className="h-[240px]">
                  <ChartContainer
                    config={{
                      amount: { color: "#0EA5E9" }
                    }}
                  >
                    <BarChart data={getWaterConsumptionData()}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" name="Litri consumati" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </TabsContent>
              <TabsContent value="coffee">
                <div className="h-[240px]">
                  <ChartContainer
                    config={{
                      amount: { color: "#F97316" }
                    }}
                  >
                    <BarChart data={getCoffeeConsumptionData()}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" name="Kg consumati" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Inventario materiali di consumo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materiale</TableHead>
                <TableHead>Rimanenza</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Giorni rimanenti</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSuppliesData().map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.remaining} {item.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-full h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (item.remaining / item.total) > 0.6 
                              ? 'bg-green-500' 
                              : (item.remaining / item.total) > 0.3 
                                ? 'bg-amber-500' 
                                : 'bg-red-500'
                          }`} 
                          style={{ width: `${(item.remaining / item.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{Math.round((item.remaining / item.total) * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.daysLeft} giorni</TableCell>
                  <TableCell>
                    <button className="text-sm text-blue-600 hover:underline">
                      Ordina
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
