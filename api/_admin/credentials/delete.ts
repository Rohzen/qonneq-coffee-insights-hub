import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const auth = await verifyAuth(req);
        if (!auth || !isAdmin(auth)) return res.status(403).json({ error: 'Forbidden' });

        const { credentialId } = req.query;

        // When deleting a credential, we also clear the link from machines
        // Machines are not deleted, just unlinked from this specific API account
        await query('UPDATE machines SET credential_id = NULL WHERE credential_id = $1', [credentialId]);

        const result = await query('DELETE FROM api_credentials WHERE id = $1', [credentialId]);

        if (result.rowCount === 0) return res.status(404).json({ error: 'Credential not found' });

        return res.status(200).json({ success: true, message: 'Credential deleted successfully' });
    } catch (error) {
        console.error('Delete credential error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
