import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { query } from '../_lib/db';
import { getWeatherData } from '../_lib/weather-service';

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
    const days = parseInt(req.query.days as string) || 7;

    if (!serial) {
        return res.status(400).json({ success: false, error: 'serial is required' });
    }

    try {
        // Look up machine lat/lon from metadata JSONB
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

        const weather = await getWeatherData(decoded.partner_id, parseFloat(latitude), parseFloat(longitude), days);

        return res.status(200).json({
            success: true,
            data: {
                serial,
                provider: weather.provider,
                days,
                hourly: weather.data,
            },
        });
    } catch (error) {
        console.error('Weather hourly endpoint error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
