import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import { verifyAuth, isAdmin } from '../../lib/auth';
import { getCimbaliMachineInfo, CimbaliCredentials } from '../../lib/cimbali';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = await verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    const { machineId } = req.query;

    if (!machineId || typeof machineId !== 'string') {
        return res.status(400).json({ success: false, error: 'Machine ID is required' });
    }

    try {
        // Fetch machine from database
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
        const metadata = dbMachine.metadata || {};

        // Build base machine object from DB
        let machineData: any = {
            id: dbMachine.id,
            serial_number: dbMachine.serial_number,
            serial: dbMachine.serial_number,
            provider: dbMachine.provider,
            external_id: dbMachine.external_id,
            company_id: dbMachine.company_id,
            customer_name: dbMachine.customer_name,
            model: metadata.model || 'N/D',
            brand: metadata.brand || dbMachine.provider?.toUpperCase() || 'Unknown',
            name: metadata.name || dbMachine.serial_number,
            status: metadata.status || 'offline',
            isOnline: metadata.status === 'online',
            latitude: metadata.latitude || null,
            longitude: metadata.longitude || null,
            location: metadata.location || null,
            lastSync: dbMachine.updated_at,
        };

        // Try to get live status from provider (Cimbali)
        if (dbMachine.provider === 'cimbali' && dbMachine.company_id) {
            try {
                // Find credentials for this machine's company
                const credResult = await query(
                    'SELECT * FROM api_credentials WHERE company_id = $1 AND provider = $2',
                    [dbMachine.company_id, 'cimbali']
                );

                if (credResult.rowCount && credResult.rowCount > 0) {
                    const cred = credResult.rows[0];
                    const cimbaliCreds: CimbaliCredentials = {
                        username: cred.username,
                        password: cred.password
                    };

                    // Fetch live machine info from Cimbali API
                    const liveInfo = await getCimbaliMachineInfo(cimbaliCreds, dbMachine.serial_number);

                    if (liveInfo) {
                        // Merge live data
                        machineData = {
                            ...machineData,
                            status: liveInfo.status,
                            isOnline: liveInfo.status === 'online',
                            latitude: liveInfo.latitude || machineData.latitude,
                            longitude: liveInfo.longitude || machineData.longitude,
                            location: liveInfo.location || machineData.location,
                            lastConnection: liveInfo.lastConnection,
                            model: liveInfo.model || machineData.model,
                            brand: liveInfo.brand || machineData.brand,
                        };
                    }
                }
            } catch (providerError) {
                console.error('Error fetching live data from provider:', providerError);
                // Continue with DB data if provider call fails
            }
        }

        return res.status(200).json({
            success: true,
            data: machineData
        });

    } catch (error) {
        console.error('Get machine detail error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
