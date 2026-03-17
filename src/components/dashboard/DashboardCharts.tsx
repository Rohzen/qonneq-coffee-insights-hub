
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MachineData } from '@/types/dashboard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface DashboardChartsProps {
  machineData: MachineData;
}

// Generate weekly data (already implemented in current component)
const getWeeklyData = (machineData: MachineData) => {
  return machineData.dailyData;
};

// Generate daily data with hourly breakdown
const getDailyData = () => {
  const hours = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  return hours.map(hour => ({
    name: hour,
    coffee: Math.floor(Math.random() * 10) + 5,
    espresso: Math.floor(Math.random() * 8) + 3,
  }));
};

// Generate monthly data with daily breakdown
const getMonthlyData = () => {
  const days = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
  return days.map(day => ({
    name: day,
    coffee: Math.floor(Math.random() * 60) + 30,
    espresso: Math.floor(Math.random() * 50) + 20,
  }));
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ machineData }) => {
  // State for period selection
  const [deliveryPeriod, setDeliveryPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  // Get the right data for the selected period
  const getDeliveryData = () => {
    switch(deliveryPeriod) {
      case 'daily':
        return getDailyData();
      case 'weekly':
        return getWeeklyData(machineData);
      case 'monthly':
        return getMonthlyData();
      default:
        return getWeeklyData(machineData);
    }
  };
  
  // Get the title for the selected period
  const getDeliveryTitle = () => {
    switch(deliveryPeriod) {
      case 'daily':
        return 'Erogazioni giornaliere (ore)';
      case 'weekly':
        return 'Erogazioni settimanali';
      case 'monthly':
        return 'Erogazioni mensili';
      default:
        return 'Erogazioni settimanali';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">{getDeliveryTitle()}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {deliveryPeriod === 'daily' ? 'Oggi' : 
                 deliveryPeriod === 'weekly' ? 'Settimana' : 'Mese'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDeliveryPeriod('daily')}>
                Oggi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeliveryPeriod('weekly')}>
                Settimana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeliveryPeriod('monthly')}>
                Mese
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ChartContainer
              config={{
                coffee: { color: "#7E69AB" },
                espresso: { color: "#9b87f5" },
              }}
            >
              <BarChart data={getDeliveryData()}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="coffee" name="Caffè" fill="var(--color-coffee)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="espresso" name="Espresso" fill="var(--color-espresso)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Temperatura della macchina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ChartContainer
              config={{
                temperature: { color: "#F97316" },
              }}
            >
              <LineChart data={machineData.temperatureData}>
                <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="var(--color-temperature)" 
                  strokeWidth={2} 
                  dot={{ fill: "var(--color-temperature)" }} 
                  name="Temperatura (°C)"
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
