import fetch from 'node-fetch';

export interface BestTimeVenue {
    venue_id: string;
    venue_name: string;
    venue_address: string;
    venue_lat: number;
    venue_lon: number;
}

export interface FootfallHourly {
    hour: number;
    intensity: number; // 0-100
}

export interface BestTimeWeeklyForecast {
    venue_id: string;
    venue_name: string;
    days: {
        day_int: number;
        day_text: string;
        busy_hours: number[];
        quiet_hours: number[];
        peak_intensity: number;
        hourly: FootfallHourly[];
    }[];
}

/**
 * Search for a nearby venue using BestTime.app Venues Search endpoint.
 */
export async function findNearbyVenue(
    apiKey: string,
    lat: number,
    lon: number,
    radiusM: number = 100
): Promise<BestTimeVenue | null> {
    const url = 'https://besttime.app/api/v1/venues/search';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key_private: apiKey,
                q: `venues near ${lat},${lon}`,
                num: 1,
                radius: radiusM,
                lat,
                lng: lon,
            }),
        });

        if (!response.ok) {
            console.error(`BestTime venue search error: ${response.status}`);
            return null;
        }

        const data = (await response.json()) as any;
        const venues = data.venues || [];
        if (venues.length === 0) return null;

        const v = venues[0];
        return {
            venue_id: v.venue_id,
            venue_name: v.venue_name,
            venue_address: v.venue_address || '',
            venue_lat: v.venue_lat || lat,
            venue_lon: v.venue_lng || lon,
        };
    } catch (error) {
        console.error('BestTime venue search error:', error);
        return null;
    }
}

/**
 * Get weekly footfall forecast for a venue from BestTime.app.
 */
export async function getWeeklyForecast(
    apiKey: string,
    venueId: string
): Promise<BestTimeWeeklyForecast | null> {
    const url = `https://besttime.app/api/v1/forecasts/weekly?api_key_private=${encodeURIComponent(apiKey)}&venue_id=${encodeURIComponent(venueId)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`BestTime forecast error: ${response.status}`);
            return null;
        }

        const data = (await response.json()) as any;
        if (data.status !== 'OK' && !data.analysis) return null;

        const analysis = data.analysis || {};
        const days = (analysis.week_raw || []).map((dayData: any, idx: number) => {
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const hourlyRaw = dayData.day_raw || [];

            const hourly: FootfallHourly[] = hourlyRaw.map((intensity: number, hour: number) => ({
                hour,
                intensity: Math.max(0, Math.min(100, intensity)),
            }));

            const busyHours = hourly.filter(h => h.intensity >= 70).map(h => h.hour);
            const quietHours = hourly.filter(h => h.intensity <= 30).map(h => h.hour);
            const peakIntensity = Math.max(...hourly.map(h => h.intensity), 0);

            return {
                day_int: idx,
                day_text: dayNames[idx] || `Day ${idx}`,
                busy_hours: busyHours,
                quiet_hours: quietHours,
                peak_intensity: peakIntensity,
                hourly,
            };
        });

        return {
            venue_id: venueId,
            venue_name: data.venue_info?.venue_name || '',
            days,
        };
    } catch (error) {
        console.error('BestTime forecast error:', error);
        return null;
    }
}
