import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';
import { getBritaResourceDetail, BritaCredentials } from '../../_lib/brita';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded: any = await verifyAuth(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const adminUser = isAdmin(decoded);
    const userCompanyId = decoded.partner_id;

    const { machineId } = req.query;

    if (!machineId || typeof machineId !== 'string') {
        return res.status(400).json({ success: false, error: 'Machine ID is required' });
    }

    try {
        const machineResult = await query(`
            SELECT
                m.id,
                m.serial_number,
                m.provider,
                m.external_id,
                m.metadata,
                m.company_id,
                c.name as customer_name,
                m.created_at,
                m.updated_at
            FROM machines m
            LEFT JOIN companies c ON m.company_id = c.id
            WHERE m.id = $1
        `, [machineId]);

        if (machineResult.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Machine not found' });
        }

        const dbMachine = machineResult.rows[0];

        // Non-admin users can only view machines belonging to their company
        if (!adminUser && userCompanyId && dbMachine.company_id !== userCompanyId) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (dbMachine.provider !== 'brita') {
            return res.status(400).json({ success: false, error: 'Machine is not a BRITA device' });
        }

        const metadata = dbMachine.metadata || {};

        let machineData: any = {
            id: dbMachine.id,
            serial_number: dbMachine.serial_number,
            serial: dbMachine.serial_number,
            provider: dbMachine.provider,
            external_id: dbMachine.external_id,
            company_id: dbMachine.company_id,
            customer_name: dbMachine.customer_name,
            model: metadata.model || 'N/D',
            brand: metadata.brand || 'BRITA',
            name: metadata.name || dbMachine.serial_number,
            status: metadata.status || 'offline',
            resourceType: metadata.resourceType || 'Unknown',
            latitude: metadata.latitude || null,
            longitude: metadata.longitude || null,
            location: metadata.location || null,
            lastSync: dbMachine.updated_at,
        };

        // Fetch live detail from BRITA API
        let britaDetail: any = null;

        if (dbMachine.external_id && dbMachine.company_id) {
            try {
                const credResult = await query(
                    'SELECT * FROM api_credentials WHERE company_id = $1 AND provider = $2',
                    [dbMachine.company_id, 'brita']
                );

                if (credResult.rowCount && credResult.rowCount > 0) {
                    const cred = credResult.rows[0];
                    const britaCreds: BritaCredentials = {
                        apiKey: cred.credentials?.apiKey || cred.credentials?.api_key,
                        tenantId: cred.credentials?.tenantId || cred.credentials?.tenant_id
                    };

                    britaDetail = await getBritaResourceDetail(britaCreds, dbMachine.external_id);
                }
            } catch (providerError) {
                console.error('Error fetching BRITA detail:', providerError);
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                machine: machineData,
                britaDetail
            }
        });

    } catch (error) {
        console.error('Get BRITA machine detail error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
