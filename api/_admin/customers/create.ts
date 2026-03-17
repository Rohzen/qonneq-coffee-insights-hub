
import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    const { name, odooUrl, odooDb } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, error: 'Company name is required' });
    }

    try {
        const result = await query(
            'INSERT INTO companies (name, odoo_url, odoo_db) VALUES ($1, $2, $3) RETURNING *',
            [name, odooUrl || null, odooDb || null]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create customer error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
