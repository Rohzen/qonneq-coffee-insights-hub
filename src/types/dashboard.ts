
export interface DailyCoffeeData {
  name: string;
  coffee: number;
  espresso: number;
}

export interface TemperatureData {
  time: string;
  temperature: number;
}

export interface AlertData {
  type: string;
  title: string;
  description: string;
  severity: string;
  time: string;
}

export interface MachineData {
  id: string;
  name?: string;
  serialNumber?: string;
  machineId?: string;
  brand: string;
  model: string;
  status: 'online' | 'offline' | 'warning' | 'alarm';
  provider?: string;
  lastConnection?: string;
  companyName?: string;
  waterFilter?: string;
  waterFilterName?: string;
  // Geodata fields
  latitude?: number | null;
  longitude?: number | null;
  location?: string | null;
  // Optional telemetry data
  temperature?: number;
  dailyCoffee?: number;
  monthlyTotal?: number;
  maintenanceDays?: number;
  alerts?: number;
  dailyData?: DailyCoffeeData[];
  temperatureData?: TemperatureData[];
  alertsData?: AlertData[];
}

// --- Enrichment Types ---

export interface NormalizedHourlyWeather {
  date: string;
  hour: number;
  temperature: number | null;
  apparent_temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  weather_condition: string;
  weather_code: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  cloud_cover: number | null;
}

export interface EnrichedEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string | null;
  venue: string;
  venue_lat: number | null;
  venue_lon: number | null;
  distance_km: number;
  url: string | null;
}

export interface EnrichedVenue {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lon: number;
}

export interface FootfallHourly {
  hour: number;
  intensity: number;
}

export interface FootfallDayForecast {
  day_int: number;
  day_text: string;
  busy_hours: number[];
  quiet_hours: number[];
  peak_intensity: number;
  hourly: FootfallHourly[];
}

export interface FootfallForecast {
  venue_id: string;
  venue_name: string;
  days: FootfallDayForecast[];
}

export interface ContextAlert {
  type: 'event' | 'weather' | 'footfall';
  severity: 'info' | 'warning';
  message: string;
}

export interface EnrichedMachineContext {
  serial: string;
  weather: {
    provider: string;
    hourly: NormalizedHourlyWeather[];
  };
  events: {
    items: EnrichedEvent[];
    configured: boolean;
  };
  footfall: {
    venue: EnrichedVenue | null;
    forecast: FootfallForecast | null;
    configured: boolean;
  };
  alerts: ContextAlert[];
}

export interface CustomerData {
  id: string;
  name: string;
  address: string;
  city: string;
  contract: string;
  machinesCount: number;
  accessoriesCount: number;
  machines: MachineData[];
  active: boolean;
  startDate: string;
  lastContact: string;
}
