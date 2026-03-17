import { WeatherData } from './weather';
import { TicketmasterEvent } from './ticketmaster';

// --- Types ---

export interface DailySales {
    date: string;
    totalDrinks: number;
    dayOfWeek: number; // 0=Monday ... 6=Sunday
}

export interface DailyPrecipitation {
    date: string;
    totalMm: number;
}

type ConfidenceLevel = 'low' | 'medium' | 'high';

function getConfidence(sampleSize: number): ConfidenceLevel {
    if (sampleSize < 5) return 'low';
    if (sampleSize < 15) return 'medium';
    return 'high';
}

// Italian day names (Monday-first)
const ITALIAN_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// --- Telemetry Aggregation ---

/**
 * Aggregate telemetry rows into daily total drinks.
 * Each row has coffee_count / espresso_count as cumulative counters.
 * We compute daily deltas by taking max-min per day.
 */
export function aggregateDailySales(telemetryRows: any[]): DailySales[] {
    if (!telemetryRows || telemetryRows.length === 0) return [];

    // Group by date
    const byDate = new Map<string, { coffees: number[]; espressos: number[] }>();

    for (const row of telemetryRows) {
        const date = new Date(row.timestamp).toISOString().split('T')[0];
        if (!byDate.has(date)) {
            byDate.set(date, { coffees: [], espressos: [] });
        }
        const entry = byDate.get(date)!;
        const coffee = Number(row.coffee_count) || 0;
        const espresso = Number(row.espresso_count) || 0;
        entry.coffees.push(coffee);
        entry.espressos.push(espresso);
    }

    const result: DailySales[] = [];
    for (const [date, { coffees, espressos }] of byDate) {
        const coffeeDelta = Math.max(0, Math.max(...coffees) - Math.min(...coffees));
        const espressoDelta = Math.max(0, Math.max(...espressos) - Math.min(...espressos));
        const dt = new Date(date);
        // getDay: 0=Sun, convert to 0=Mon
        const dow = (dt.getDay() + 6) % 7;
        result.push({
            date,
            totalDrinks: coffeeDelta + espressoDelta,
            dayOfWeek: dow,
        });
    }

    // Sort by date ascending
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
}

// --- Weather Aggregation ---

/**
 * Aggregate hourly weather data into daily total precipitation.
 */
export function aggregateDailyPrecipitation(weatherData: WeatherData[]): DailyPrecipitation[] {
    if (!weatherData || weatherData.length === 0) return [];

    const byDate = new Map<string, number>();
    for (const w of weatherData) {
        const current = byDate.get(w.date) || 0;
        byDate.set(w.date, current + (w.precipitation || 0));
    }

    return Array.from(byDate.entries())
        .map(([date, totalMm]) => ({ date, totalMm }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

// --- Weather Elasticity ---

export interface WeatherElasticityResult {
    rainyDays: number;
    clearDays: number;
    avgSalesRainy: number;
    avgSalesClear: number;
    elasticityIndex: number;
    confidence: ConfidenceLevel;
}

export function computeWeatherElasticity(
    dailySales: DailySales[],
    dailyPrecip: DailyPrecipitation[]
): WeatherElasticityResult {
    const precipMap = new Map(dailyPrecip.map(d => [d.date, d.totalMm]));

    const rainySales: number[] = [];
    const clearSales: number[] = [];

    for (const day of dailySales) {
        const precip = precipMap.get(day.date);
        if (precip === undefined) continue; // no weather data for this day

        if (precip > 2) {
            rainySales.push(day.totalDrinks);
        } else {
            clearSales.push(day.totalDrinks);
        }
    }

    const avgRainy = rainySales.length > 0 ? rainySales.reduce((a, b) => a + b, 0) / rainySales.length : 0;
    const avgClear = clearSales.length > 0 ? clearSales.reduce((a, b) => a + b, 0) / clearSales.length : 0;

    const elasticity = avgClear > 0 ? ((avgRainy - avgClear) / avgClear) * 100 : 0;
    const minSamples = Math.min(rainySales.length, clearSales.length);

    return {
        rainyDays: rainySales.length,
        clearDays: clearSales.length,
        avgSalesRainy: Math.round(avgRainy * 10) / 10,
        avgSalesClear: Math.round(avgClear * 10) / 10,
        elasticityIndex: Math.round(elasticity * 10) / 10,
        confidence: getConfidence(minSamples),
    };
}

// --- Event Impact ---

export interface EventImpactResult {
    eventDays: number;
    nonEventDays: number;
    avgSalesEventDay: number;
    avgSalesNonEventDay: number;
    eventUplift: number;
    topEvents: { date: string; eventName: string; sales: number; uplift: number }[];
    confidence: ConfidenceLevel;
}

export function computeEventImpact(
    dailySales: DailySales[],
    events: TicketmasterEvent[]
): EventImpactResult {
    // Build set of event dates and map date -> event names
    const eventDateMap = new Map<string, string[]>();
    for (const ev of events) {
        if (!ev.date) continue;
        if (!eventDateMap.has(ev.date)) {
            eventDateMap.set(ev.date, []);
        }
        eventDateMap.get(ev.date)!.push(ev.name);
    }

    const eventDaySales: number[] = [];
    const nonEventDaySales: number[] = [];

    // For day-of-week average (for per-event uplift)
    const dowSales = new Map<number, number[]>();

    for (const day of dailySales) {
        if (!dowSales.has(day.dayOfWeek)) {
            dowSales.set(day.dayOfWeek, []);
        }
        dowSales.get(day.dayOfWeek)!.push(day.totalDrinks);

        if (eventDateMap.has(day.date)) {
            eventDaySales.push(day.totalDrinks);
        } else {
            nonEventDaySales.push(day.totalDrinks);
        }
    }

    const avgEvent = eventDaySales.length > 0 ? eventDaySales.reduce((a, b) => a + b, 0) / eventDaySales.length : 0;
    const avgNonEvent = nonEventDaySales.length > 0 ? nonEventDaySales.reduce((a, b) => a + b, 0) / nonEventDaySales.length : 0;
    const uplift = avgNonEvent > 0 ? ((avgEvent - avgNonEvent) / avgNonEvent) * 100 : 0;

    // Compute per-event uplift vs same day-of-week average
    const salesByDate = new Map(dailySales.map(d => [d.date, d]));
    const topEvents: { date: string; eventName: string; sales: number; uplift: number }[] = [];

    for (const [date, names] of eventDateMap) {
        const dayData = salesByDate.get(date);
        if (!dayData) continue;

        const dowAvg = (() => {
            const arr = dowSales.get(dayData.dayOfWeek);
            if (!arr || arr.length === 0) return 0;
            return arr.reduce((a, b) => a + b, 0) / arr.length;
        })();

        const eventUplift = dowAvg > 0 ? ((dayData.totalDrinks - dowAvg) / dowAvg) * 100 : 0;

        topEvents.push({
            date,
            eventName: names[0],
            sales: dayData.totalDrinks,
            uplift: Math.round(eventUplift * 10) / 10,
        });
    }

    // Sort by uplift descending, take top 5
    topEvents.sort((a, b) => b.uplift - a.uplift);
    const top5 = topEvents.slice(0, 5);

    return {
        eventDays: eventDaySales.length,
        nonEventDays: nonEventDaySales.length,
        avgSalesEventDay: Math.round(avgEvent * 10) / 10,
        avgSalesNonEventDay: Math.round(avgNonEvent * 10) / 10,
        eventUplift: Math.round(uplift * 10) / 10,
        topEvents: top5,
        confidence: getConfidence(eventDaySales.length),
    };
}

// --- Smart Forecast (7 Days) ---

export interface ForecastDayResult {
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

export function computeSmartForecast(
    dailySales: DailySales[],
    elasticityIndex: number,
    eventUplift: number,
    forecastWeather: WeatherData[],
    futureEvents: TicketmasterEvent[],
    weatherDescriptionFn: (code?: number | null) => string | null
): ForecastDayResult[] {
    // 1. Compute day-of-week baseline (average sales per dow)
    const dowTotals = new Map<number, { sum: number; count: number }>();
    for (const day of dailySales) {
        if (!dowTotals.has(day.dayOfWeek)) {
            dowTotals.set(day.dayOfWeek, { sum: 0, count: 0 });
        }
        const entry = dowTotals.get(day.dayOfWeek)!;
        entry.sum += day.totalDrinks;
        entry.count++;
    }

    // Global average as fallback
    const globalAvg = dailySales.length > 0
        ? dailySales.reduce((s, d) => s + d.totalDrinks, 0) / dailySales.length
        : 0;

    // 2. Aggregate forecast weather by date (daily precipitation + dominant weather code)
    const forecastByDate = new Map<string, { totalPrecip: number; weatherCode: number | null }>();
    for (const w of forecastWeather) {
        if (!forecastByDate.has(w.date)) {
            forecastByDate.set(w.date, { totalPrecip: 0, weatherCode: null });
        }
        const entry = forecastByDate.get(w.date)!;
        entry.totalPrecip += w.precipitation || 0;
        // Use noon weather code as representative, or highest code
        if (w.hour === 12 || entry.weatherCode === null) {
            entry.weatherCode = w.weather_code;
        }
    }

    // 3. Build event date map for future
    const futureEventMap = new Map<string, string[]>();
    for (const ev of futureEvents) {
        if (!ev.date) continue;
        if (!futureEventMap.has(ev.date)) {
            futureEventMap.set(ev.date, []);
        }
        futureEventMap.get(ev.date)!.push(ev.name);
    }

    // 4. Generate 7 day forecast
    const result: ForecastDayResult[] = [];
    for (let i = 0; i < 7; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i + 1);
        const dateStr = forecastDate.toISOString().split('T')[0];
        const dow = (forecastDate.getDay() + 6) % 7; // 0=Mon

        // Baseline from historical day-of-week average
        const dowData = dowTotals.get(dow);
        const baseline = dowData ? dowData.sum / dowData.count : globalAvg;

        // Weather factor
        const forecastDay = forecastByDate.get(dateStr);
        const isRainy = forecastDay ? forecastDay.totalPrecip > 2 : false;
        const weatherFactor = isRainy ? 1 + (elasticityIndex / 100) : 1.0;

        // Event factor
        const dayEvents = futureEventMap.get(dateStr) || [];
        const eventFactor = dayEvents.length > 0 ? 1 + (eventUplift / 100) : 1.0;

        const predicted = Math.max(0, Math.round(baseline * weatherFactor * eventFactor));

        const weatherCode = forecastDay?.weatherCode;
        const weatherDesc = weatherDescriptionFn(weatherCode) || 'N/D';

        // Confidence based on how much data we have for this dow
        const sampleCount = dowData?.count || 0;

        result.push({
            date: dateStr,
            dayOfWeek: ITALIAN_DAYS[dow],
            predictedSales: predicted,
            baselineSales: Math.round(baseline),
            weatherFactor: Math.round(weatherFactor * 100) / 100,
            eventFactor: Math.round(eventFactor * 100) / 100,
            weatherDescription: weatherDesc,
            events: dayEvents,
            confidence: getConfidence(sampleCount),
        });
    }

    return result;
}
