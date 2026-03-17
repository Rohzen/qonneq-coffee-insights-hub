import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qonneq_standalone_secret_change_me';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Verify user still exists
        const userRes = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.user_id]);
        if (userRes.rowCount === 0) {
            return res.status(401).json({ success: false, error: 'User no longer exists' });
        }

        const user = userRes.rows[0];

        // Get company info
        const companyRes = await query(
            `SELECT c.id, c.name 
       FROM companies c 
       JOIN company_users cu ON c.id = cu.company_id 
       WHERE cu.user_id = $1 LIMIT 1`,
            [user.id]
        );

        const company = companyRes.rows[0];

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                partner_id: company?.id || null,
                partner_name: company?.name || 'Unknown Company'
            }
        });

    } catch (error) {
        console.error('Verify error:', error);
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}
