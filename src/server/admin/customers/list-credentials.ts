import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import { verifyAuth, isAdmin } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const auth = await verifyAuth(req);
        if (!auth || !isAdmin(auth)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { customerId } = req.query;

        const result = await query(
            'SELECT * FROM api_credentials WHERE company_id = $1 ORDER BY created_at DESC',
            [customerId]
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('List Credentials Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
