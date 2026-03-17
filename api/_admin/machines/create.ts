
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

    const { serialNumber, provider, companyId, externalId, model } = req.body;
    if (!serialNumber || !provider || !companyId) {
        return res.status(400).json({ success: false, error: 'Serial number, provider and companyId are required' });
    }

    try {
        const result = await query(
            'INSERT INTO machines (serial_number, provider, company_id, external_id, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [serialNumber, provider, companyId, externalId || null, JSON.stringify({ model: model || 'N/D' })]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create machine error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
