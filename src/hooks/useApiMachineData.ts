import { useState, useEffect } from 'react';
import { MachineData } from '@/types/dashboard';
import { useAuth } from '@/context/AuthContext';

export const useApiMachineData = () => {
  const { isAuthenticated, apiProvider } = useAuth();
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<MachineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMachines = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useApiMachineData] Calling apiProvider.getMachines()...');
      const response = await apiProvider.getMachines();

      if (response.success && response.data) {
        const machinesData = response.data as any[];

        // Basic mapping if needed (standalone might return different structure than Odoo)
        const normalizedData: MachineData[] = machinesData.map(m => ({
          ...m,
          id: m.id || m.machineId || m.serial,
          brand: m.brand || 'Unknown',
          model: m.model || 'Unknown',
          status: m.status || 'offline',
        }));

        setMachines(normalizedData);

        // Set first machine as selected if none selected
        if (!selectedMachine && normalizedData.length > 0) {
          setSelectedMachine(normalizedData[0]);
        }
      } else {
        setError(response.error || 'Failed to load machines');
      }
    } catch (err) {
      console.error('Error fetching machines:', err);
      setError('An error occurred while loading machines');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachine = async (machineId: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await apiProvider.getMachine(machineId);

      if (response.success && response.data) {
        const machineData = response.data as any;

        const normalized: MachineData = {
          ...machineData,
          id: machineData.id || machineData.machineId || machineData.serial,
        };

        // Update machine in list
        setMachines(prev =>
          prev.map(m => (m.id === machineId ? normalized : m))
        );

        // Update selected machine if it's the current one
        if (selectedMachine?.id === machineId) {
          setSelectedMachine(normalized);
        }

        return normalized;
      } else {
        console.error('Failed to fetch machine:', response.error);
      }
    } catch (err) {
      console.error('Error fetching machine:', err);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [isAuthenticated, apiProvider]);

  return {
    machines,
    selectedMachine,
    setSelectedMachine,
    isLoading,
    error,
    refetch: fetchMachines,
    fetchMachine,
  };
};
