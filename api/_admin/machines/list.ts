import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = await verifyAuth(req);
    console.log('[Admin List Machines] Decoded token:', decoded);
    if (!decoded || !isAdmin(decoded)) {
        console.error('[Admin List Machines] Forbidden', { decoded });
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    try {
        // Query machines with company name join
        const result = await query(`
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
            ORDER BY m.created_at DESC
        `);

        // Extract model and status from metadata JSONB
        // Prioritize customerName from Cimbali API over local company_name
        const machines = result.rows.map(row => ({
            ...row,
            model: row.metadata?.model || 'N/D',
            family: row.metadata?.family || row.metadata?.model || 'N/D',
            status: row.metadata?.status || 'offline',
            name: row.metadata?.name || row.serial_number,
            brand: row.metadata?.brand || row.provider?.toUpperCase() || 'N/D',
            // Customer info - prioritize Cimbali data
            customerName: row.metadata?.customerName || null,
            customerGroup: row.metadata?.customerGroup || null,
            customer_name: row.metadata?.customerName || row.customer_name || 'Non assegnata',
            water_filter_name: row.metadata?.water_filter_name || 'PURITY C150 iQ Quell ST',
            lastConnection: row.metadata?.lastSync || row.updated_at
        }));

        return res.status(200).json({
            success: true,
            data: machines,
            total: machines.length
        });
    } catch (error) {
        console.error('List machines error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
