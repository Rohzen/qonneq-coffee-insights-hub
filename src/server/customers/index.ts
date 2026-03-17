
import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../lib/db';
import { verifyAuth } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const decoded = verifyAuth(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const result = await query(
            'SELECT c.*, (SELECT COUNT(*) FROM machines m WHERE m.company_id = c.id) as machines_count FROM companies c ORDER BY c.name'
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('List customers error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
