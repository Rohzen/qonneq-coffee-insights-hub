
import React from 'react';
import { CustomerData } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { MachineSelector } from './MachineSelector';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';
import { DashboardAlerts } from './DashboardAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsumptionTab } from "@/components/dashboard/ConsumptionTab";
import { MaintenanceTab } from "@/components/dashboard/MaintenanceTab";

interface CustomerDetailProps {
  customer: CustomerData;
  selectedMachine: any;
  setSelectedMachine: (machine: any) => void;
  onBack: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ 
  customer, 
  selectedMachine, 
  setSelectedMachine,
  onBack,
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
          <p className="text-sm text-gray-500">{customer.address}, {customer.city} - Contratto {customer.contract}</p>
        </div>
      </div>
      
      <div className="my-8">
        <MachineSelector 
          machines={customer.machines} 
          selectedMachine={selectedMachine} 
          setSelectedMachine={setSelectedMachine} 
        />
      </div>
      
      <div className="mb-8">
        <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="consumption">Consumi</TabsTrigger>
            <TabsTrigger value="maintenance">Manutenzione</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <DashboardStats machineData={selectedMachine} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DashboardCharts machineData={selectedMachine} />
              <DashboardAlerts machineData={selectedMachine} />
            </div>
          </TabsContent>
          
          <TabsContent value="consumption">
            <ConsumptionTab machineData={selectedMachine} />
          </TabsContent>
          
          <TabsContent value="maintenance">
            <MaintenanceTab machineData={selectedMachine} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
