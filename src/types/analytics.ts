export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface DataQuality {
    telemetryDays: number;
    weatherCoverage: number;
    eventDataAvailable: boolean;
}

export interface WeatherElasticity {
    rainyDays: number;
    clearDays: number;
    avgSalesRainy: number;
    avgSalesClear: number;
    elasticityIndex: number;
    confidence: ConfidenceLevel;
}

export interface TopEvent {
    date: string;
    eventName: string;
    sales: number;
    uplift: number;
}

export interface EventImpact {
    eventDays: number;
    nonEventDays: number;
    avgSalesEventDay: number;
    avgSalesNonEventDay: number;
    eventUplift: number;
    topEvents: TopEvent[];
    confidence: ConfidenceLevel;
}

export interface ForecastDay {
    date: string;
    dayOfWeek: string;
    predictedSales: number;
    baselineSales: number;
    weatherFactor: number;
    eventFactor: number;
    weatherDescription: string;
    events: string[];
    confidence: ConfidenceLevel;
}

export interface SmartAnalyticsData {
    serial: string;
    lookbackDays: number;
    dataQuality: DataQuality;
    weatherElasticity: WeatherElasticity;
    eventImpact: EventImpact;
    smartForecast: ForecastDay[];
}

export interface SmartAnalyticsResponse {
    success: boolean;
    data?: SmartAnalyticsData;
    error?: string;
}
