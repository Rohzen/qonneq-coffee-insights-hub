import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool, PoolConfig } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// ============================================================
// CONFIGURATION
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || 'qonneq_standalone_secret_change_me';

// ============================================================
// DATABASE
// ============================================================
let pool: Pool | null = null;
function getDbPool(): Pool {
    if (pool) return pool;
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const config: PoolConfig = connectionString
        ? { connectionString, ssl: { rejectUnauthorized: false } }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5430'),
            database: process.env.DB_NAME || 'qonneq',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'openpgpwd',
        };
    pool = new Pool(config);
    return pool;
}
async function query(text: string, params?: any[]) {
    return await getDbPool().query(text, params);
}

// ============================================================
// AUTH UTILITIES
// ============================================================
function verifyAuth(req: VercelRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}
function isAdmin(decoded: any) { return decoded && decoded.role === 'admin'; }

// ============================================================
// CIMBALI API
// ============================================================
interface CimbaliCredentials { username: string; password: string; }
interface CimbaliTelemetryRecord {
    timestamp: string; coffee_count: number; espresso_count: number; total_count: number;
    cappuccino_count: number; latte_count: number; temperature?: number;
    water_ph?: number; water_tds?: number; water_temperature?: number;
    pressure?: number; power_consumption?: number;
}

function getCimbaliBasicAuth(creds: CimbaliCredentials): string {
    return Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
}

function parseCimbaliTimestamp(value: any): Date | null {
    if (!value) return null;
    if (typeof value === 'number') return value > 1e12 ? new Date(value) : new Date(value * 1000);
    if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
            const n = parseInt(value, 10);
            if (!isNaN(n)) return n > 1e12 ? new Date(n) : new Date(n * 1000);
        }
        let cleanValue = value;
        if (value.includes('.') && value.includes('/')) cleanValue = value.split('.')[0];
        const m = cleanValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/);
        if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), m[4] ? parseInt(m[4]) : 0, m[5] ? parseInt(m[5]) : 0, m[6] ? parseInt(m[6]) : 0);
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d;
    }
    return null;
}

async function getCimbaliMachines(creds: CimbaliCredentials, startIndex = 0, limit = 100): Promise<any[]> {
    const auth = getCimbaliBasicAuth(creds);
    try {
        const response = await fetch(`https://public-api.cimbaligroup.tech/api/v1/GetMachines?startIndex=${startIndex}&limit=${limit}`, {
            headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`Cimbali API error: ${response.status}`);
        const data = await response.json() as any;
        if (!data.success) throw new Error(data.message || 'Cimbali API returned success: false');
        return data.data.map((m: any) => {
            const lat = parseFloat(m.realPosLatitude || m.latitude || m.lat || 0) || undefined;
            const lon = parseFloat(m.realPosLongitude || m.longitude || m.lng || m.lon || 0) || undefined;
            const lcd = parseCimbaliTimestamp(m.serverDateTime);
            return {
                id: m.serial, machineId: m.serial, serial: m.serial,
                name: m.name || `${m.model} (${m.serial})`,
                brand: m.brand || m.brandName || 'CIMBALI', model: m.model || m.modelName,
                family: m.family || m.model, status: m.connected ? 'online' : 'offline',
                lastConnection: lcd ? lcd.toISOString() : null, provider: 'cimbali',
                customerName: m.customer || m.customerName || m.Customer || null,
                customerGroup: m.customerGroup || m.CustomerGroup || null,
                latitude: lat, longitude: lon, location: m.location || m.address || null
            };
        });
    } catch (error) { console.error('Cimbali fetch error:', error); return []; }
}

async function getCimbaliMachineInfo(creds: CimbaliCredentials, serial: string): Promise<any> {
    const auth = getCimbaliBasicAuth(creds);
    try {
        const response = await fetch(`https://public-api.cimbaligroup.tech/api/v1/GetMachineInfo?serial=${serial}`, {
            headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
        });
        if (!response.ok) {
            const machines = await getCimbaliMachines(creds);
            return machines.find(m => m.serial === serial) || null;
        }
        const data = await response.json() as any;
        if (!data.success || !data.data) {
            const machines = await getCimbaliMachines(creds);
            return machines.find(m => m.serial === serial) || null;
        }
        const m = data.data;
        const lat = parseFloat(m.realPosLatitude || m.latitude || m.lat || 0) || undefined;
        const lon = parseFloat(m.realPosLongitude || m.longitude || m.lng || m.lon || 0) || undefined;
        const lcd = parseCimbaliTimestamp(m.serverDateTime);
        return {
            id: m.serial, machineId: m.serial, serial: m.serial,
            name: m.name || `${m.model} (${m.serial})`,
            brand: m.brand || m.brandName || 'CIMBALI', model: m.model || m.modelName,
            family: m.family || m.model, status: m.connected ? 'online' : 'offline',
            lastConnection: lcd ? lcd.toISOString() : null, provider: 'cimbali',
            customerName: m.customer || m.customerName || null,
            customerGroup: m.customerGroup || null,
            latitude: lat, longitude: lon, location: m.location || m.address || null
        };
    } catch (error) { console.error('Cimbali machine info error:', error); return null; }
}

async function getCimbaliTelemetry(creds: CimbaliCredentials, serial: string, startDate?: number, endDate?: number): Promise<CimbaliTelemetryRecord[]> {
    const auth = getCimbaliBasicAuth(creds);
    const end = endDate || Date.now();
    const start = startDate || (end - 7 * 24 * 60 * 60 * 1000);
    try {
        const response = await fetch(`https://public-api.cimbaligroup.tech/api/v1/GetReportConsumeBetween?serial=${serial}&startDate=${start}&endDate=${end}`, {
            headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
        });
        if (!response.ok) return [];
        const data = await response.json() as any;
        const consumeData = data.consume || data.consumes || data.data || [];
        return consumeData.map((record: any) => {
            const rawTs = record.timestamp || record.dateTime || record.datetime || record.date || record.consumeDate || record.createdAt || record.startTime || record.ping;
            const dateObj = parseCimbaliTimestamp(rawTs);
            if (!dateObj) return null;
            let coffee = 0, espresso = 0, total = 0, cappuccino = 0, latte = 0;
            if (Array.isArray(record.data) && record.data.length > 0 && record.data[0].name) {
                const counters: Record<string, number> = {};
                record.data.forEach((item: any) => { counters[(item.name || '').toLowerCase()] = parseFloat(item.value || 0); });
                total = counters['numcaffegenerale'] || 0;
                cappuccino = counters['numcappuccino'] || 0;
                latte = counters['numlatte'] || 0;
                for (const [key, val] of Object.entries(counters)) {
                    if (key.includes('numcaffegruppo')) coffee += val;
                    else if (key.includes('espresso')) espresso += val;
                }
                if (coffee === 0 && total > 0) coffee = total;
            } else {
                const nc = record.counters || {};
                coffee = parseFloat(record.coffee || record.coffeeCount || nc.coffee || nc.coffeeCount || 0);
                espresso = parseFloat(record.espresso || record.espressoCount || nc.espresso || nc.espressoCount || 0);
                total = parseFloat(record.total || record.totalCount || nc.total || nc.totalCount || 0);
                cappuccino = parseFloat(record.cappuccino || record.cappuccinoCount || nc.cappuccino || 0);
                latte = parseFloat(record.latte || record.latteCount || nc.latte || 0);
                if (total === 0) total = coffee + espresso;
            }
            return {
                timestamp: dateObj.toISOString(), coffee_count: Math.round(coffee), espresso_count: Math.round(espresso),
                total_count: Math.round(total), cappuccino_count: Math.round(cappuccino), latte_count: Math.round(latte),
                temperature: parseFloat(record.temperature || record.temp || 0) || null,
                water_ph: parseFloat(record.waterPh || 0) || null, water_tds: parseFloat(record.waterTds || 0) || null,
                water_temperature: parseFloat(record.waterTemperature || record.waterTemp || 0) || null,
                pressure: parseFloat(record.pressure || 0) || null,
                power_consumption: parseFloat(record.powerConsumption || record.power || 0) || null
            };
        }).filter((r: any) => !!r).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) { console.error('Cimbali telemetry error:', error); return []; }
}

async function getCimbaliAlerts(creds: CimbaliCredentials, serial: string): Promise<any[]> {
    const auth = getCimbaliBasicAuth(creds);
    try {
        const response = await fetch(`https://public-api.cimbaligroup.tech/api/v1/GetMachineAlerts?serial=${serial}`, {
            headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
        });
        if (!response.ok) return [];
        const data = await response.json() as any;
        return data.alerts || data.data || [];
    } catch (error) { console.error('Cimbali alerts error:', error); return []; }
}

// ============================================================
// BRITA API
// ============================================================
interface BritaCredentials { apiKey: string; tenantId: string; }

async function getBritaResources(creds: BritaCredentials, maxPageSize?: number, continuationToken?: string) {
    let url = `https://api.brita.net/iq/public/v1/tenants/${creds.tenantId}/resources`;
    const params = new URLSearchParams();
    if (maxPageSize) params.append('maxPageSize', maxPageSize.toString());
    if (continuationToken) params.append('continuationToken', continuationToken);
    if (params.toString()) url += `?${params.toString()}`;
    try {
        const response = await fetch(url, { headers: { 'X-API-KEY': creds.apiKey, 'Accept': 'application/json' } });
        if (!response.ok) throw new Error(`Brita API error: ${response.status}`);
        const data = await response.json() as any;
        const resources = (data.values || []).map((item: any) => {
            const resource = item.resource || {};
            const type = resource.type || 'Unknown';
            let modelName = type, serial = item.id, status = 'offline';
            const geo = item.geoLocation || {};
            const lat = geo.latitude ? parseFloat(geo.latitude) : undefined;
            const lon = geo.longitude ? parseFloat(geo.longitude) : undefined;
            const loc = item.location ? `${item.location.street || ''} ${item.location.city || ''} ${item.location.postalCode || ''}`.trim() : undefined;
            if (type === 'PURITY_C_IQ') {
                const p = resource.purityCiQ || {};
                serial = p.id || item.id;
                status = (p.variant || '') === 'ONLINE' ? 'online' : 'offline';
                const ct = (p.reported || {}).cartridge?.type || '';
                modelName = ct ? ct.replace('_', ' ') : 'Purity C iQ';
            } else if (type === 'IQ_METER') {
                const m = resource.iqMeter || {};
                serial = m.id || item.id; modelName = 'iQ Meter';
                status = m.lastDeviceEvent ? 'online' : 'offline';
            } else if (type === 'DISPENSER') {
                const d = resource.dispenser || {};
                serial = d.serialNumber || item.id; modelName = 'Dispenser';
                status = d.lastDeviceEventUtc ? 'online' : 'offline';
            }
            return {
                id: serial, resourceId: item.id, machineId: serial, serial, name: item.name || `${modelName} (${serial})`,
                brand: 'BRITA', model: modelName, status, resourceType: type, lastConnection: null, provider: 'brita',
                latitude: lat, longitude: lon, location: loc
            };
        });
        return { items: resources, continuationToken: data.continuationToken };
    } catch (error) { console.error('Brita fetch error:', error); return { items: [], continuationToken: null }; }
}

async function getBritaResourceDetail(creds: BritaCredentials, resourceId: string) {
    const url = `https://api.brita.net/iq/public/v1/tenants/${creds.tenantId}/resources/${resourceId}`;
    const response = await fetch(url, { headers: { 'X-API-KEY': creds.apiKey, 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Brita API error: ${response.status}`);
    return await response.json();
}

// ============================================================
// WEATHER (Open-Meteo)
// ============================================================
interface WeatherData {
    date: string; hour: number; temperature: number | null; apparent_temperature: number | null;
    humidity: number | null; precipitation: number | null; rain: number | null;
    weather_code: number | null; wind_speed: number | null; wind_direction: number | null;
    pressure: number | null; cloud_cover: number | null; uv_index: number | null;
}

const HOURLY_VARIABLES = ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m', 'precipitation', 'rain', 'weather_code', 'wind_speed_10m', 'wind_direction_10m', 'surface_pressure', 'cloud_cover', 'uv_index'];

async function getHistoricalWeather(latitude: number, longitude: number, startDate: Date, endDate: Date): Promise<any> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const params = new URLSearchParams({ latitude: latitude.toString(), longitude: longitude.toString(), start_date: startStr, end_date: endStr, hourly: HOURLY_VARIABLES.join(','), timezone: 'UTC' });
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const useArchive = startDate < fiveDaysAgo;
    const baseUrl = useArchive ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast';
    try {
        const response = await fetch(`${baseUrl}?${params.toString()}`);
        if (!response.ok) {
            if (useArchive) {
                const fb = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
                if (fb.ok) return await fb.json();
            }
            return null;
        }
        return await response.json();
    } catch (error) { console.error('[Weather] API error:', error); return null; }
}

function parseHourlyData(data: any): WeatherData[] {
    if (!data?.hourly) return [];
    const hourly = data.hourly;
    const times = hourly.time || [];
    return times.map((timestamp: string, i: number) => {
        const [dateStr, timeStr] = timestamp.split('T');
        const hour = parseInt(timeStr.split(':')[0], 10);
        const g = (key: string) => { const arr = hourly[key]; return (arr && i < arr.length) ? arr[i] : null; };
        return {
            date: dateStr, hour, temperature: g('temperature_2m'), apparent_temperature: g('apparent_temperature'),
            humidity: g('relative_humidity_2m'), precipitation: g('precipitation'), rain: g('rain'),
            weather_code: g('weather_code'), wind_speed: g('wind_speed_10m'), wind_direction: g('wind_direction_10m'),
            pressure: g('surface_pressure'), cloud_cover: g('cloud_cover'), uv_index: g('uv_index'),
        };
    });
}

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
    0: 'Sereno', 1: 'Prevalentemente sereno', 2: 'Parzialmente nuvoloso', 3: 'Coperto',
    45: 'Nebbia', 48: 'Nebbia con brina', 51: 'Pioviggine leggera', 53: 'Pioviggine moderata',
    55: 'Pioviggine intensa', 56: 'Pioviggine gelata leggera', 57: 'Pioviggine gelata intensa',
    61: 'Pioggia debole', 63: 'Pioggia moderata', 65: 'Pioggia forte',
    66: 'Pioggia gelata leggera', 67: 'Pioggia gelata forte', 71: 'Neve debole',
    73: 'Neve moderata', 75: 'Neve forte', 77: 'Granuli di neve',
    80: 'Rovesci di pioggia deboli', 81: 'Rovesci di pioggia moderati', 82: 'Rovesci di pioggia violenti',
    85: 'Rovesci di neve deboli', 86: 'Rovesci di neve forti', 95: 'Temporale',
    96: 'Temporale con grandine debole', 99: 'Temporale con grandine forte',
};

function getWeatherDescription(code?: number | null): string | null {
    if (code === null || code === undefined) return null;
    return WEATHER_CODE_DESCRIPTIONS[code] || 'Unknown';
}
function getWeatherIconKey(code?: number | null): string | null {
    if (code === null || code === undefined) return null;
    if (code === 0) return 'sun'; if (code <= 3) return 'cloud'; if (code <= 48) return 'fog';
    if (code <= 57) return 'drizzle'; if (code <= 67) return 'rain'; if (code <= 77) return 'snow';
    if (code <= 82) return 'rain'; return 'thunder';
}
function buildWeatherIndex(weatherData: WeatherData[]): Map<string, WeatherData> {
    const index = new Map<string, WeatherData>();
    for (const entry of weatherData) index.set(`${entry.date}-${entry.hour}`, entry);
    return index;
}
function getDateKeyAndHour(date: Date): { dateKey: string; hour: number } {
    const y = date.getUTCFullYear(), mo = String(date.getUTCMonth() + 1).padStart(2, '0'), d = String(date.getUTCDate()).padStart(2, '0');
    return { dateKey: `${y}-${mo}-${d}`, hour: date.getUTCHours() };
}

// ============================================================
// OPENWEATHERMAP
// ============================================================
async function getOWMHourlyHistory(apiKey: string, lat: number, lon: number, date: Date): Promise<any[] | null> {
    const dt = Math.floor(date.getTime() / 1000);
    const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${dt}&appid=${encodeURIComponent(apiKey)}&units=metric`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = (await response.json()) as any;
        return (data.data || []).map((r: any) => {
            const d = new Date(r.dt * 1000);
            return {
                date: d.toISOString().split('T')[0], hour: d.getUTCHours(),
                temperature: r.temp, apparent_temperature: r.feels_like, humidity: r.humidity,
                precipitation: (r.rain?.['1h'] || 0) + (r.snow?.['1h'] || 0),
                weather_condition: r.weather?.[0]?.main || 'Unknown', weather_code: r.weather?.[0]?.id || 0,
                wind_speed: r.wind_speed, wind_direction: r.wind_deg, cloud_cover: r.clouds,
            };
        });
    } catch (error) { console.error('OWM API error:', error); return null; }
}

// ============================================================
// WEATHER SERVICE (facade)
// ============================================================
function wmoCodeToCondition(code: number | null): string {
    if (code === null) return 'Unknown';
    if (code === 0) return 'Clear'; if (code <= 3) return 'Clouds'; if (code <= 49) return 'Fog';
    if (code <= 59) return 'Drizzle'; if (code <= 69) return 'Rain'; if (code <= 79) return 'Snow';
    if (code <= 84) return 'Rain'; if (code <= 99) return 'Thunderstorm'; return 'Unknown';
}
function normalizeOWM(records: any[]) {
    return records.map((r: any) => ({ ...r, weather_condition: r.weather_condition }));
}
function normalizeOpenMeteo(records: any[]) {
    return records.map((r: any) => ({ ...r, weather_condition: wmoCodeToCondition(r.weather_code) }));
}
async function getWeatherData(companyId: number, lat: number, lon: number, days = 7) {
    let owmKey: string | null = null;
    try {
        const result = await query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'openweathermap'", [companyId]);
        if (result.rowCount && result.rowCount > 0) {
            const creds = typeof result.rows[0].credentials === 'string' ? JSON.parse(result.rows[0].credentials) : result.rows[0].credentials;
            owmKey = creds.api_key || null;
        }
    } catch (err) { console.error('Error fetching OWM credentials:', err); }
    if (owmKey) {
        const allRecords: any[] = [];
        for (let d = 0; d < days; d++) {
            const date = new Date(); date.setDate(date.getDate() - (days - 1 - d));
            const hourly = await getOWMHourlyHistory(owmKey, lat, lon, date);
            if (hourly) allRecords.push(...normalizeOWM(hourly));
        }
        return { provider: 'openweathermap', data: allRecords };
    }
    const endDate = new Date(); const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const raw = await getHistoricalWeather(lat, lon, startDate, endDate);
    const parsed = parseHourlyData(raw);
    return { provider: 'open-meteo', data: normalizeOpenMeteo(parsed) };
}

// ============================================================
// TICKETMASTER
// ============================================================
interface TicketmasterEvent {
    id: string; name: string; type: string; date: string; time: string | null;
    venue: string; venue_lat: number | null; venue_lon: number | null; distance_km: number; url: string | null;
}
function toRad(deg: number) { return deg * (Math.PI / 180); }
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371, dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
async function getNearbyEvents(apiKey: string, lat: number, lon: number, radiusKm = 1, days = 7, customStartDate?: Date, customEndDate?: Date): Promise<TicketmasterEvent[] | null> {
    const startDate = customStartDate || new Date();
    const endDate = customEndDate || new Date();
    if (!customEndDate) endDate.setDate(endDate.getDate() + days);
    const params = new URLSearchParams({
        apikey: apiKey, latlong: `${lat},${lon}`, radius: radiusKm.toString(), unit: 'km',
        startDateTime: startDate.toISOString().split('.')[0] + 'Z', endDateTime: endDate.toISOString().split('.')[0] + 'Z',
        size: '50', sort: 'date,asc',
    });
    try {
        const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`);
        if (!response.ok) return null;
        const data = (await response.json()) as any;
        const embedded = data._embedded;
        if (!embedded?.events) return [];
        return embedded.events.map((event: any) => {
            const venue = event._embedded?.venues?.[0];
            const vLat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : null;
            const vLon = venue?.location?.longitude ? parseFloat(venue.location.longitude) : null;
            return {
                id: event.id, name: event.name, type: event.classifications?.[0]?.segment?.name || 'Other',
                date: event.dates?.start?.localDate || '', time: event.dates?.start?.localTime || null,
                venue: venue?.name || 'Unknown', venue_lat: vLat, venue_lon: vLon,
                distance_km: vLat !== null && vLon !== null ? Math.round(haversineDistance(lat, lon, vLat, vLon) * 100) / 100 : 0,
                url: event.url || null,
            };
        });
    } catch (error) { console.error('Ticketmaster API error:', error); return null; }
}

// ============================================================
// BESTTIME
// ============================================================
async function findNearbyVenue(apiKey: string, lat: number, lon: number, radiusM = 100): Promise<any> {
    try {
        const response = await fetch('https://besttime.app/api/v1/venues/search', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key_private: apiKey, q: `venues near ${lat},${lon}`, num: 1, radius: radiusM, lat, lng: lon }),
        });
        if (!response.ok) return null;
        const data = (await response.json()) as any;
        const venues = data.venues || [];
        if (venues.length === 0) return null;
        const v = venues[0];
        return { venue_id: v.venue_id, venue_name: v.venue_name, venue_address: v.venue_address || '', venue_lat: v.venue_lat || lat, venue_lon: v.venue_lng || lon };
    } catch (error) { console.error('BestTime venue search error:', error); return null; }
}
async function getWeeklyForecast(apiKey: string, venueId: string): Promise<any> {
    try {
        const response = await fetch(`https://besttime.app/api/v1/forecasts/weekly?api_key_private=${encodeURIComponent(apiKey)}&venue_id=${encodeURIComponent(venueId)}`);
        if (!response.ok) return null;
        const data = (await response.json()) as any;
        if (data.status !== 'OK' && !data.analysis) return null;
        const analysis = data.analysis || {};
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const days = (analysis.week_raw || []).map((dayData: any, idx: number) => {
            const hourly = (dayData.day_raw || []).map((intensity: number, hour: number) => ({ hour, intensity: Math.max(0, Math.min(100, intensity)) }));
            return {
                day_int: idx, day_text: dayNames[idx] || `Day ${idx}`,
                busy_hours: hourly.filter((h: any) => h.intensity >= 70).map((h: any) => h.hour),
                quiet_hours: hourly.filter((h: any) => h.intensity <= 30).map((h: any) => h.hour),
                peak_intensity: Math.max(...hourly.map((h: any) => h.intensity), 0), hourly,
            };
        });
        return { venue_id: venueId, venue_name: data.venue_info?.venue_name || '', days };
    } catch (error) { console.error('BestTime forecast error:', error); return null; }
}

// ============================================================
// ANALYTICS
// ============================================================
const ITALIAN_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
function getConfidence(n: number) { if (n < 5) return 'low'; if (n < 15) return 'medium'; return 'high'; }

function aggregateDailySales(telemetryRows: any[]) {
    if (!telemetryRows || telemetryRows.length === 0) return [];
    const byDate = new Map<string, { coffees: number[]; espressos: number[] }>();
    for (const row of telemetryRows) {
        const date = new Date(row.timestamp).toISOString().split('T')[0];
        if (!byDate.has(date)) byDate.set(date, { coffees: [], espressos: [] });
        const e = byDate.get(date)!;
        e.coffees.push(Number(row.coffee_count) || 0);
        e.espressos.push(Number(row.espresso_count) || 0);
    }
    const result: any[] = [];
    for (const [date, { coffees, espressos }] of byDate) {
        const cd = Math.max(0, Math.max(...coffees) - Math.min(...coffees));
        const ed = Math.max(0, Math.max(...espressos) - Math.min(...espressos));
        const dt = new Date(date);
        result.push({ date, totalDrinks: cd + ed, dayOfWeek: (dt.getDay() + 6) % 7 });
    }
    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
}

function aggregateDailyPrecipitation(weatherData: WeatherData[]) {
    if (!weatherData || weatherData.length === 0) return [];
    const byDate = new Map<string, number>();
    for (const w of weatherData) byDate.set(w.date, (byDate.get(w.date) || 0) + (w.precipitation || 0));
    return Array.from(byDate.entries()).map(([date, totalMm]) => ({ date, totalMm })).sort((a, b) => a.date.localeCompare(b.date));
}

function computeWeatherElasticity(dailySales: any[], dailyPrecip: any[]) {
    const precipMap = new Map(dailyPrecip.map((d: any) => [d.date, d.totalMm]));
    const rainySales: number[] = [], clearSales: number[] = [];
    for (const day of dailySales) {
        const precip = precipMap.get(day.date);
        if (precip === undefined) continue;
        if (precip > 2) rainySales.push(day.totalDrinks); else clearSales.push(day.totalDrinks);
    }
    const avgR = rainySales.length > 0 ? rainySales.reduce((a, b) => a + b, 0) / rainySales.length : 0;
    const avgC = clearSales.length > 0 ? clearSales.reduce((a, b) => a + b, 0) / clearSales.length : 0;
    const el = avgC > 0 ? ((avgR - avgC) / avgC) * 100 : 0;
    return {
        rainyDays: rainySales.length, clearDays: clearSales.length,
        avgSalesRainy: Math.round(avgR * 10) / 10, avgSalesClear: Math.round(avgC * 10) / 10,
        elasticityIndex: Math.round(el * 10) / 10, confidence: getConfidence(Math.min(rainySales.length, clearSales.length)),
    };
}

function computeEventImpact(dailySales: any[], events: TicketmasterEvent[]) {
    const eventDateMap = new Map<string, string[]>();
    for (const ev of events) { if (!ev.date) continue; if (!eventDateMap.has(ev.date)) eventDateMap.set(ev.date, []); eventDateMap.get(ev.date)!.push(ev.name); }
    const evSales: number[] = [], nonEvSales: number[] = [];
    const dowSales = new Map<number, number[]>();
    for (const day of dailySales) {
        if (!dowSales.has(day.dayOfWeek)) dowSales.set(day.dayOfWeek, []);
        dowSales.get(day.dayOfWeek)!.push(day.totalDrinks);
        if (eventDateMap.has(day.date)) evSales.push(day.totalDrinks); else nonEvSales.push(day.totalDrinks);
    }
    const avgEv = evSales.length > 0 ? evSales.reduce((a, b) => a + b, 0) / evSales.length : 0;
    const avgNon = nonEvSales.length > 0 ? nonEvSales.reduce((a, b) => a + b, 0) / nonEvSales.length : 0;
    const uplift = avgNon > 0 ? ((avgEv - avgNon) / avgNon) * 100 : 0;
    const salesByDate = new Map(dailySales.map((d: any) => [d.date, d]));
    const topEvents: any[] = [];
    for (const [date, names] of eventDateMap) {
        const dayData = salesByDate.get(date); if (!dayData) continue;
        const arr = dowSales.get(dayData.dayOfWeek);
        const dowAvg = arr && arr.length > 0 ? arr.reduce((a: number, b: number) => a + b, 0) / arr.length : 0;
        topEvents.push({ date, eventName: names[0], sales: dayData.totalDrinks, uplift: Math.round((dowAvg > 0 ? ((dayData.totalDrinks - dowAvg) / dowAvg) * 100 : 0) * 10) / 10 });
    }
    topEvents.sort((a, b) => b.uplift - a.uplift);
    return {
        eventDays: evSales.length, nonEventDays: nonEvSales.length,
        avgSalesEventDay: Math.round(avgEv * 10) / 10, avgSalesNonEventDay: Math.round(avgNon * 10) / 10,
        eventUplift: Math.round(uplift * 10) / 10, topEvents: topEvents.slice(0, 5),
        confidence: getConfidence(evSales.length),
    };
}

function computeSmartForecast(dailySales: any[], elasticityIndex: number, eventUplift: number, forecastWeather: WeatherData[], futureEvents: TicketmasterEvent[], weatherDescFn: (code?: number | null) => string | null) {
    const dowTotals = new Map<number, { sum: number; count: number }>();
    for (const day of dailySales) {
        if (!dowTotals.has(day.dayOfWeek)) dowTotals.set(day.dayOfWeek, { sum: 0, count: 0 });
        const e = dowTotals.get(day.dayOfWeek)!; e.sum += day.totalDrinks; e.count++;
    }
    const globalAvg = dailySales.length > 0 ? dailySales.reduce((s: number, d: any) => s + d.totalDrinks, 0) / dailySales.length : 0;
    const forecastByDate = new Map<string, { totalPrecip: number; weatherCode: number | null }>();
    for (const w of forecastWeather) {
        if (!forecastByDate.has(w.date)) forecastByDate.set(w.date, { totalPrecip: 0, weatherCode: null });
        const e = forecastByDate.get(w.date)!; e.totalPrecip += w.precipitation || 0;
        if (w.hour === 12 || e.weatherCode === null) e.weatherCode = w.weather_code;
    }
    const futureEventMap = new Map<string, string[]>();
    for (const ev of futureEvents) { if (!ev.date) continue; if (!futureEventMap.has(ev.date)) futureEventMap.set(ev.date, []); futureEventMap.get(ev.date)!.push(ev.name); }
    const result: any[] = [];
    for (let i = 0; i < 7; i++) {
        const fd = new Date(); fd.setDate(fd.getDate() + i + 1);
        const dateStr = fd.toISOString().split('T')[0];
        const dow = (fd.getDay() + 6) % 7;
        const dowData = dowTotals.get(dow);
        const baseline = dowData ? dowData.sum / dowData.count : globalAvg;
        const fDay = forecastByDate.get(dateStr);
        const isRainy = fDay ? fDay.totalPrecip > 2 : false;
        const wf = isRainy ? 1 + (elasticityIndex / 100) : 1.0;
        const dayEvents = futureEventMap.get(dateStr) || [];
        const ef = dayEvents.length > 0 ? 1 + (eventUplift / 100) : 1.0;
        result.push({
            date: dateStr, dayOfWeek: ITALIAN_DAYS[dow], predictedSales: Math.max(0, Math.round(baseline * wf * ef)),
            baselineSales: Math.round(baseline), weatherFactor: Math.round(wf * 100) / 100,
            eventFactor: Math.round(ef * 100) / 100, weatherDescription: weatherDescFn(fDay?.weatherCode) || 'N/D',
            events: dayEvents, confidence: getConfidence(dowData?.count || 0),
        });
    }
    return result;
}

function extractApiKey(result: any): string | null {
    if (!result.rowCount || result.rowCount === 0) return null;
    const creds = typeof result.rows[0].credentials === 'string' ? JSON.parse(result.rows[0].credentials) : result.rows[0].credentials;
    return creds.api_key || null;
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

async function handleAuthLogin(req: VercelRequest, res: VercelResponse) {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' });
    try {
        const userRes = await query('SELECT * FROM users WHERE email = $1', [username]);
        if (userRes.rowCount === 0) return res.status(401).json({ success: false, error: 'Invalid credentials' });
        const user = userRes.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });
        const companyRes = await query('SELECT c.id, c.name FROM companies c JOIN company_users cu ON c.id = cu.company_id WHERE cu.user_id = $1 LIMIT 1', [user.id]);
        const company = companyRes.rows[0];
        const token = jwt.sign({ user_id: user.id, partner_id: company?.id || null, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, partner_id: company?.id || null, partner_name: company?.name || 'Unknown Company', role: user.role } });
    } catch (error) { console.error('Login error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAuthVerify(req: VercelRequest, res: VercelResponse) {
    const { token } = req.body;
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const userRes = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.user_id]);
        if (userRes.rowCount === 0) return res.status(401).json({ success: false, error: 'User no longer exists' });
        const user = userRes.rows[0];
        const companyRes = await query('SELECT c.id, c.name FROM companies c JOIN company_users cu ON c.id = cu.company_id WHERE cu.user_id = $1 LIMIT 1', [user.id]);
        const company = companyRes.rows[0];
        return res.status(200).json({ success: true, user: { id: user.id, name: user.name, email: user.email, partner_id: company?.id || null, partner_name: company?.name || 'Unknown Company' } });
    } catch (error) { return res.status(401).json({ success: false, error: 'Invalid or expired token' }); }
}

async function handleAuthRegister(req: VercelRequest, res: VercelResponse) {
    const { email, password, name, companyName } = req.body;
    if (!email || !password || !name || !companyName) return res.status(400).json({ success: false, error: 'All fields are required' });
    try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing?.rowCount && existing.rowCount > 0) return res.status(400).json({ success: false, error: 'User already exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRes = await query('INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id', [email, hashedPassword, name]);
        const userId = userRes.rows[0].id;
        const companyRes = await query('INSERT INTO companies (name) VALUES ($1) RETURNING id', [companyName]);
        const companyId = companyRes.rows[0].id;
        await query('INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3)', [userId, companyId, 'admin']);
        return res.status(201).json({ success: true, message: 'Registration successful', user: { id: userId, email, name } });
    } catch (error) { console.error('Registration error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleDashboardStats(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req) as any;
    if (!decoded) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const companyId = decoded.partner_id;
    const userIsAdmin = isAdmin(decoded);
    try {
        let machinesResult;
        if (userIsAdmin) machinesResult = await query('SELECT m.id, m.metadata FROM machines m');
        else machinesResult = await query('SELECT m.id, m.metadata FROM machines m WHERE m.company_id = $1', [companyId]);
        const totalMachines = machinesResult.rows.length;
        const connectedMachines = machinesResult.rows.filter((m: any) => m.metadata?.status === 'online').length;
        const activeAlerts = machinesResult.rows.filter((m: any) => m.metadata?.status === 'warning' || m.metadata?.status === 'alarm').length;
        let totalCustomers = 1;
        if (userIsAdmin) { const cr = await query('SELECT COUNT(*) FROM companies'); totalCustomers = parseInt(cr.rows[0].count, 10); }
        return res.status(200).json({ success: true, data: { totalCustomers, totalMachines, connectedMachines, activeAlerts } });
    } catch (error) { console.error('Stats error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleMachines(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req) as any;
    if (!decoded) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const companyId = decoded.partner_id;
    if (!companyId) return res.status(400).json({ success: false, error: 'User is not associated with a company' });
    try {
        const credsRes = await query('SELECT provider, credentials FROM api_credentials WHERE company_id = $1', [companyId]);
        const machines: any[] = [];
        const fetchPromises: Promise<void>[] = [];
        for (const row of credsRes.rows) {
            if (row.provider === 'cimbali') fetchPromises.push(getCimbaliMachines(row.credentials).then(r => { machines.push(...r); }));
            else if (row.provider === 'brita') fetchPromises.push(getBritaResources(row.credentials).then(r => { if (r?.items) machines.push(...r.items); }));
        }
        await Promise.all(fetchPromises);
        return res.status(200).json({ success: true, data: machines, total: machines.length });
    } catch (error) { console.error('Fetch machines error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleMachinesList(req: VercelRequest, res: VercelResponse) {
    const decoded: any = verifyAuth(req);
    if (!decoded) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const companyId = decoded.partner_id;
    const adminUser = isAdmin(decoded);
    if (!adminUser && !companyId) return res.status(400).json({ success: false, error: 'User is not associated with a company' });
    try {
        let result;
        if (adminUser) result = await query('SELECT m.id, m.serial_number, m.provider, m.external_id, m.metadata, m.company_id, c.name as company_name, m.created_at, m.updated_at FROM machines m LEFT JOIN companies c ON m.company_id = c.id ORDER BY m.created_at DESC');
        else result = await query('SELECT m.id, m.serial_number, m.provider, m.external_id, m.metadata, m.company_id, c.name as company_name, m.created_at, m.updated_at FROM machines m LEFT JOIN companies c ON m.company_id = c.id WHERE m.company_id = $1 ORDER BY m.created_at DESC', [companyId]);
        const machines = result.rows.map((row: any) => ({
            id: row.id, machineId: row.serial_number, serialNumber: row.serial_number,
            name: row.metadata?.name || row.serial_number, brand: row.metadata?.brand || row.provider,
            model: row.metadata?.model || 'N/D', family: row.metadata?.family || row.metadata?.model || 'N/D',
            status: row.metadata?.status || 'offline', provider: row.provider,
            lastConnection: row.metadata?.lastSync || row.updated_at,
            customerName: row.metadata?.customerName || null, customerGroup: row.metadata?.customerGroup || null,
            companyName: row.metadata?.customerName || row.company_name || 'Non assegnata',
            waterFilter: row.metadata?.water_filter || null, waterFilterName: row.metadata?.water_filter_name || 'PURITY C150 iQ Quell ST',
            latitude: row.metadata?.latitude || null, longitude: row.metadata?.longitude || null, location: row.metadata?.location || null,
        }));
        return res.status(200).json({ success: true, data: machines, total: machines.length });
    } catch (error) { console.error('List portal machines error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleSettingsCredentials(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req) as any;
    if (!decoded) return res.status(401).json({ success: false, error: 'Unauthorized' });
    try {
        const credsRes = await query('SELECT provider, credentials FROM api_credentials WHERE company_id = $1', [decoded.partner_id]);
        return res.status(200).json({ success: true, data: credsRes.rows });
    } catch (error) { console.error('Fetch settings error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleSettingsCredentialsSave(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req) as any;
    if (!decoded) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const companyId = decoded.partner_id;
    const { provider, credentials: creds } = req.body;
    if (!provider || !creds) return res.status(400).json({ success: false, error: 'Provider and credentials are required' });
    try {
        const existing = await query('SELECT id FROM api_credentials WHERE company_id = $1 AND provider = $2', [companyId, provider]);
        if (existing.rowCount && existing.rowCount > 0) await query('UPDATE api_credentials SET credentials = $1, updated_at = CURRENT_TIMESTAMP WHERE company_id = $2 AND provider = $3', [JSON.stringify(creds), companyId, provider]);
        else await query('INSERT INTO api_credentials (company_id, provider, credentials) VALUES ($1, $2, $3)', [companyId, provider, JSON.stringify(creds)]);
        return res.status(200).json({ success: true, message: 'Credentials saved' });
    } catch (error) { console.error('Save credentials error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleCustomersList(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded) return res.status(401).json({ success: false, error: 'Unauthorized' });
    try {
        const result = await query('SELECT c.*, (SELECT COUNT(*) FROM machines m WHERE m.company_id = c.id) as machines_count FROM companies c ORDER BY c.name');
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) { console.error('List customers error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminCustomersCreate(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { name, odooUrl, odooDb } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Company name is required' });
    try {
        const result = await query('INSERT INTO companies (name, odoo_url, odoo_db) VALUES ($1, $2, $3) RETURNING *', [name, odooUrl || null, odooDb || null]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) { console.error('Create customer error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminCustomersDelete(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req);
    if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });
    const customerId = (req.query as any).customerId;
    try {
        await query('DELETE FROM machines WHERE company_id = $1', [customerId]);
        await query('DELETE FROM api_credentials WHERE company_id = $1', [customerId]);
        const result = await query('DELETE FROM companies WHERE id = $1', [customerId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Customer not found' });
        return res.status(200).json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) { console.error('Delete customer error:', error); return res.status(500).json({ error: 'Internal server error' }); }
}

async function handleAdminCustomersListCredentials(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req);
    if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });
    const customerId = (req.query as any).customerId;
    try {
        const result = await query('SELECT * FROM api_credentials WHERE company_id = $1 ORDER BY created_at DESC', [customerId]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) { console.error('List Credentials Error:', error); return res.status(500).json({ error: 'Internal server error' }); }
}

async function handleAdminCustomersSaveCredential(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req);
    if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });
    const customerId = (req.query as any).customerId;
    const { provider, name, credentials: creds } = req.body;
    if (!customerId || !provider || !creds) return res.status(400).json({ error: 'Customer ID, provider and credentials are required' });
    try {
        const existing = await query('SELECT id FROM api_credentials WHERE company_id = $1 AND provider = $2 AND name = $3', [customerId, provider, name]);
        if (existing.rowCount && existing.rowCount > 0) await query('UPDATE api_credentials SET credentials = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(creds), existing.rows[0].id]);
        else await query('INSERT INTO api_credentials (company_id, provider, name, credentials) VALUES ($1, $2, $3, $4)', [customerId, provider, name, JSON.stringify(creds)]);
        return res.status(200).json({ success: true, message: 'Credential saved successfully' });
    } catch (error) { console.error('Save customer credential error:', error); return res.status(500).json({ error: 'Internal server error' }); }
}

async function handleAdminUsersCreate(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { name, email, password, companyId, role } = req.body;
    if (!email || !password || !companyId) return res.status(400).json({ success: false, error: 'Email, password and companyId are required' });
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const userResult = await query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role', [name || null, email, passwordHash, role || 'portal']);
        const userId = userResult.rows[0].id;
        await query('INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3)', [userId, companyId, 'admin']);
        return res.status(201).json({ success: true, data: userResult.rows[0] });
    } catch (error) { console.error('Create user error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminUsersList(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    try {
        const result = await query('SELECT u.id, u.name, u.email, u.role, u.created_at, cu.company_id, c.name as company_name FROM users u LEFT JOIN company_users cu ON u.id = cu.user_id LEFT JOIN companies c ON cu.company_id = c.id ORDER BY u.created_at DESC');
        const users = result.rows.map((row: any) => ({ ...row, company: row.company_name || 'Non assegnato' }));
        return res.status(200).json({ success: true, data: users, total: users.length });
    } catch (error) { console.error('List users error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminUsersDelete(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'User ID is required' });
    try {
        await query('DELETE FROM users WHERE id = $1', [id]);
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) { console.error('Delete user error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminUsersUpdate(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { id, name, email, role, companyId, password } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'User ID is required' });
    try {
        const updates: string[] = []; const values: any[] = []; let pi = 1;
        if (name) { updates.push(`name = $${pi}`); values.push(name); pi++; }
        if (email) { updates.push(`email = $${pi}`); values.push(email); pi++; }
        if (role) { updates.push(`role = $${pi}`); values.push(role); pi++; }
        if (password) { updates.push(`password_hash = $${pi}`); values.push(await bcrypt.hash(password, 10)); pi++; }
        if (updates.length > 0) {
            updates.push('updated_at = NOW()');
            values.push(id);
            await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${pi}`, values);
        }
        // Handle company association via company_users join table
        if (companyId) {
            if (companyId === 'none') {
                await query('DELETE FROM company_users WHERE user_id = $1', [id]);
            } else {
                const existing = await query('SELECT id FROM company_users WHERE user_id = $1', [id]);
                if (existing.rowCount && existing.rowCount > 0) {
                    await query('UPDATE company_users SET company_id = $1 WHERE user_id = $2', [companyId, id]);
                } else {
                    await query('INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3)', [id, companyId, 'admin']);
                }
            }
        }
        if (updates.length === 0 && !companyId) return res.status(400).json({ success: false, error: 'No fields to update' });
        return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) { console.error('Update user error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminMachinesCreate(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const { serialNumber, provider, companyId, externalId, model } = req.body;
    if (!serialNumber || !provider || !companyId) return res.status(400).json({ success: false, error: 'Serial number, provider and companyId are required' });
    try {
        const result = await query('INSERT INTO machines (serial_number, provider, company_id, external_id, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *', [serialNumber, provider, companyId, externalId || null, JSON.stringify({ model: model || 'N/D' })]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) { console.error('Create machine error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminMachinesList(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    try {
        const result = await query('SELECT m.id, m.serial_number, m.provider, m.external_id, m.metadata, m.company_id, c.name as customer_name, m.created_at, m.updated_at FROM machines m LEFT JOIN companies c ON m.company_id = c.id ORDER BY m.created_at DESC');
        const machines = result.rows.map((row: any) => ({
            ...row, model: row.metadata?.model || 'N/D', family: row.metadata?.family || row.metadata?.model || 'N/D',
            status: row.metadata?.status || 'offline', name: row.metadata?.name || row.serial_number,
            brand: row.metadata?.brand || row.provider?.toUpperCase() || 'N/D',
            customerName: row.metadata?.customerName || null, customerGroup: row.metadata?.customerGroup || null,
            customer_name: row.metadata?.customerName || row.customer_name || 'Non assegnata',
            water_filter_name: row.metadata?.water_filter_name || 'PURITY C150 iQ Quell ST',
            lastConnection: row.metadata?.lastSync || row.updated_at,
        }));
        return res.status(200).json({ success: true, data: machines, total: machines.length });
    } catch (error) { console.error('List machines error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminMachineDetail(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const machineId = (req.query as any).machineId;
    if (!machineId) return res.status(400).json({ success: false, error: 'Machine ID is required' });
    try {
        const mr = await query('SELECT m.id, m.serial_number, m.provider, m.external_id, m.metadata, m.company_id, c.name as customer_name, m.created_at, m.updated_at FROM machines m LEFT JOIN companies c ON m.company_id = c.id WHERE m.id = $1', [machineId]);
        if (mr.rowCount === 0) return res.status(404).json({ success: false, error: 'Machine not found' });
        const dbM = mr.rows[0]; const md = dbM.metadata || {};
        let machineData: any = { id: dbM.id, serial_number: dbM.serial_number, serial: dbM.serial_number, provider: dbM.provider, external_id: dbM.external_id, company_id: dbM.company_id, customer_name: dbM.customer_name, model: md.model || 'N/D', brand: md.brand || dbM.provider?.toUpperCase() || 'Unknown', name: md.name || dbM.serial_number, status: md.status || 'offline', isOnline: md.status === 'online', latitude: md.latitude || null, longitude: md.longitude || null, location: md.location || null, lastSync: dbM.updated_at };
        if (dbM.provider === 'cimbali' && dbM.company_id) {
            try {
                const cr = await query('SELECT * FROM api_credentials WHERE company_id = $1 AND provider = $2', [dbM.company_id, 'cimbali']);
                if (cr.rowCount && cr.rowCount > 0) {
                    const cred = cr.rows[0];
                    const cc: CimbaliCredentials = { username: cred.credentials?.username || cred.username, password: cred.credentials?.password || cred.password };
                    const li = await getCimbaliMachineInfo(cc, dbM.serial_number);
                    if (li) machineData = { ...machineData, status: li.status, isOnline: li.status === 'online', latitude: li.latitude || machineData.latitude, longitude: li.longitude || machineData.longitude, location: li.location || machineData.location, lastConnection: li.lastConnection, model: li.model || machineData.model, brand: li.brand || machineData.brand };
                }
            } catch (e) { console.error('Error fetching live data:', e); }
        }
        return res.status(200).json({ success: true, data: machineData });
    } catch (error) { console.error('Get machine detail error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminCredentialsSync(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req);
    if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });
    const credentialId = (req.query as any).credentialId;
    try {
        const credRes = await query('SELECT * FROM api_credentials WHERE id = $1', [credentialId]);
        if (credRes.rowCount === 0) return res.status(404).json({ error: 'Credential not found' });
        const credential = credRes.rows[0];
        const provider = credential.provider;
        let syncedCount = 0, createdCount = 0, updatedCount = 0;
        if (provider === 'cimbali') {
            const cc = { username: credential.credentials?.username || credential.username, password: credential.credentials?.password || credential.password };
            let startIndex = 0; const limit = 100; let hasMore = true;
            while (hasMore) {
                const machines = await getCimbaliMachines(cc, startIndex, limit);
                if (!machines || machines.length === 0) { hasMore = false; break; }
                for (const machine of machines) {
                    const existing = await query('SELECT id FROM machines WHERE serial_number = $1', [machine.serial]);
                    const metadata = JSON.stringify({ name: machine.name, model: machine.model, family: machine.family, brand: 'CIMBALI', status: machine.status, credential_id: credential.id, customerName: machine.customerName, customerGroup: machine.customerGroup, latitude: machine.latitude, longitude: machine.longitude, location: machine.location, lastSync: new Date().toISOString() });
                    if (existing?.rowCount && existing.rowCount > 0) { await query('UPDATE machines SET provider = $1, company_id = $2, external_id = $3, metadata = $4, updated_at = CURRENT_TIMESTAMP WHERE serial_number = $5', [provider, credential.company_id, machine.serial, metadata, machine.serial]); updatedCount++; }
                    else { await query('INSERT INTO machines (serial_number, company_id, provider, external_id, metadata, credential_id) VALUES ($1, $2, $3, $4, $5, $6)', [machine.serial, credential.company_id, provider, machine.serial, metadata, credential.id]); createdCount++; }
                    syncedCount++;
                }
                if (machines.length < limit) hasMore = false; else startIndex += limit;
            }
        } else if (provider === 'brita') {
            const bc: BritaCredentials = { apiKey: credential.credentials?.apiKey || credential.credentials?.api_key, tenantId: credential.credentials?.tenantId || credential.credentials?.tenant_id };
            let ct: string | null = null;
            do {
                const result = await getBritaResources(bc, 100, ct || undefined);
                for (const machine of (result.items || [])) {
                    const existing = await query('SELECT id FROM machines WHERE external_id = $1 AND provider = $2', [machine.resourceId, 'brita']);
                    const metadata = JSON.stringify({ name: machine.name, model: machine.model, brand: 'BRITA', status: machine.status, resourceType: machine.resourceType, latitude: machine.latitude, longitude: machine.longitude, location: machine.location, credential_id: credential.id, lastSync: new Date().toISOString() });
                    if (existing?.rowCount && existing.rowCount > 0) { await query('UPDATE machines SET serial_number = $1, company_id = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP WHERE external_id = $4 AND provider = $5', [machine.serial, credential.company_id, metadata, machine.resourceId, 'brita']); updatedCount++; }
                    else { await query('INSERT INTO machines (serial_number, company_id, provider, external_id, metadata, credential_id) VALUES ($1, $2, $3, $4, $5, $6)', [machine.serial, credential.company_id, 'brita', machine.resourceId, metadata, credential.id]); createdCount++; }
                    syncedCount++;
                }
                ct = result.continuationToken || null;
            } while (ct);
        } else return res.status(501).json({ error: 'Provider not implemented yet' });
        return res.status(200).json({ success: true, message: `Successfully synced ${syncedCount} machines from ${provider} (Created: ${createdCount}, Updated: ${updatedCount})`, data: { machines_synced: syncedCount, created: createdCount, updated: updatedCount } });
    } catch (error) { console.error('Sync Error:', error); return res.status(500).json({ error: 'Internal server error' }); }
}

async function handleAdminCredentialsTest(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req);
    if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });
    const credentialId = (req.query as any).credentialId;
    try {
        const credRes = await query('SELECT * FROM api_credentials WHERE id = $1', [credentialId]);
        if (credRes.rowCount === 0) return res.status(404).json({ error: 'Credential not found' });
        const credential = credRes.rows[0]; const provider = credential.provider;
        try {
            if (provider === 'brita') { const bc: BritaCredentials = { apiKey: credential.credentials?.apiKey || credential.credentials?.api_key, tenantId: credential.credentials?.tenantId || credential.credentials?.tenant_id }; await getBritaResources(bc, 1); }
            else if (provider === 'cimbali') { const cc: CimbaliCredentials = { username: credential.credentials?.username || credential.username, password: credential.credentials?.password || credential.password }; await getCimbaliMachines(cc, 0, 1); }
            else return res.status(400).json({ success: false, message: 'Provider non supportato' });
            return res.status(200).json({ success: true, message: `Connessione a ${provider} riuscita con successo` });
        } catch (apiError) { return res.status(200).json({ success: false, message: `Connessione a ${provider} fallita: ${apiError instanceof Error ? apiError.message : 'Errore sconosciuto'}` }); }
    } catch (error) { console.error('Test Connection Error:', error); return res.status(500).json({ error: 'Internal server error' }); }
}

async function handleAdminCredentialsDelete(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req);
    if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });
    const credentialId = (req.query as any).credentialId;
    try {
        await query('UPDATE machines SET credential_id = NULL WHERE credential_id = $1', [credentialId]);
        const result = await query('DELETE FROM api_credentials WHERE id = $1', [credentialId]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Credential not found' });
        return res.status(200).json({ success: true, message: 'Credential deleted successfully' });
    } catch (error) { console.error('Delete credential error:', error); return res.status(500).json({ error: 'Internal server error' }); }
}

async function handleAdminBritaDetail(req: VercelRequest, res: VercelResponse) {
    const decoded: any = verifyAuth(req);
    if (!decoded) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const adminUser = isAdmin(decoded);
    const machineId = (req.query as any).machineId;
    if (!machineId) return res.status(400).json({ success: false, error: 'Machine ID is required' });
    try {
        const mr = await query('SELECT m.id, m.serial_number, m.provider, m.external_id, m.metadata, m.company_id, c.name as customer_name, m.created_at, m.updated_at FROM machines m LEFT JOIN companies c ON m.company_id = c.id WHERE m.id = $1', [machineId]);
        if (mr.rowCount === 0) return res.status(404).json({ success: false, error: 'Machine not found' });
        const dbM = mr.rows[0];
        if (!adminUser && decoded.partner_id && dbM.company_id !== decoded.partner_id) return res.status(403).json({ success: false, error: 'Forbidden' });
        if (dbM.provider !== 'brita') return res.status(400).json({ success: false, error: 'Machine is not a BRITA device' });
        const md = dbM.metadata || {};
        let machineData: any = { id: dbM.id, serial_number: dbM.serial_number, serial: dbM.serial_number, provider: dbM.provider, external_id: dbM.external_id, company_id: dbM.company_id, customer_name: dbM.customer_name, model: md.model || 'N/D', brand: md.brand || 'BRITA', name: md.name || dbM.serial_number, status: md.status || 'offline', resourceType: md.resourceType || 'Unknown', latitude: md.latitude || null, longitude: md.longitude || null, location: md.location || null, lastSync: dbM.updated_at };
        let britaDetail: any = null;
        if (dbM.external_id && dbM.company_id) {
            try {
                const cr = await query('SELECT * FROM api_credentials WHERE company_id = $1 AND provider = $2', [dbM.company_id, 'brita']);
                if (cr.rowCount && cr.rowCount > 0) {
                    const cred = cr.rows[0];
                    const bc: BritaCredentials = { apiKey: cred.credentials?.apiKey || cred.credentials?.api_key, tenantId: cred.credentials?.tenantId || cred.credentials?.tenant_id };
                    britaDetail = await getBritaResourceDetail(bc, dbM.external_id);
                }
            } catch (e) { console.error('Error fetching BRITA detail:', e); }
        }
        return res.status(200).json({ success: true, data: { machine: machineData, britaDetail } });
    } catch (error) { console.error('Get BRITA machine detail error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAdminBritaList(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const companyId = req.query.companyId;
    try {
        let sql = "SELECT id, serial_number, metadata, provider FROM machines WHERE provider = 'brita'";
        const params: any[] = [];
        if (companyId && typeof companyId === 'string') { sql += ' AND company_id = $1'; params.push(companyId); }
        sql += ' ORDER BY serial_number';
        const result = await query(sql, params);
        const machines = (result.rows || []).map((row: any) => {
            const md = row.metadata || {};
            return { id: row.id, serial: row.serial_number, name: md.name || `${md.model || 'BRITA'} (${row.serial_number})`, model: md.model || 'N/D', status: md.status || 'offline' };
        });
        return res.status(200).json({ success: true, data: machines });
    } catch (error) { console.error('List BRITA machines error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleMachineTelemetry(req: VercelRequest, res: VercelResponse) {
    const authResult = verifyAuth(req);
    if (!authResult) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const serial = (req.query as any).serial;
    if (!serial || typeof serial !== 'string') return res.status(400).json({ success: false, error: 'Serial number required' });
    const forceRefresh = req.query.refresh === 'true';
    const days = parseInt(req.query.days as string) || 7;
    let startDateMs: number, endDateMs: number;
    const sdp = req.query.startDate as string | undefined, edp = req.query.endDate as string | undefined;
    if (sdp || edp) {
        const sd = sdp ? new Date(`${sdp}T00:00:00`) : new Date(Date.now() - days * 86400000);
        const ed = edp ? new Date(`${edp}T23:59:59`) : new Date();
        if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return res.status(400).json({ success: false, error: 'Invalid dates' });
        startDateMs = sd.getTime(); endDateMs = ed.getTime();
    } else { endDateMs = Date.now(); startDateMs = endDateMs - days * 86400000; }
    try {
        const pool = getDbPool();
        const mr = await pool.query('SELECT m.*, c.name as company_name, ac.credentials FROM machines m LEFT JOIN companies c ON m.company_id = c.id LEFT JOIN api_credentials ac ON ac.company_id = m.company_id AND ac.provider = \'cimbali\' WHERE m.serial_number = $1', [serial]);
        if (mr.rows.length === 0) return res.status(404).json({ success: false, error: 'Machine not found' });
        const machine = mr.rows[0]; const credentialsJson = machine.credentials;
        if (!credentialsJson) return res.status(400).json({ success: false, error: 'No Cimbali credentials found' });
        let normalizedTelemetry: any[] = []; let machineInfo: any = null;
        if (!forceRefresh) {
            const dbr = await pool.query('SELECT data FROM machine_telemetry WHERE machine_serial = $1 AND timestamp >= $2 AND timestamp <= $3 ORDER BY timestamp ASC', [serial, new Date(startDateMs), new Date(endDateMs)]);
            if (dbr.rows.length > 0) normalizedTelemetry = dbr.rows.map((r: any) => r.data);
        }
        const creds: CimbaliCredentials = { username: credentialsJson.username || credentialsJson.apiKey, password: credentialsJson.password || credentialsJson.apiSecret };
        if (normalizedTelemetry.length === 0 || forceRefresh) {
            const telData = await getCimbaliTelemetry(creds, serial, startDateMs, endDateMs);
            machineInfo = await getCimbaliMachineInfo(creds, serial);
            let weatherData: any[] = [];
            if (machineInfo?.latitude && machineInfo?.longitude) {
                const wr = await getHistoricalWeather(machineInfo.latitude, machineInfo.longitude, new Date(startDateMs), new Date(endDateMs));
                if (wr) weatherData = parseHourlyData(wr);
            }
            const wi = buildWeatherIndex(weatherData);
            let prevTotal: number | null = null, prevCoffee: number | null = null;
            normalizedTelemetry = telData.map(record => {
                const ct = record.total_count ?? record.coffee_count ?? 0;
                const cct = record.coffee_count ?? ct;
                let ed = 0, cd = 0;
                if (ct > 0 && prevTotal !== null) { const d = ct - prevTotal; ed = d >= 0 ? d : 0; }
                if (cct > 0 && prevCoffee !== null) { const d = cct - prevCoffee; cd = d >= 0 ? d : 0; }
                if (ct > 0) prevTotal = ct; if (cct > 0) prevCoffee = cct;
                const td = new Date(record.timestamp); const { dateKey, hour } = getDateKeyAndHour(td);
                const w = wi.get(`${dateKey}-${hour}`);
                return { ...record, coffee_count: cd, espresso_count: ed, total_count: ct, cumulative_coffee: cct, weather_code: w?.weather_code ?? null, weather_description: getWeatherDescription(w?.weather_code), weather_icon: getWeatherIconKey(w?.weather_code), weather_temperature: w?.temperature ?? null };
            });
            if (normalizedTelemetry.length > 0) {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    for (const r of normalizedTelemetry) await client.query('INSERT INTO machine_telemetry (machine_serial, timestamp, data) VALUES ($1, $2, $3) ON CONFLICT (machine_serial, timestamp) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()', [serial, r.timestamp, r]);
                    await client.query('COMMIT');
                } catch (e) { await client.query('ROLLBACK'); console.error('Error persisting telemetry:', e); } finally { client.release(); }
            }
        } else { if (!machineInfo) machineInfo = await getCimbaliMachineInfo(creds, serial); }
        const ddm: Record<string, { coffee: number; espresso: number }> = {};
        const dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        normalizedTelemetry.forEach((r: any) => { const d = dn[new Date(r.timestamp).getDay()]; if (!ddm[d]) ddm[d] = { coffee: 0, espresso: 0 }; ddm[d].coffee += r.coffee_count; ddm[d].espresso += r.espresso_count; });
        const dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ name: d, coffee: ddm[d]?.coffee || 0, espresso: ddm[d]?.espresso || 0 }));
        const tc = normalizedTelemetry.reduce((s: number, r: any) => s + r.coffee_count, 0);
        const te = normalizedTelemetry.reduce((s: number, r: any) => s + r.espresso_count, 0);
        const ncg = normalizedTelemetry.length > 0 ? Math.max(...normalizedTelemetry.map((r: any) => r.total_count || 0)) : null;
        const nca = normalizedTelemetry.length > 0 ? Math.max(...normalizedTelemetry.map((r: any) => r.cappuccino_count || 0)) : null;
        const nl = normalizedTelemetry.length > 0 ? Math.max(...normalizedTelemetry.map((r: any) => r.latte_count || 0)) : null;
        return res.status(200).json({ success: true, data: { machine: { serial, model: machine.metadata?.model || machineInfo?.model, brand: 'CIMBALI', status: machineInfo?.status || 'unknown', location: machineInfo?.location || null, latitude: machineInfo?.latitude || null, longitude: machineInfo?.longitude || null }, telemetry: normalizedTelemetry, dailyData, summary: { totalCoffee: tc, totalEspresso: te, totalDrinks: tc + te, periodDays: Math.max(1, Math.ceil((endDateMs - startDateMs) / 86400000)), numcaffegenerale: ncg, numcappuccino: nca, numlatte: nl } } });
    } catch (error) { console.error('Telemetry endpoint error:', error); return res.status(500).json({ success: false, error: 'Failed to fetch telemetry data' }); }
}

async function handleAdminMachineTelemetry(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) return res.status(403).json({ success: false, error: 'Forbidden' });
    const machineId = (req.query as any).machineId;
    const days = parseInt(req.query.days as string) || 7;
    const sdp = req.query.startDate as string | undefined, edp = req.query.endDate as string | undefined;
    if (!machineId) return res.status(400).json({ success: false, error: 'Machine ID is required' });
    try {
        const mr = await query('SELECT m.id, m.serial_number, m.provider, m.company_id, m.metadata, c.name as customer_name FROM machines m LEFT JOIN companies c ON m.company_id = c.id WHERE m.id = $1', [machineId]);
        if (mr.rowCount === 0) return res.status(404).json({ success: false, error: 'Machine not found' });
        const dbM = mr.rows[0]; const md = dbM.metadata || {};
        let telData: any[] = [], alerts: any[] = [], weatherData: any[] = [];
        let dailyData: any[] = [], summary: any = { totalCoffee: 0, totalEspresso: 0, totalDrinks: 0, periodDays: days };
        if (dbM.provider === 'cimbali' && dbM.company_id) {
            try {
                const cr = await query('SELECT * FROM api_credentials WHERE company_id = $1 AND provider = $2', [dbM.company_id, 'cimbali']);
                if (cr.rowCount && cr.rowCount > 0) {
                    const cred = cr.rows[0];
                    const cc: CimbaliCredentials = { username: cred.credentials?.username || cred.username, password: cred.credentials?.password || cred.password };
                    let sd: Date, ed: Date;
                    if (sdp || edp) { sd = sdp ? new Date(`${sdp}T00:00:00`) : new Date(Date.now() - days * 86400000); ed = edp ? new Date(`${edp}T23:59:59`) : new Date(); if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return res.status(400).json({ success: false, error: 'Invalid dates' }); }
                    else { ed = new Date(); sd = new Date(ed.getTime() - days * 86400000); }
                    telData = await getCimbaliTelemetry(cc, dbM.serial_number, sd.getTime(), ed.getTime());
                    alerts = await getCimbaliAlerts(cc, dbM.serial_number);
                    let lat = md.latitude, lng = md.longitude;
                    if (!lat || !lng) { try { const mi = await getCimbaliMachineInfo(cc, dbM.serial_number); if (mi?.latitude && mi?.longitude) { lat = mi.latitude; lng = mi.longitude; } } catch (e) { } }
                    if (lat && lng) { try { const wr = await getHistoricalWeather(lat, lng, sd, ed); if (wr) weatherData = parseHourlyData(wr); } catch (e) { } }
                    const wi = buildWeatherIndex(weatherData);
                    let prevCounter: number | null = null;
                    telData = telData.map(record => {
                        const tc = record.total_count ?? record.coffee_count ?? 0;
                        let ec = 0;
                        if (tc > 0 && prevCounter !== null) { const d = tc - prevCounter; ec = d >= 0 ? d : tc; }
                        if (tc > 0) prevCounter = tc;
                        const td = new Date(record.timestamp); const { dateKey, hour } = getDateKeyAndHour(td);
                        const w = wi.get(`${dateKey}-${hour}`);
                        return { ...record, coffee_count: tc, espresso_count: ec, total_count: tc, weather_code: w?.weather_code ?? null, weather_description: getWeatherDescription(w?.weather_code), weather_icon: getWeatherIconKey(w?.weather_code), weather_temperature: w?.temperature ?? null };
                    });
                    summary.periodDays = Math.max(1, Math.ceil((ed.getTime() - sd.getTime()) / 86400000));
                    const db: Record<string, { coffee: number; espresso: number }> = {};
                    const dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    for (const r of telData) { const d = dn[new Date(r.timestamp).getDay()]; if (!db[d]) db[d] = { coffee: 0, espresso: 0 }; db[d].coffee += r.coffee_count || 0; db[d].espresso += r.espresso_count || 0; }
                    dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ day: d, coffee: db[d]?.coffee || 0, espresso: db[d]?.espresso || 0 }));
                    summary.totalCoffee = telData.reduce((s: number, r: any) => s + (r.coffee_count || 0), 0);
                    summary.totalEspresso = telData.reduce((s: number, r: any) => s + (r.espresso_count || 0), 0);
                    summary.totalDrinks = summary.totalCoffee + summary.totalEspresso;
                    const lr = telData.length > 0 ? telData[telData.length - 1] : null;
                    summary.numcaffegenerale = lr?.total_count ?? null;
                    summary.numcappuccino = lr?.cappuccino_count ?? null;
                    summary.numlatte = lr?.latte_count ?? null;
                }
            } catch (e) { console.error('Error fetching telemetry from provider:', e); }
        }
        return res.status(200).json({ success: true, data: { machine: { id: dbM.id, serial_number: dbM.serial_number, provider: dbM.provider, customer_name: dbM.customer_name, model: md.model, latitude: md.latitude, longitude: md.longitude, location: md.location }, telemetry: telData, dailyData, summary, alerts, weather: weatherData } });
    } catch (error) { console.error('Get machine telemetry error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleEnrichmentWeatherHourly(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req); if (!auth) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = auth as any; const serial = req.query.serial as string; const days = parseInt(req.query.days as string) || 7;
    if (!serial) return res.status(400).json({ success: false, error: 'serial is required' });
    try {
        const mr = await query('SELECT metadata FROM machines WHERE serial_number = $1', [serial]);
        if (!mr.rowCount) return res.status(404).json({ success: false, error: 'Machine not found' });
        const md = typeof mr.rows[0].metadata === 'string' ? JSON.parse(mr.rows[0].metadata) : mr.rows[0].metadata || {};
        if (!md.latitude || !md.longitude) return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        const weather = await getWeatherData(decoded.partner_id, parseFloat(md.latitude), parseFloat(md.longitude), days);
        return res.status(200).json({ success: true, data: { serial, provider: weather.provider, days, hourly: weather.data } });
    } catch (error) { console.error('Weather hourly error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleEnrichmentEvents(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req); if (!auth) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = auth as any; const serial = req.query.serial as string;
    const radiusKm = parseFloat(req.query.radiusKm as string) || 1; const days = parseInt(req.query.days as string) || 7;
    if (!serial) return res.status(400).json({ success: false, error: 'serial is required' });
    try {
        const mr = await query('SELECT metadata FROM machines WHERE serial_number = $1', [serial]);
        if (!mr.rowCount) return res.status(404).json({ success: false, error: 'Machine not found' });
        const md = typeof mr.rows[0].metadata === 'string' ? JSON.parse(mr.rows[0].metadata) : mr.rows[0].metadata || {};
        if (!md.latitude || !md.longitude) return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        const cr = await query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'ticketmaster'", [decoded.partner_id]);
        if (!cr.rowCount) return res.status(200).json({ success: true, data: { events: [], configured: false } });
        const creds = typeof cr.rows[0].credentials === 'string' ? JSON.parse(cr.rows[0].credentials) : cr.rows[0].credentials;
        if (!creds.api_key) return res.status(200).json({ success: true, data: { events: [], configured: false } });
        const events = await getNearbyEvents(creds.api_key, parseFloat(md.latitude), parseFloat(md.longitude), radiusKm, days);
        return res.status(200).json({ success: true, data: { events: events || [], configured: true } });
    } catch (error) { console.error('Events error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleEnrichmentFootfall(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req); if (!auth) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = auth as any; const serial = req.query.serial as string;
    const radiusM = parseInt(req.query.radiusM as string) || 100;
    if (!serial) return res.status(400).json({ success: false, error: 'serial is required' });
    try {
        const mr = await query('SELECT metadata FROM machines WHERE serial_number = $1', [serial]);
        if (!mr.rowCount) return res.status(404).json({ success: false, error: 'Machine not found' });
        const md = typeof mr.rows[0].metadata === 'string' ? JSON.parse(mr.rows[0].metadata) : mr.rows[0].metadata || {};
        if (!md.latitude || !md.longitude) return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        const cr = await query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'besttime'", [decoded.partner_id]);
        if (!cr.rowCount) return res.status(200).json({ success: true, data: { venue: null, forecast: null, configured: false } });
        const creds = typeof cr.rows[0].credentials === 'string' ? JSON.parse(cr.rows[0].credentials) : cr.rows[0].credentials;
        if (!creds.api_key) return res.status(200).json({ success: true, data: { venue: null, forecast: null, configured: false } });
        const lat = parseFloat(md.latitude), lon = parseFloat(md.longitude);
        const venue = await findNearbyVenue(creds.api_key, lat, lon, radiusM);
        if (!venue) return res.status(200).json({ success: true, data: { venue: null, forecast: null, configured: true } });
        const forecast = await getWeeklyForecast(creds.api_key, venue.venue_id);
        return res.status(200).json({ success: true, data: { venue, forecast, configured: true } });
    } catch (error) { console.error('Footfall error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleEnrichmentContext(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req); if (!auth) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = auth as any; const serial = req.query.serial as string;
    if (!serial) return res.status(400).json({ success: false, error: 'serial is required' });
    try {
        const mr = await query('SELECT metadata FROM machines WHERE serial_number = $1', [serial]);
        if (!mr.rowCount) return res.status(404).json({ success: false, error: 'Machine not found' });
        const md = typeof mr.rows[0].metadata === 'string' ? JSON.parse(mr.rows[0].metadata) : mr.rows[0].metadata || {};
        if (!md.latitude || !md.longitude) return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        const lat = parseFloat(md.latitude), lon = parseFloat(md.longitude), cid = decoded.partner_id;
        const [tmCreds, btCreds] = await Promise.all([
            query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'ticketmaster'", [cid]),
            query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'besttime'", [cid]),
        ]);
        const tmKey = extractApiKey(tmCreds), btKey = extractApiKey(btCreds);
        const fetchFf = async (k: string) => { const v = await findNearbyVenue(k, lat, lon, 100); if (!v) return { venue: null, forecast: null }; const f = await getWeeklyForecast(k, v.venue_id); return { venue: v, forecast: f }; };
        const [wr, er, fr] = await Promise.allSettled([
            getWeatherData(cid, lat, lon, 7),
            tmKey ? getNearbyEvents(tmKey, lat, lon, 1, 7) : Promise.resolve(null),
            btKey ? fetchFf(btKey) : Promise.resolve({ venue: null, forecast: null }),
        ]);
        const weather = wr.status === 'fulfilled' ? wr.value : { provider: 'none', data: [] };
        const events: any[] = er.status === 'fulfilled' ? (er.value || []) : [];
        const footfall: any = fr.status === 'fulfilled' ? fr.value : { venue: null, forecast: null };
        // Generate alerts
        const ctxAlerts: any[] = [];
        const today = new Date().toISOString().split('T')[0];
        if (events.length > 0) {
            events.filter((e: any) => e.date === today).forEach((e: any) => { ctxAlerts.push({ type: 'event', severity: 'warning', message: `Previsto "${e.name}" oggi a ${e.distance_km} km (${e.venue}) - Ticketmaster` }); });
            events.filter((e: any) => e.date > today).slice(0, 3).forEach((e: any) => { ctxAlerts.push({ type: 'event', severity: 'info', message: `Evento "${e.name}" il ${e.date} a ${e.distance_km} km (${e.venue})` }); });
        }
        if (weather.data.length > 0) {
            const tw = weather.data.filter((w: any) => w.date === today);
            if (tw.some((w: any) => w.weather_condition === 'Thunderstorm')) ctxAlerts.push({ type: 'weather', severity: 'warning', message: 'Temporale previsto oggi - possibile impatto sui consumi' });
            else if (tw.some((w: any) => w.precipitation && w.precipitation > 2)) ctxAlerts.push({ type: 'weather', severity: 'info', message: 'Pioggia prevista oggi - possibile aumento consumi indoor' });
        }
        if (footfall.forecast) {
            const dow = (new Date().getDay() + 6) % 7;
            const tf = footfall.forecast.days?.[dow];
            if (tf?.peak_intensity > 80) ctxAlerts.push({ type: 'footfall', severity: 'warning', message: `Alta affluenza prevista oggi presso "${footfall.venue?.venue_name}" (picco ${tf.peak_intensity}%)` });
        }
        return res.status(200).json({ success: true, data: { serial, weather: { provider: weather.provider, hourly: weather.data }, events: { items: events, configured: !!tmKey }, footfall: { venue: footfall.venue, forecast: footfall.forecast, configured: !!btKey }, alerts: ctxAlerts } });
    } catch (error) { console.error('Context error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

async function handleAnalyticsSmart(req: VercelRequest, res: VercelResponse) {
    const auth = verifyAuth(req); if (!auth) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = auth as any; const serial = req.query.serial as string;
    const lookbackDays = parseInt(req.query.lookbackDays as string) || 90;
    if (!serial) return res.status(400).json({ success: false, error: 'serial is required' });
    try {
        const mr = await query('SELECT metadata FROM machines WHERE serial_number = $1', [serial]);
        if (!mr.rowCount) return res.status(404).json({ success: false, error: 'Machine not found' });
        const md = typeof mr.rows[0].metadata === 'string' ? JSON.parse(mr.rows[0].metadata) : mr.rows[0].metadata || {};
        const lat = md.latitude ? parseFloat(md.latitude) : null;
        const lon = md.longitude ? parseFloat(md.longitude) : null;
        if (!lat || !lon) return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        const now = new Date(); const lookbackStart = new Date(); lookbackStart.setDate(now.getDate() - lookbackDays);
        const startStr = lookbackStart.toISOString().split('T')[0];
        const cid = decoded.partner_id;
        const tmCR = await query("SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'ticketmaster'", [cid]);
        const tmKey = extractApiKey(tmCR);
        const [telR, hwR, peR, fwR, feR] = await Promise.allSettled([
            query('SELECT timestamp, coffee_count, espresso_count FROM telemetry WHERE serial_number = $1 AND timestamp >= $2 ORDER BY timestamp ASC', [serial, startStr]),
            getHistoricalWeather(lat, lon, lookbackStart, now),
            tmKey ? getNearbyEvents(tmKey, lat, lon, 1, lookbackDays, lookbackStart, now) : Promise.resolve(null),
            getHistoricalWeather(lat, lon, now, new Date(now.getTime() + 7 * 86400000)),
            tmKey ? getNearbyEvents(tmKey, lat, lon, 1, 7) : Promise.resolve(null),
        ]);
        const telRows = telR.status === 'fulfilled' ? telR.value.rows : [];
        const hwRaw = hwR.status === 'fulfilled' ? hwR.value : null;
        const pastEvents: any = peR.status === 'fulfilled' ? (peR.value || []) : [];
        const fwRaw = fwR.status === 'fulfilled' ? fwR.value : null;
        const futureEvents: any = feR.status === 'fulfilled' ? (feR.value || []) : [];
        const histWeather = hwRaw ? parseHourlyData(hwRaw) : [];
        const fcWeather = fwRaw ? parseHourlyData(fwRaw) : [];
        const dailySales = aggregateDailySales(telRows);
        const dailyPrecip = aggregateDailyPrecipitation(histWeather);
        const wDates = new Set(histWeather.map((w: any) => w.date));
        const tDates = new Set(dailySales.map((d: any) => d.date));
        const wCov = tDates.size > 0 ? Math.round((wDates.size / tDates.size) * 100) : 0;
        const we = computeWeatherElasticity(dailySales, dailyPrecip);
        const ei = computeEventImpact(dailySales, pastEvents);
        const sf = computeSmartForecast(dailySales, we.elasticityIndex, ei.eventUplift, fcWeather, futureEvents, getWeatherDescription);
        return res.status(200).json({ success: true, data: { serial, lookbackDays, dataQuality: { telemetryDays: dailySales.length, weatherCoverage: Math.min(100, wCov), eventDataAvailable: !!tmKey }, weatherElasticity: we, eventImpact: ei, smartForecast: sf } });
    } catch (error) { console.error('[Analytics] Error:', error); return res.status(500).json({ success: false, error: 'Internal server error' }); }
}

// ============================================================
// MAIN ROUTER
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const method = req.method?.toUpperCase() || 'GET';
        const url = req.url?.split('?')[0] || '/';

        // Health check
        if (url === '/api/health') return res.status(200).json({ success: true, message: 'API running' });

        // Auth routes
        if (method === 'POST' && url === '/api/auth/login') return handleAuthLogin(req, res);
        if (method === 'POST' && url === '/api/auth/verify') return handleAuthVerify(req, res);
        if (method === 'POST' && url === '/api/auth/register') return handleAuthRegister(req, res);

        // Dashboard
        if (method === 'POST' && url === '/api/dashboard/stats') return handleDashboardStats(req, res);

        // Machines (portal)
        if (method === 'POST' && url === '/api/machines') return handleMachines(req, res);
        if (url === '/api/machines/list') return handleMachinesList(req, res);

        // Settings
        if (method === 'POST' && url === '/api/settings/credentials') return handleSettingsCredentials(req, res);
        if (method === 'POST' && url === '/api/settings/credentials/save') return handleSettingsCredentialsSave(req, res);

        // Customers
        if (url === '/api/customers') return handleCustomersList(req, res);

        // Admin Customers (static routes first)
        if (method === 'POST' && url === '/api/admin/customers/create') return handleAdminCustomersCreate(req, res);

        // Admin Users
        if (method === 'POST' && url === '/api/admin/users/create') return handleAdminUsersCreate(req, res);
        if ((method === 'GET' || method === 'POST') && (url === '/api/admin/users' || url === '/api/admin/users/list')) return handleAdminUsersList(req, res);
        if ((method === 'DELETE' || method === 'POST') && url === '/api/admin/users/delete') return handleAdminUsersDelete(req, res);
        if ((method === 'PUT' || method === 'POST') && url === '/api/admin/users/update') return handleAdminUsersUpdate(req, res);

        // Admin Machines (static routes first)
        if (method === 'POST' && url === '/api/admin/machines/create') return handleAdminMachinesCreate(req, res);
        if ((method === 'GET' || method === 'POST') && (url === '/api/admin/machines' || url === '/api/admin/machines/list')) return handleAdminMachinesList(req, res);
        if (method === 'GET' && url === '/api/admin/machines/brita-detail') return handleAdminBritaDetail(req, res);
        if (method === 'GET' && url === '/api/admin/machines/brita-list') return handleAdminBritaList(req, res);

        // Enrichment routes
        if (method === 'GET' && url === '/api/enrichment/weather-hourly') return handleEnrichmentWeatherHourly(req, res);
        if (method === 'GET' && url === '/api/enrichment/events') return handleEnrichmentEvents(req, res);
        if (method === 'GET' && url === '/api/enrichment/footfall') return handleEnrichmentFootfall(req, res);
        if (method === 'GET' && url === '/api/enrichment/context') return handleEnrichmentContext(req, res);

        // Analytics
        if (method === 'GET' && url === '/api/analytics/smart') return handleAnalyticsSmart(req, res);

        // Parametric routes (order matters - match more specific first)
        let match: RegExpMatchArray | null;

        // /api/machines/:serial/telemetry
        match = url.match(/^\/api\/machines\/([^/]+)\/telemetry$/);
        if (match && method === 'GET') { (req.query as any).serial = match[1]; return handleMachineTelemetry(req, res); }

        // /api/admin/customers/:customerId/credentials
        match = url.match(/^\/api\/admin\/customers\/([^/]+)\/credentials$/);
        if (match) {
            (req.query as any).customerId = match[1];
            if (method === 'GET') return handleAdminCustomersListCredentials(req, res);
            if (method === 'POST') return handleAdminCustomersSaveCredential(req, res);
        }

        // /api/admin/customers/:customerId (DELETE)
        match = url.match(/^\/api\/admin\/customers\/([^/]+)$/);
        if (match && method === 'DELETE') { (req.query as any).customerId = match[1]; return handleAdminCustomersDelete(req, res); }

        // /api/admin/credentials/:credentialId/test
        match = url.match(/^\/api\/admin\/credentials\/([^/]+)\/test$/);
        if (match && method === 'POST') { (req.query as any).credentialId = match[1]; return handleAdminCredentialsTest(req, res); }

        // /api/admin/credentials/:credentialId/sync
        match = url.match(/^\/api\/admin\/credentials\/([^/]+)\/sync$/);
        if (match && method === 'POST') { (req.query as any).credentialId = match[1]; return handleAdminCredentialsSync(req, res); }

        // /api/admin/credentials/:credentialId (DELETE)
        match = url.match(/^\/api\/admin\/credentials\/([^/]+)$/);
        if (match && method === 'DELETE') { (req.query as any).credentialId = match[1]; return handleAdminCredentialsDelete(req, res); }

        // /api/admin/machines/:machineId/detail
        match = url.match(/^\/api\/admin\/machines\/([^/]+)\/detail$/);
        if (match && method === 'GET') { (req.query as any).machineId = match[1]; return handleAdminMachineDetail(req, res); }

        // /api/admin/machines/:machineId/telemetry
        match = url.match(/^\/api\/admin\/machines\/([^/]+)\/telemetry$/);
        if (match && method === 'GET') { (req.query as any).machineId = match[1]; return handleAdminMachineTelemetry(req, res); }

        return res.status(404).json({ success: false, error: `Route not found: ${method} ${url}` });
    } catch (err: any) {
        console.error('API Error:', err);
        return res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
    }
}
