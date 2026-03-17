import fetch from 'node-fetch';

export interface CimbaliCredentials {
    username: string;
    password: string;
}

export interface CimbaliMachine {
    id: string;
    machineId: string;
    serial: string;
    name: string;
    brand: string;
    model: string;
    family: string;
    status: 'online' | 'offline';
    lastConnection: string | null;
    provider: string;
    // Customer info from Cimbali
    customerName?: string;
    customerGroup?: string;
    // Extended info
    latitude?: number;
    longitude?: number;
    location?: string;
}

export interface CimbaliTelemetryRecord {
    timestamp: string;
    coffee_count: number;
    espresso_count: number;
    total_count: number;
    cappuccino_count: number;
    latte_count: number;
    temperature?: number;
    water_ph?: number;
    water_tds?: number;
    water_temperature?: number;
    pressure?: number;
    power_consumption?: number;
    raw_counters?: Record<string, number>;
}

function getBasicAuth(creds: CimbaliCredentials): string {
    return Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
}

/**
 * Robust timestamp parser handling Cimbali's DD/MM/YYYY format and ISO strings
 */
function parseTimestamp(value: any): Date | null {
    if (!value) return null;

    // If it's a number (timestamp)
    if (typeof value === 'number') {
        // Heuristic: treat > 1e12 as ms, otherwise seconds
        if (value > 1e12) {
            return new Date(value);
        }
        return new Date(value * 1000);
    }

    if (typeof value === 'string') {
        // Handle numeric strings (epoch)
        if (/^\d+$/.test(value)) {
            const asNumber = parseInt(value, 10);
            if (!isNaN(asNumber)) {
                return asNumber > 1e12 ? new Date(asNumber) : new Date(asNumber * 1000);
            }
        }

        // Handle CIMBALI format: DD/MM/YYYY HH:MM:SS.ss
        // Clean up fractional seconds first
        let cleanValue = value;
        if (value.includes('.')) {
            // Check if it looks like DD/MM/YYYY
            if (value.includes('/')) {
                cleanValue = value.split('.')[0];
            }
        }

        // Try regex for DD/MM/YYYY HH:MM:SS
        const euroMatch = cleanValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/);
        if (euroMatch) {
            const day = parseInt(euroMatch[1], 10);
            const month = parseInt(euroMatch[2], 10) - 1; // Month is 0-indexed in JS
            const year = parseInt(euroMatch[3], 10);
            const hour = euroMatch[4] ? parseInt(euroMatch[4], 10) : 0;
            const minute = euroMatch[5] ? parseInt(euroMatch[5], 10) : 0;
            const second = euroMatch[6] ? parseInt(euroMatch[6], 10) : 0;
            return new Date(year, month, day, hour, minute, second);
        }

        // Try standard Date parsing (ISO)
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}

export async function getCimbaliMachines(creds: CimbaliCredentials, startIndex: number = 0, limit: number = 100): Promise<CimbaliMachine[]> {
    const auth = getBasicAuth(creds);

    try {
        const response = await fetch(`https://public-api.cimbaligroup.tech/api/v1/GetMachines?startIndex=${startIndex}&limit=${limit}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Cimbali API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;

        if (!data.success) {
            throw new Error(data.message || 'Cimbali API returned success: false');
        }

        return data.data.map((m: any) => {
            // Robust geodata extraction
            const latitude = parseFloat(m.realPosLatitude || m.latitude || m.lat || 0) || undefined;
            const longitude = parseFloat(m.realPosLongitude || m.longitude || m.lng || m.lon || 0) || undefined;

            const lastConnectionDate = parseTimestamp(m.serverDateTime);

            return {
                id: m.serial,
                machineId: m.serial,
                serial: m.serial,
                name: m.name || `${m.model} (${m.serial})`,
                brand: m.brand || m.brandName || 'CIMBALI', // Use API provided brand if available
                model: m.model || m.modelName,
                family: m.family || m.model,
                status: m.connected ? 'online' : 'offline',
                lastConnection: lastConnectionDate ? lastConnectionDate.toISOString() : null,
                provider: 'cimbali',
                // Customer info from Cimbali API
                customerName: m.customer || m.customerName || m.Customer || null,
                customerGroup: m.customerGroup || m.CustomerGroup || null,
                // Geodata
                latitude: latitude,
                longitude: longitude,
                location: m.location || m.address || null
            };
        });
    } catch (error) {
        console.error('Cimbali fetch error:', error);
        return [];
    }
}

export async function getCimbaliMachineInfo(creds: CimbaliCredentials, serial: string): Promise<CimbaliMachine | null> {
    const auth = getBasicAuth(creds);

    try {
        // Need to pass startDate/endDate params sometimes to get full info? No, GetMachineInfo is simpler.
        // Actually, some endpoints are finicky.
        const response = await fetch(`https://public-api.cimbaligroup.tech/api/v1/GetMachineInfo?serial=${serial}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`[CIMBALI] GetMachineInfo failed (${response.status}). Falling back to GetMachines list.`);
            // Fallback: Fetch all machines and find this one
            const machines = await getCimbaliMachines(creds);
            const found = machines.find(m => m.serial === serial);
            if (found) {
                console.log(`[CIMBALI] Found machine ${serial} in list fallback.`);
                return found;
            }
            return null;
        }

        const data = await response.json() as any;
        if (!data.success || !data.data) {
            console.warn(`[CIMBALI] GetMachineInfo returned invalid data. Falling back to list.`);
            const machines = await getCimbaliMachines(creds);
            const found = machines.find(m => m.serial === serial);
            if (found) return found;
            return null;
        }

        const m = data.data;
        console.log('[DEBUG CIMBALI] Machine Info:', JSON.stringify(m, null, 2));
        // Robust geodata extraction
        const latitude = parseFloat(m.realPosLatitude || m.latitude || m.lat || 0) || undefined;
        const longitude = parseFloat(m.realPosLongitude || m.longitude || m.lng || m.lon || 0) || undefined;

        const lastConnectionDate = parseTimestamp(m.serverDateTime);

        return {
            id: m.serial,
            machineId: m.serial,
            serial: m.serial,
            name: m.name || `${m.model} (${m.serial})`,
            brand: m.brand || m.brandName || 'CIMBALI', // Use API provided brand if available
            model: m.model || m.modelName,
            family: m.family || m.model,
            status: m.connected ? 'online' : 'offline',
            lastConnection: lastConnectionDate ? lastConnectionDate.toISOString() : null,
            provider: 'cimbali',
            // Customer info from Cimbali API
            customerName: m.customer || m.customerName || m.Customer || null,
            customerGroup: m.customerGroup || m.CustomerGroup || null,
            // Geodata
            latitude: latitude,
            longitude: longitude,
            location: m.location || m.address || null
        };
    } catch (error) {
        console.error('Cimbali machine info error:', error);
        return null;
    }
}

export async function getCimbaliTelemetry(
    creds: CimbaliCredentials,
    serial: string,
    startDate?: number,
    endDate?: number
): Promise<CimbaliTelemetryRecord[]> {
    const auth = getBasicAuth(creds);

    // Default: last 7 days
    const end = endDate || Date.now();
    const start = startDate || (end - (7 * 24 * 60 * 60 * 1000));

    try {
        const response = await fetch(
            `https://public-api.cimbaligroup.tech/api/v1/GetReportConsumeBetween?serial=${serial}&startDate=${start}&endDate=${end}`,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) return [];

        const data = await response.json() as any;
        // Handle various response structures
        const consumeData = data.consume || data.consumes || data.data || [];

        // Normalize to match Odoo telemetry structure
        const normalized = consumeData.map((record: any) => {
            // 1. Data Parsing
            const rawTimestamp =
                record.timestamp ||
                record.dateTime ||
                record.datetime ||
                record.date ||
                record.consumeDate ||
                record.createdAt ||
                record.startTime ||
                record.ping;
            const dateObj = parseTimestamp(rawTimestamp);
            if (!dateObj) {
                return null;
            }

            // 2. Counter Extraction (Complex Cimbali Data Array)
            let coffee = 0;
            let espresso = 0;
            let total = 0;
            let cappuccino = 0;
            let latte = 0;

            if (Array.isArray(record.data) && record.data.length > 0 && record.data[0].name) {
                // Cimbali complex format: data is array of {name, value}
                const counters: Record<string, number> = {};
                record.data.forEach((item: any) => {
                    const name = (item.name || '').toLowerCase();
                    const value = parseFloat(item.value || 0);
                    counters[name] = value;
                });

                // DEBUG: Log all counter keys to understand API structure
                if (consumeData.indexOf(record) === 0) {
                    console.log('[DEBUG CIMBALI] ALL counter keys in first record:', Object.keys(counters));
                    console.log('[DEBUG CIMBALI] ALL counters with values:', JSON.stringify(counters, null, 2));
                }

                total = counters['numcaffegenerale'] || 0;

                // Extract cappuccino and latte counters
                cappuccino = counters['numcappuccino'] || counters['numcappuccini'] || 0;
                latte = counters['numlatte'] || counters['numlattemacchiato'] || 0;

                // DEBUG: Log extracted values
                if (consumeData.indexOf(record) === 0) {
                    console.log('[DEBUG CIMBALI] Extracted: total=', total, 'cappuccino=', cappuccino, 'latte=', latte);
                }

                // Sum groups
                for (const [key, val] of Object.entries(counters)) {
                    if (key.includes('numcaffegruppo')) {
                        coffee += val;
                    } else if (key.includes('espresso')) {
                        espresso += val;
                    }
                }

                // Fallback
                if (coffee === 0 && total > 0) {
                    coffee = total;
                }

            } else {
                // Simple format
                const nestedCounters = record.counters || {};
                coffee = parseFloat(record.coffee || record.coffeeCount || nestedCounters.coffee || nestedCounters.coffeeCount || 0);
                espresso = parseFloat(record.espresso || record.espressoCount || nestedCounters.espresso || nestedCounters.espressoCount || 0);
                total = parseFloat(record.total || record.totalCount || nestedCounters.total || nestedCounters.totalCount || 0);
                cappuccino = parseFloat(record.cappuccino || record.cappuccinoCount || nestedCounters.cappuccino || 0);
                latte = parseFloat(record.latte || record.latteCount || nestedCounters.latte || 0);

                if (total === 0) {
                    total = coffee + espresso;
                }
            }

            // Build raw_counters from the complex data array if available
            const rawCounters: Record<string, number> = {};
            if (Array.isArray(record.data) && record.data.length > 0 && record.data[0].name) {
                record.data.forEach((item: any) => {
                    const name = (item.name || '').toLowerCase();
                    const value = parseFloat(item.value || 0);
                    rawCounters[name] = value;
                });
            }

            return {
                timestamp: dateObj.toISOString(),
                coffee_count: Math.round(coffee),
                espresso_count: Math.round(espresso),
                total_count: Math.round(total),
                cappuccino_count: Math.round(cappuccino),
                latte_count: Math.round(latte),
                temperature: parseFloat(record.temperature || record.temp || 0) || null,
                water_ph: parseFloat(record.waterPh || 0) || null,
                water_tds: parseFloat(record.waterTds || 0) || null,
                water_temperature: parseFloat(record.waterTemperature || record.waterTemp || 0) || null,
                pressure: parseFloat(record.pressure || 0) || null,
                power_consumption: parseFloat(record.powerConsumption || record.power || 0) || null,
                ...(Object.keys(rawCounters).length > 0 ? { raw_counters: rawCounters } : {})
            };
        }).filter((record: CimbaliTelemetryRecord | null): record is CimbaliTelemetryRecord => !!record);

        console.log('[DEBUG CIMBALI] Normalized records:', normalized.length);
        if (normalized.length > 0) console.log('[DEBUG CIMBALI] Last record:', JSON.stringify(normalized[normalized.length - 1], null, 2));
        return normalized.sort((a: CimbaliTelemetryRecord, b: CimbaliTelemetryRecord) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

    } catch (error) {
        console.error('Cimbali telemetry error:', error);
        return [];
    }
}

export async function getCimbaliAlerts(creds: CimbaliCredentials, serial: string): Promise<any[]> {
    const auth = getBasicAuth(creds);

    try {
        const response = await fetch(
            `https://public-api.cimbaligroup.tech/api/v1/GetMachineAlerts?serial=${serial}`,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) return [];

        const data = await response.json() as any;
        return data.alerts || data.data || [];
    } catch (error) {
        console.error('Cimbali alerts error:', error);
        return [];
    }
}

