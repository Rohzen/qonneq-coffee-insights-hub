import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import { verifyAuth, isAdmin } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = await verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    const { companyId } = req.query;

    try {
        let sql = `
            SELECT id, serial_number, metadata, provider
            FROM machines
            WHERE provider = 'brita'
        `;
        const params: any[] = [];

        if (companyId && typeof companyId === 'string') {
            sql += ' AND company_id = $1';
            params.push(companyId);
        }

        sql += ' ORDER BY serial_number';

        const result = await query(sql, params);

        const machines = (result.rows || []).map((row: any) => {
            const metadata = row.metadata || {};
            return {
                id: row.id,
                serial: row.serial_number,
                name: metadata.name || `${metadata.model || 'BRITA'} (${row.serial_number})`,
                model: metadata.model || 'N/D',
                status: metadata.status || 'offline'
            };
        });

        return res.status(200).json({
            success: true,
            data: machines
        });

    } catch (error) {
        console.error('List BRITA machines error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
