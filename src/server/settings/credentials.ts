import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../lib/db';
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

    try {
        const credsRes = await query(
            'SELECT provider, credentials FROM api_credentials WHERE company_id = $1',
            [companyId]
        );

        return res.status(200).json({
            success: true,
            data: credsRes.rows
        });

    } catch (error) {
        console.error('Fetch settings error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
