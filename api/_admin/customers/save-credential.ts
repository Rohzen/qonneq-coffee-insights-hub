import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';

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

        const { customerId } = req.query;
        const { provider, name, credentials } = req.body;

        if (!customerId || !provider || !credentials) {
            return res.status(400).json({ error: 'Customer ID, provider and credentials are required' });
        }

        // We allow multiple credentials per provider, distinguished by name
        // Check if a credential with the same name already exists for this provider/customer
        const existing = await query(
            'SELECT id FROM api_credentials WHERE company_id = $1 AND provider = $2 AND name = $3',
            [customerId, provider, name]
        );

        if (existing.rowCount && existing.rowCount > 0) {
            await query(
                'UPDATE api_credentials SET credentials = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [JSON.stringify(credentials), existing.rows[0].id]
            );
        } else {
            await query(
                'INSERT INTO api_credentials (company_id, provider, name, credentials) VALUES ($1, $2, $3, $4)',
                [customerId, provider, name, JSON.stringify(credentials)]
            );
        }

        return res.status(200).json({ success: true, message: 'Credential saved successfully' });

    } catch (error) {
        console.error('Save customer credential error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
