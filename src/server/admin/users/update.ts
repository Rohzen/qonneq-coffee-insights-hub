import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../lib/db';
import { verifyAuth, isAdmin } from '../../lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST' && req.method !== 'PUT') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const decoded = await verifyAuth(req);
    if (!decoded || !isAdmin(decoded)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    const { id, name, email, role, companyId, password } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    try {
        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name) {
            updates.push(`name = $${paramIndex}`);
            values.push(name);
            paramIndex++;
        }
        if (email) {
            updates.push(`email = $${paramIndex}`);
            values.push(email);
            paramIndex++;
        }
        if (role) {
            updates.push(`role = $${paramIndex}`);
            values.push(role);
            paramIndex++;
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(`password_hash = $${paramIndex}`);
            values.push(hashedPassword);
            paramIndex++;
        }

        if (updates.length > 0) {
            updates.push(`updated_at = NOW()`);
            values.push(id);
            const queryText = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
            await query(queryText, values);
        }

        // Handle company association via company_users join table
        if (companyId) {
            if (companyId === 'none') {
                await query('DELETE FROM company_users WHERE user_id = $1', [id]);
            } else {
                const existing = await query('SELECT id FROM company_users WHERE user_id = $1', [id]);
                if (existing.rowCount && existing.rowCount > 0) {
                    await query('UPDATE company_users SET company_id = $1 WHERE user_id = $2', [companyId, id]);
                } else {
                    await query('INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3)', [id, companyId, 'admin']);
                }
            }
        }

        if (updates.length === 0 && !companyId) {
            return res.status(400).json({ success: false, error: 'No fields to update' });
        }

        return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
