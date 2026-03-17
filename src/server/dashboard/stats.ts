import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../lib/db';
import jwt from 'jsonwebtoken';
import { isAdmin } from '../lib/auth';

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
    const userIsAdmin = isAdmin(decoded);

    console.log('[Stats API] Request received');
    console.log('[Stats API] Decoded token:', { role: decoded.role, partner_id: decoded.partner_id, email: decoded.email });
    console.log('[Stats API] isAdmin:', userIsAdmin);

    try {
        // Query machines - admin sees all, portal user sees only their company's
        let machinesResult;
        if (userIsAdmin) {
            // Admin sees all machines across all companies
            machinesResult = await query(`SELECT m.id, m.metadata FROM machines m`);
        } else {
            // Portal user sees only their company's machines
            machinesResult = await query(
                `SELECT m.id, m.metadata FROM machines m WHERE m.company_id = $1`,
                [companyId]
            );
        }

        const totalMachines = machinesResult.rows.length;
        const connectedMachines = machinesResult.rows.filter((m: any) =>
            m.metadata?.status === 'online'
        ).length;
        const activeAlerts = machinesResult.rows.filter((m: any) =>
            m.metadata?.status === 'warning' || m.metadata?.status === 'alarm'
        ).length;

        // Get total customers count for admin
        let totalCustomers = 1;
        if (userIsAdmin) {
            const customersResult = await query('SELECT COUNT(*) FROM companies');
            totalCustomers = parseInt(customersResult.rows[0].count, 10);
        }

        return res.status(200).json({
            success: true,
            data: {
                totalCustomers,
                totalMachines,
                connectedMachines,
                activeAlerts,
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

