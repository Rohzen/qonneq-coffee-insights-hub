import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import { verifyAuth, isAdmin } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const auth = await verifyAuth(req);
        if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });

        const { customerId } = req.query;

        // Start transaction or sequential delete due to foreign keys
        // Machines are linked to credentials, and credentials to company
        // If ON DELETE CASCADE is not set, we do it manually

        // 1. Delete machines linked to this company
        await query('DELETE FROM machines WHERE company_id = $1', [customerId]);

        // 2. Delete credentials linked to this company
        await query('DELETE FROM api_credentials WHERE company_id = $1', [customerId]);

        // 3. Delete company
        const result = await query('DELETE FROM companies WHERE id = $1', [customerId]);

        if (result.rowCount === 0) return res.status(404).json({ error: 'Customer not found' });

        return res.status(200).json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
