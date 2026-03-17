
import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import { verifyAuth, isAdmin } from '../../lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    const { name, email, password, companyId, role } = req.body;
    if (!email || !password || !companyId) {
        return res.status(400).json({ success: false, error: 'Email, password and companyId are required' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        // 1. Create User
        const userResult = await query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name || null, email, passwordHash, role || 'portal']
        );
        const userId = userResult.rows[0].id;

        // 2. Link to Company
        await query(
            'INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3)',
            [userId, companyId, 'admin'] // Defaulting to company admin in company_users
        );

        return res.status(201).json({
            success: true,
            data: userResult.rows[0]
        });
    } catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
