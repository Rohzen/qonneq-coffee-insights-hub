import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { CustomerData } from '@/types/dashboard';
import { useAuth } from '@/context/AuthContext';

export const useApiCustomerData = () => {
  const { isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [stats, setStats] = useState({
    totalMachines: 0,
    totalAccessories: 0,
    activeCustomers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.getCustomers();

      if (response.success && response.data) {
        const customersData = response.data as CustomerData[];
        setCustomers(customersData);

        // Calculate stats
        const totalMachines = customersData.reduce(
          (sum, customer) => sum + customer.machinesCount,
          0
        );
        const totalAccessories = customersData.reduce(
          (sum, customer) => sum + customer.accessoriesCount,
          0
        );
        const activeCustomers = customersData.filter(c => c.active).length;

        setStats({
          totalMachines,
          totalAccessories,
          activeCustomers,
        });
      } else {
        setError(response.error || 'Failed to load customers');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('An error occurred while loading customers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomer = async (customerId: number) => {
    if (!isAuthenticated) return;

    try {
      const response = await apiClient.getCustomer(customerId);

      if (response.success && response.data) {
        const customerData = response.data as CustomerData;

        // Update customer in list
        setCustomers(prev =>
          prev.map(c => (c.id === customerData.id ? customerData : c))
        );

        // Update selected customer if it's the current one
        if (selectedCustomer?.id === customerData.id) {
          setSelectedCustomer(customerData);
        }

        return customerData;
      } else {
        console.error('Failed to fetch customer:', response.error);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [isAuthenticated]);

  return {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    totalMachines: stats.totalMachines,
    totalAccessories: stats.totalAccessories,
    activeCustomers: stats.activeCustomers,
    isLoading,
    error,
    refetch: fetchCustomers,
    fetchCustomer,
  };
};
