
import { useState } from 'react';
import { CustomerData } from '@/types/dashboard';
import { useMachineData } from './useMachineData';

// Generate sample customer data (bars)
const generateCustomers = (): CustomerData[] => {
  const { machines } = useMachineData();
  
  // Duplicate some machines to increase the total count
  const extendedMachines = [
    ...machines,
    ...machines.slice(0, 3).map(machine => ({
      ...machine,
      id: `${machine.id}-A`,
      brand: machine.brand,
      model: `${machine.model} Pro`
    })),
    ...machines.slice(0, 8).map(machine => ({
      ...machine,
      id: `${machine.id}-B`,
      brand: machine.brand,
      model: `${machine.model} Classic`
    }))
  ];
  
  // Distribute machines among customers
  const customerNames = [
    'Bar Milano',
    'Caffè Roma',
    'Bar Napoli',
    'Caffetteria Firenze',
    'Espresso Torino',
    'Bar Venezia',
    'Caffè Bologna',
    'Bar Palermo',
    'Espresso Verona',
    'Caffetteria Genova',
  ];
  
  // Manually specify how many machines each customer should have
  const machinesPerCustomer = [3, 3, 2, 2, 1, 1, 1, 1, 1, 1];
  
  let machineIndex = 0;
  
  return customerNames.map((name, index) => {
    // Get number of machines for this customer
    const machineCount = machinesPerCustomer[index];
    
    // Get machines for this customer
    const customerMachines = extendedMachines.slice(machineIndex, machineIndex + machineCount);
    machineIndex += machineCount;
    
    // Generate random accessory counts for each customer - based on image values
    const accessoriesCounts = [4, 2, 2, 3, 3, 4, 5, 5, 4, 4];
    const accessoriesCount = accessoriesCounts[index];
    
    // Mark Espresso Torino and Espresso Verona as inactive
    const isActive = name !== 'Espresso Torino' && name !== 'Espresso Verona';
    
    // Generate dates following pattern from the image
    const lastContactDates = [
      '14/6/2024', '15/4/2024', '21/3/2024', '27/9/2024', 
      '7/6/2024', '22/3/2024', '14/10/2024', '18/5/2024',
      '3/2/2024', '9/1/2024'
    ];

    // Generate contract numbers like in the image
    const contracts = [
      'CT2796', 'CT5792', 'CT8234', 'CT4736', 
      'CT476', 'CT2864', 'CT7851', 'CT7255',
      'CT7437', 'CT1367'
    ];
    
    // Create the customer object with the correct machine count
    return {
      id: `CUST${(index + 1).toString().padStart(3, '0')}`,
      name,
      address: `Via ${name.split(' ')[1]} ${Math.floor(Math.random() * 200) + 1}`,
      city: name.split(' ')[1],
      contract: contracts[index],
      machinesCount: machineCount,
      accessoriesCount,
      machines: customerMachines,
      active: isActive,
      startDate: `${Math.floor(Math.random() * 28) + 1}/${Math.floor(Math.random() * 12) + 1}/${2020 + Math.floor(Math.random() * 4)}`,
      lastContact: lastContactDates[index],
    };
  });
};

export const useCustomerData = () => {
  const [customers] = useState<CustomerData[]>(generateCustomers());
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  return {
    customers,
    selectedCustomer,
    setSelectedCustomer,
    totalMachines: 15, // Esplicitamente impostato a 15 come per l'immagine
    totalAccessories: 36, // Impostato per corrispondere all'immagine
    activeCustomers: customers.filter(customer => customer.active).length
  };
};
