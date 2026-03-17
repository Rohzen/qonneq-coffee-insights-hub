
import React from 'react';
import { MachineData } from '@/types/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee, Thermometer, AlertTriangle } from 'lucide-react';

interface MachineSelectorProps {
  machines: MachineData[];
  selectedMachine: MachineData;
  setSelectedMachine: (machine: MachineData) => void;
}

export const MachineSelector: React.FC<MachineSelectorProps> = ({ 
  machines, 
  selectedMachine, 
  setSelectedMachine 
}) => {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-700 mb-4">Seleziona macchina</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {machines.map((machine) => (
          <Card 
            key={machine.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedMachine.id === machine.id 
                ? 'border-2 border-qonneq shadow-md' 
                : 'border border-gray-200'
            }`}
            onClick={() => setSelectedMachine(machine)}
          >
            <CardContent className="p-4 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{machine.brand}</h3>
                  <p className="text-sm text-gray-500">{machine.model}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  machine.status === 'online' ? 'bg-green-500' : 
                  machine.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
              
              <div className="mt-4 flex justify-between">
                <div className="flex items-center text-gray-600 text-sm">
                  <Coffee size={16} className="mr-1" />
                  {machine.dailyCoffee} oggi
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  {machine.alerts > 0 && (
                    <>
                      <AlertTriangle size={16} className="mr-1 text-amber-500" />
                      {machine.alerts}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 flex items-center">
                <Thermometer size={16} className="mr-1" />
                {machine.temperature}°C
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
