import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../lib/db';
import jwt from 'jsonwebtoken';
import { getCimbaliMachines } from '../lib/cimbali';
import { getBritaResources } from '../lib/brita';

const JWT_SECRET = process.env.JWT_SECRET || 'qonneq_standalone_secret_change_me';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // 1. Verify Authentication
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
    if (!companyId) {
        return res.status(400).json({ success: false, error: 'User is not associated with a company' });
    }

    try {
        // 2. Fetch API Credentials for this company
        const credsRes = await query(
            'SELECT provider, credentials FROM api_credentials WHERE company_id = $1',
            [companyId]
        );

        const machines: any[] = [];
        const fetchPromises: Promise<void>[] = [];

        // 3. Kick off fetches for each configured provider
        for (const row of credsRes.rows) {
            if (row.provider === 'cimbali') {
                fetchPromises.push(
                    getCimbaliMachines(row.credentials).then(results => {
                        machines.push(...results);
                    })
                );
            } else if (row.provider === 'brita') {
                fetchPromises.push(
                    getBritaResources(row.credentials).then(result => {
                        if (result && Array.isArray(result.items)) {
                            machines.push(...result.items);
                        }
                    })
                );
            }
        }

        // 4. Wait for all providers to respond
        await Promise.all(fetchPromises);

        return res.status(200).json({
            success: true,
            data: machines,
            total: machines.length
        });

    } catch (error) {
        console.error('Fetch machines error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
