
import React, { useState, useEffect } from 'react';
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useLanguage } from "@/context/LanguageContext";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CustomerDetail } from "@/components/dashboard/CustomerDetail";
import { MachinesView } from "@/components/dashboard/MachinesView";
import { useApiMachineData as useMachineData } from "@/hooks/useApiMachineData";
import { useApiDashboardStats } from "@/hooks/useApiDashboardStats";

const Dashboard = () => {
  const { language } = useLanguage();
  const { machines, selectedMachine, setSelectedMachine, isLoading: machinesLoading, error: machinesError } = useMachineData();
  const { stats, isLoading: statsLoading, error: statsError } = useApiDashboardStats();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Add noindex meta tag for SEO
  useEffect(() => {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    return () => {
      document.head.removeChild(metaRobots);
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('[Dashboard] Stats:', stats);
    console.log('[Dashboard] Machines:', machines);
    console.log('[Dashboard] Loading - stats:', statsLoading, 'machines:', machinesLoading);
    console.log('[Dashboard] Errors - stats:', statsError, 'machines:', machinesError);
  }, [stats, machines, statsLoading, machinesLoading, statsError, machinesError]);

  // Se la lingua non è italiano, reindirizza alla home page
  if (language !== 'it') {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          <DashboardHeader />

          {selectedCustomer ? (
            <CustomerDetail
              customer={selectedCustomer}
              selectedMachine={selectedMachine}
              setSelectedMachine={setSelectedMachine}
              onBack={() => setSelectedCustomer(null)}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          ) : (
            <MachinesView
              onBack={() => {}}
              totalMachines={stats.totalMachines}
              connectedMachines={stats.connectedMachines}
            />
          )}
        </div>
      </section>
      <Footer minimal />
      <ScrollToTop />
    </div>
  );
};

export default Dashboard;
