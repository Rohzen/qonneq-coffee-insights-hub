import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  totalCustomers: number;
  totalMachines: number;
  connectedMachines: number;
  activeAlerts: number;
}

export const useApiDashboardStats = () => {
  const { isAuthenticated, apiProvider } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalMachines: 0,
    connectedMachines: 0,
    activeAlerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useApiDashboardStats] Calling apiProvider.getDashboardStats()...');
      const response = await apiProvider.getDashboardStats();

      if (response.success && response.data) {
        setStats(response.data as DashboardStats);
      } else {
        setError(response.error || 'Failed to load dashboard statistics');
      }
    } catch (err) {
      console.error('[useApiDashboardStats] Exception:', err);
      setError('An error occurred while loading dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isAuthenticated, apiProvider]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};
