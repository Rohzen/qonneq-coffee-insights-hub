import fetch from 'node-fetch';

export interface TicketmasterEvent {
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

/**
 * Fetch nearby events from the Ticketmaster Discovery API v2.
 */
export async function getNearbyEvents(
    apiKey: string,
    lat: number,
    lon: number,
    radiusKm: number = 1,
    days: number = 7,
    customStartDate?: Date,
    customEndDate?: Date
): Promise<TicketmasterEvent[] | null> {
    const startDate = customStartDate || new Date();
    const endDate = customEndDate || new Date();
    if (!customEndDate) {
        endDate.setDate(endDate.getDate() + days);
    }

    const startStr = startDate.toISOString().split('.')[0] + 'Z';
    const endStr = endDate.toISOString().split('.')[0] + 'Z';

    const params = new URLSearchParams({
        apikey: apiKey,
        latlong: `${lat},${lon}`,
        radius: radiusKm.toString(),
        unit: 'km',
        startDateTime: startStr,
        endDateTime: endStr,
        size: '50',
        sort: 'date,asc',
    });

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = (await response.json()) as any;
        const embedded = data._embedded;
        if (!embedded || !embedded.events) {
            return [];
        }

        return embedded.events.map((event: any) => {
            const venue = event._embedded?.venues?.[0];
            const venueLat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : null;
            const venueLon = venue?.location?.longitude ? parseFloat(venue.location.longitude) : null;

            let distance = 0;
            if (venueLat !== null && venueLon !== null) {
                distance = haversineDistance(lat, lon, venueLat, venueLon);
            }

            return {
                id: event.id,
                name: event.name,
                type: event.classifications?.[0]?.segment?.name || 'Other',
                date: event.dates?.start?.localDate || '',
                time: event.dates?.start?.localTime || null,
                venue: venue?.name || 'Unknown',
                venue_lat: venueLat,
                venue_lon: venueLon,
                distance_km: Math.round(distance * 100) / 100,
                url: event.url || null,
            };
        });
    } catch (error) {
        console.error('Ticketmaster API error:', error);
        return null;
    }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
