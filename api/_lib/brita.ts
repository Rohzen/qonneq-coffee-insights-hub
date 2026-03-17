import fetch from 'node-fetch';

export interface BritaCredentials {
    apiKey: string;
    tenantId: string;
}

export async function getBritaResources(creds: BritaCredentials, maxPageSize?: number, continuationToken?: string) {
    let url = `https://api.brita.net/iq/public/v1/tenants/${creds.tenantId}/resources`;
    const params = new URLSearchParams();
    if (maxPageSize) params.append('maxPageSize', maxPageSize.toString());
    if (continuationToken) params.append('continuationToken', continuationToken);

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': creds.apiKey,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Brita API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;
        const values = data.values || [];

        const resources = values.map((item: any) => {
            const resource = item.resource || {};
            const type = resource.type || 'Unknown';
            let modelName = type;
            let serial = item.id;
            let status = 'offline';

            // Geodata from BRITA
            const geoLocation = item.geoLocation || {};
            const latitude = geoLocation.latitude ? parseFloat(geoLocation.latitude) : undefined;
            const longitude = geoLocation.longitude ? parseFloat(geoLocation.longitude) : undefined;
            const location = item.location ?
                `${item.location.street || ''} ${item.location.city || ''} ${item.location.postalCode || ''}`.trim()
                : undefined;

            if (type === 'PURITY_C_IQ') {
                const purityCiQ = resource.purityCiQ || {};
                const deviceId = purityCiQ.id || item.id;
                serial = deviceId;
                const variant = purityCiQ.variant || '';
                status = variant === 'ONLINE' ? 'online' : 'offline';

                const reported = purityCiQ.reported || {};
                const cartridge = reported.cartridge || {};
                const cartridgeType = cartridge.type || '';
                if (cartridgeType) {
                    modelName = cartridgeType.replace('_', ' ');
                } else {
                    modelName = 'Purity C iQ';
                }
            } else if (type === 'IQ_METER') {
                const iqMeter = resource.iqMeter || {};
                serial = iqMeter.id || item.id;
                modelName = 'iQ Meter';
                status = iqMeter.lastDeviceEvent ? 'online' : 'offline';
            } else if (type === 'DISPENSER') {
                const dispenser = resource.dispenser || {};
                serial = dispenser.serialNumber || item.id;
                modelName = 'Dispenser';
                status = dispenser.lastDeviceEventUtc ? 'online' : 'offline';
            }

            return {
                id: serial,
                resourceId: item.id,
                machineId: serial,
                serial: serial,
                name: item.name || `${modelName} (${serial})`,
                brand: 'BRITA',
                model: modelName,
                status: status,
                resourceType: type,
                lastConnection: null,
                provider: 'brita',
                latitude: latitude,
                longitude: longitude,
                location: location
            };
        });

        return {
            items: resources,
            continuationToken: data.continuationToken
        };
    } catch (error) {
        console.error('Brita fetch error:', error);
        return { items: [], continuationToken: null };
    }
}

export async function getBritaResourceDetail(creds: BritaCredentials, resourceId: string) {
    const url = `https://api.brita.net/iq/public/v1/tenants/${creds.tenantId}/resources/${resourceId}`;

    const response = await fetch(url, {
        headers: {
            'X-API-KEY': creds.apiKey,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Brita API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}
