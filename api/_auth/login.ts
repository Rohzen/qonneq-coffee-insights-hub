import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qonneq_standalone_secret_change_me';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { username, password } = req.body;
    console.log(`[Login API] Attempting login for ${username}`);

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    try {
        // 1. Find user (username is email in standalone)
        const userRes = await query('SELECT * FROM users WHERE email = $1', [username]);

        if (userRes.rowCount === 0) {
            console.warn(`[Login API] User not found: ${username}`);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = userRes.rows[0];

        // 2. Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // 3. Get company info for user
        const companyRes = await query(
            `SELECT c.id, c.name 
       FROM companies c 
       JOIN company_users cu ON c.id = cu.company_id 
       WHERE cu.user_id = $1 LIMIT 1`,
            [user.id]
        );

        const company = companyRes.rows[0];

        // 4. Generate JWT
        const token = jwt.sign(
            {
                user_id: user.id,
                partner_id: company?.id || null,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                partner_id: company?.id || null,
                partner_name: company?.name || 'Unknown Company',
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
