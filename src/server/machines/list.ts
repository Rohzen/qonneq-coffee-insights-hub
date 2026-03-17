import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../lib/db';
import { verifyAuth, isAdmin } from '../lib/auth';

// This endpoint returns machines for the logged-in user's company
// Used by the dashboard machines list (non-admin view)
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded: any = verifyAuth(req); // explicit cast to any for role check
    if (!decoded) {
        console.error('[List Machines] Unauthorized: No decoded token');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const companyId = decoded.partner_id;
    const adminUser = isAdmin(decoded);
    console.log('[List Machines] Access Check:', {
        adminUser,
        companyId,
        role: decoded.role,
        decoded
    });

    if (!adminUser && !companyId) {
        console.error('[List Machines] No company ID for non-admin user');
        return res.status(400).json({ success: false, error: 'User is not associated with a company' });
    }

    try {
        let result;

        if (adminUser) {
            // Admin sees all machines with company info
            result = await query(`
                SELECT 
                    m.id,
                    m.serial_number,
                    m.provider,
                    m.external_id,
                    m.metadata,
                    m.company_id,
                    c.name as company_name,
                    m.created_at,
                    m.updated_at
                FROM machines m
                LEFT JOIN companies c ON m.company_id = c.id
                ORDER BY m.created_at DESC
            `);
        } else {
            // User sees only company machines with company info
            result = await query(`
                SELECT 
                    m.id,
                    m.serial_number,
                    m.provider,
                    m.external_id,
                    m.metadata,
                    m.company_id,
                    c.name as company_name,
                    m.created_at,
                    m.updated_at
                FROM machines m
                LEFT JOIN companies c ON m.company_id = c.id
                WHERE m.company_id = $1
                ORDER BY m.created_at DESC
            `, [companyId]);
        }

        // Extract fields from metadata JSONB and normalize for frontend
        // Prioritize customerName from Cimbali API over local company_name
        const machines = result.rows.map(row => ({
            id: row.id,
            machineId: row.serial_number,
            serialNumber: row.serial_number,
            name: row.metadata?.name || row.serial_number,
            brand: row.metadata?.brand || row.provider,
            model: row.metadata?.model || 'N/D',
            family: row.metadata?.family || row.metadata?.model || 'N/D',
            status: row.metadata?.status || 'offline',
            provider: row.provider,
            lastConnection: row.metadata?.lastSync || row.updated_at,
            // Prioritize Cimbali customerName, fallback to local company_name
            customerName: row.metadata?.customerName || null,
            customerGroup: row.metadata?.customerGroup || null,
            companyName: row.metadata?.customerName || row.company_name || 'Non assegnata',
            waterFilter: row.metadata?.water_filter || null,
            waterFilterName: row.metadata?.water_filter_name || 'PURITY C150 iQ Quell ST',
            // Geodata from metadata
            latitude: row.metadata?.latitude || null,
            longitude: row.metadata?.longitude || null,
            location: row.metadata?.location || null
        }));

        return res.status(200).json({
            success: true,
            data: machines,
            total: machines.length
        });
    } catch (error) {
        console.error('List portal machines error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
