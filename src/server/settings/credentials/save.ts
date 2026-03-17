import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qonneq_standalone_secret_change_me';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const companyId = decoded.partner_id;
    const { provider, credentials } = req.body;

    if (!provider || !credentials) {
        return res.status(400).json({ success: false, error: 'Provider and credentials are required' });
    }

    try {
        // Upsert logic
        const existing = await query(
            'SELECT id FROM api_credentials WHERE company_id = $1 AND provider = $2',
            [companyId, provider]
        );

        if (existing.rowCount && existing.rowCount > 0) {
            await query(
                'UPDATE api_credentials SET credentials = $1, updated_at = CURRENT_TIMESTAMP WHERE company_id = $2 AND provider = $3',
                [JSON.stringify(credentials), companyId, provider]
            );
        } else {
            await query(
                'INSERT INTO api_credentials (company_id, provider, credentials) VALUES ($1, $2, $3)',
                [companyId, provider, JSON.stringify(credentials)]
            );
        }

        return res.status(200).json({ success: true, message: 'Credentials saved' });

    } catch (error) {
        console.error('Save credentials error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
