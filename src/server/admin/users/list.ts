import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import { verifyAuth, isAdmin } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = await verifyAuth(req);
    console.log('[Admin List Users] Decoded token:', decoded);
    if (!decoded || !isAdmin(decoded)) {
        console.error('[Admin List Users] Forbidden', { decoded });
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    try {
        // Query users with their company assignments
        const result = await query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                u.created_at,
                cu.company_id,
                c.name as company_name
            FROM users u
            LEFT JOIN company_users cu ON u.id = cu.user_id
            LEFT JOIN companies c ON cu.company_id = c.id
            ORDER BY u.created_at DESC
        `);

        const users = result.rows.map(row => ({
            ...row,
            company: row.company_name || 'Non assegnato'
        }));

        return res.status(200).json({
            success: true,
            data: users,
            total: users.length
        });
    } catch (error) {
        console.error('List users error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
