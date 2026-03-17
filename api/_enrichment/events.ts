import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { query } from '../_lib/db';
import { getNearbyEvents } from '../_lib/ticketmaster';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const auth = verifyAuth(req);
    if (!auth) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const decoded = auth as any;
    const serial = req.query.serial as string;
    const radiusKm = parseFloat(req.query.radiusKm as string) || 1;
    const days = parseInt(req.query.days as string) || 7;

    if (!serial) {
        return res.status(400).json({ success: false, error: 'serial is required' });
    }

    try {
        // Look up machine coordinates from metadata JSONB
        const machineResult = await query(
            'SELECT metadata FROM machines WHERE serial_number = $1',
            [serial]
        );

        if (!machineResult.rowCount || machineResult.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Machine not found' });
        }

        const metadata = typeof machineResult.rows[0].metadata === 'string'
            ? JSON.parse(machineResult.rows[0].metadata)
            : machineResult.rows[0].metadata || {};
        const latitude = metadata.latitude;
        const longitude = metadata.longitude;
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Machine has no coordinates' });
        }

        // Check for Ticketmaster API key
        const credsResult = await query(
            "SELECT credentials FROM api_credentials WHERE company_id = $1 AND provider = 'ticketmaster'",
            [decoded.partner_id]
        );

        if (!credsResult.rowCount || credsResult.rowCount === 0) {
            return res.status(200).json({
                success: true,
                data: { events: [], configured: false },
            });
        }

        const creds = typeof credsResult.rows[0].credentials === 'string'
            ? JSON.parse(credsResult.rows[0].credentials)
            : credsResult.rows[0].credentials;

        const apiKey = creds.api_key;
        if (!apiKey) {
            return res.status(200).json({
                success: true,
                data: { events: [], configured: false },
            });
        }

        const events = await getNearbyEvents(apiKey, parseFloat(latitude), parseFloat(longitude), radiusKm, days);

        return res.status(200).json({
            success: true,
            data: {
                events: events || [],
                configured: true,
            },
        });
    } catch (error) {
        console.error('Events endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
