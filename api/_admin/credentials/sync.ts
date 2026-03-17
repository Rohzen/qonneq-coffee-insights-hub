import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';
import { getCimbaliMachineInfo, CimbaliCredentials, getCimbaliMachines } from '../../_lib/cimbali';
import { getBritaResources, BritaCredentials } from '../../_lib/brita';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const auth = await verifyAuth(req);
        if (!auth || !isAdmin(auth)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { credentialId } = req.query;

        // 1. Get credential details
        const credRes = await query(
            'SELECT * FROM api_credentials WHERE id = $1',
            [credentialId]
        );

        if (credRes.rowCount === 0) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        const credential = credRes.rows[0];
        const provider = credential.provider; // 'cimbali' or 'brita'
        let syncedCount = 0;
        let createdCount = 0;
        let updatedCount = 0;

        if (provider === 'cimbali') {
            const cimbaliCreds = {
                username: credential.credentials?.username || credential.username,
                password: credential.credentials?.password || credential.password
            };

            let startIndex = 0;
            const limit = 100;
            let hasMore = true;

            while (hasMore) {
                const machines = await getCimbaliMachines(cimbaliCreds, startIndex, limit);

                if (!machines || machines.length === 0) {
                    hasMore = false;
                    break;
                }

                for (const machine of machines) {
                    // Check if machine exists
                    const existing = await query(
                        'SELECT id FROM machines WHERE serial_number = $1',
                        [machine.serial]
                    );

                    // Formatted name as per Odoo: "{Model} ({Serial})"
                    const formattedName = `${machine.model} (${machine.serial})`;

                    // Store additional info in metadata JSONB
                    const metadata = JSON.stringify({
                        name: machine.name,
                        model: machine.model,
                        family: machine.family,
                        brand: 'CIMBALI',
                        status: machine.status, // online/offline
                        credential_id: credential.id,
                        // Customer info from Cimbali
                        customerName: machine.customerName,
                        customerGroup: machine.customerGroup,
                        // Location
                        latitude: machine.latitude,
                        longitude: machine.longitude,
                        location: machine.location,
                        lastSync: new Date().toISOString()
                    });

                    if (existing && existing.rowCount && existing.rowCount > 0) {
                        // Update
                        await query(
                            'UPDATE machines SET provider = $1, company_id = $2, external_id = $3, metadata = $4, updated_at = CURRENT_TIMESTAMP WHERE serial_number = $5',
                            [provider, credential.company_id, machine.serial, metadata, machine.serial]
                        );
                        updatedCount++;
                    } else {
                        // Insert
                        await query(
                            'INSERT INTO machines (serial_number, company_id, provider, external_id, metadata, credential_id) VALUES ($1, $2, $3, $4, $5, $6)',
                            [machine.serial, credential.company_id, provider, machine.serial, metadata, credential.id]
                        );
                        createdCount++;
                    }
                    syncedCount++;
                }

                if (machines.length < limit) {
                    hasMore = false;
                } else {
                    startIndex += limit;
                }
            }
        } else if (provider === 'brita') {
            const britaCreds: BritaCredentials = {
                apiKey: credential.credentials?.apiKey || credential.credentials?.api_key,
                tenantId: credential.credentials?.tenantId || credential.credentials?.tenant_id
            };

            let continuationToken: string | null = null;

            do {
                const result = await getBritaResources(britaCreds, 100, continuationToken || undefined);
                const machines = result.items || [];

                for (const machine of machines) {
                    const existing = await query(
                        'SELECT id FROM machines WHERE external_id = $1 AND provider = $2',
                        [machine.resourceId, 'brita']
                    );

                    const metadata = JSON.stringify({
                        name: machine.name,
                        model: machine.model,
                        brand: 'BRITA',
                        status: machine.status,
                        resourceType: machine.resourceType,
                        latitude: machine.latitude,
                        longitude: machine.longitude,
                        location: machine.location,
                        credential_id: credential.id,
                        lastSync: new Date().toISOString()
                    });

                    if (existing && existing.rowCount && existing.rowCount > 0) {
                        await query(
                            'UPDATE machines SET serial_number = $1, company_id = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP WHERE external_id = $4 AND provider = $5',
                            [machine.serial, credential.company_id, metadata, machine.resourceId, 'brita']
                        );
                        updatedCount++;
                    } else {
                        await query(
                            'INSERT INTO machines (serial_number, company_id, provider, external_id, metadata, credential_id) VALUES ($1, $2, $3, $4, $5, $6)',
                            [machine.serial, credential.company_id, 'brita', machine.resourceId, metadata, credential.id]
                        );
                        createdCount++;
                    }
                    syncedCount++;
                }

                continuationToken = result.continuationToken || null;
            } while (continuationToken);
        } else {
            return res.status(501).json({ error: 'Provider not implemented yet' });
        }

        return res.status(200).json({
            success: true,
            message: `Successfully synced ${syncedCount} machines from ${provider} (Created: ${createdCount}, Updated: ${updatedCount})`,
            data: {
                machines_synced: syncedCount,
                created: createdCount,
                updated: updatedCount
            }
        });

    } catch (error) {
        console.error('Sync Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
