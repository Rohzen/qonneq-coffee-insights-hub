import React, { useState } from 'react';
import { ArrowLeft, List, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MachinesList } from './MachinesList';
import { GlobalStatistics } from './GlobalStatistics';

interface MachinesViewProps {
  onBack: () => void;
  totalMachines: number;
  connectedMachines: number;
}

export const MachinesView: React.FC<MachinesViewProps> = ({
  onBack,
  totalMachines,
  connectedMachines
}) => {
  const [showMachinesList, setShowMachinesList] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  if (showMachinesList) {
    return <MachinesList onBack={() => setShowMachinesList(false)} />;
  }

  if (showStatistics) {
    return <GlobalStatistics onBack={() => setShowStatistics(false)} />;
  }

  const activityCards = [
    { label: 'Totale Macchine', value: totalMachines },
    { label: 'Macchine Connesse', value: connectedMachines },
  ];

  const machinesAndConsumptionItems = [
    { icon: List, title: 'Macchine', subtitle: '', onClick: () => setShowMachinesList(true) },
    { icon: BarChart3, title: 'Statistiche', subtitle: '', onClick: () => setShowStatistics(true) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        {/* Removed Indietro button as requested */}
      </div>

      {/* Activity Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Attività</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activityCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-gray-500">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Machines and Consumption Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Macchine e Consumo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {machinesAndConsumptionItems.map((item, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={item.onClick}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    {item.subtitle && (
                      <p className="text-sm text-gray-500">{item.subtitle}</p>
                    )}
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
