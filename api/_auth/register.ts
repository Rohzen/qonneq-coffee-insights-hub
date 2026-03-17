import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { email, password, name, companyName } = req.body;

    if (!email || !password || !name || !companyName) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        // Check if user exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing && existing.rowCount && existing.rowCount > 0) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transactional insert (simplistic without actual transaction client for now)
        // 1. Create User
        const userRes = await query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
            [email, hashedPassword, name]
        );
        const userId = userRes.rows[0].id;

        // 2. Create Company
        const companyRes = await query(
            'INSERT INTO companies (name) VALUES ($1) RETURNING id',
            [companyName]
        );
        const companyId = companyRes.rows[0].id;

        // 3. Link them
        await query(
            'INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3)',
            [userId, companyId, 'admin']
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: { id: userId, email, name }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
