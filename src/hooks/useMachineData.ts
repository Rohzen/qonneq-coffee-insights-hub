
import { useState } from 'react';
import { MachineData } from '@/types/dashboard';

// Funzione per generare dati simulati per il grafico delle erogazioni giornaliere
const generateDailyData = () => {
  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  return days.map(day => ({
    name: day,
    coffee: Math.floor(Math.random() * 50) + 30,
    espresso: Math.floor(Math.random() * 40) + 20,
  }));
};

// Funzione per generare dati simulati per il grafico della temperatura
const generateTemperatureData = () => {
  const times = ['8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  return times.map(time => ({
    time,
    temperature: Math.floor(Math.random() * 8) + 88, // Temperatura tra 88°C e 96°C
  }));
};

// Funzione per generare avvisi simulati
const generateAlerts = (num: number) => {
  const alertTypes = [
    {
      type: 'temperature',
      title: 'Temperatura elevata',
      description: 'La temperatura della caldaia ha superato i 96°C.',
      severity: 'high',
      time: '10:23'
    },
    {
      type: 'coffee',
      title: 'Scorta caffè in esaurimento',
      description: 'La scorta di caffè è inferiore al 15%. Rifornire al più presto.',
      severity: 'medium',
      time: '09:45'
    },
    {
      type: 'system',
      title: 'Necessaria manutenzione',
      description: 'Pulizia del gruppo erogatore consigliata.',
      severity: 'low',
      time: '08:30'
    },
    {
      type: 'connection',
      title: 'Connessione intermittente',
      description: 'Rilevati problemi di connettività negli ultimi 30 minuti.',
      severity: 'medium',
      time: '11:05'
    }
  ];
  
  // Seleziona num avvisi casuali dall'array
  const shuffled = [...alertTypes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

// Dati simulati per le macchine
const machinesData: MachineData[] = [
  {
    id: 'MC001',
    brand: 'La Cimbali',
    model: 'M100 HD DT3',
    status: 'online',
    temperature: 92,
    dailyCoffee: 78,
    monthlyTotal: 1247,
    maintenanceDays: 14,
    alerts: 2,
    dailyData: generateDailyData(),
    temperatureData: generateTemperatureData(),
    alertsData: generateAlerts(2)
  },
  {
    id: 'MC002',
    brand: 'Faema',
    model: 'E71E',
    status: 'warning',
    temperature: 94,
    dailyCoffee: 52,
    monthlyTotal: 983,
    maintenanceDays: 5,
    alerts: 1,
    dailyData: generateDailyData(),
    temperatureData: generateTemperatureData(),
    alertsData: generateAlerts(1)
  },
  {
    id: 'MC003',
    brand: 'Rancilio',
    model: 'Specialty RS1',
    status: 'offline',
    temperature: 0,
    dailyCoffee: 0,
    monthlyTotal: 1536,
    maintenanceDays: 0,
    alerts: 3,
    dailyData: generateDailyData(),
    temperatureData: generateTemperatureData(),
    alertsData: generateAlerts(3)
  },
  {
    id: 'MC004',
    brand: 'WMF',
    model: '9000S+',
    status: 'online',
    temperature: 91,
    dailyCoffee: 124,
    monthlyTotal: 2145,
    maintenanceDays: 30,
    alerts: 0,
    dailyData: generateDailyData(),
    temperatureData: generateTemperatureData(),
    alertsData: []
  }
];

export const useMachineData = () => {
  const [machines] = useState<MachineData[]>(machinesData);
  const [selectedMachine, setSelectedMachine] = useState<MachineData>(machines[0]);

  return {
    machines,
    selectedMachine,
    setSelectedMachine
  };
};
