import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { verifyAuth, isAdmin } from '../../_lib/auth';
import { getBritaResources, BritaCredentials } from '../../_lib/brita';
import { getCimbaliMachines, CimbaliCredentials } from '../../_lib/cimbali';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const auth = await verifyAuth(req);
        if (!auth || !isAdmin(auth)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { credentialId } = req.query;

        // 1. Get credential details
        const credRes = await query(
            'SELECT * FROM api_credentials WHERE id = $1',
            [credentialId]
        );

        if (credRes.rowCount === 0) {
            return res.status(404).json({ error: 'Credential not found' });
        }

        const credential = credRes.rows[0];

        const provider = credential.provider;

        try {
            if (provider === 'brita') {
                const britaCreds: BritaCredentials = {
                    apiKey: credential.credentials?.apiKey || credential.credentials?.api_key,
                    tenantId: credential.credentials?.tenantId || credential.credentials?.tenant_id
                };
                await getBritaResources(britaCreds, 1);
            } else if (provider === 'cimbali') {
                const cimbaliCreds: CimbaliCredentials = {
                    username: credential.credentials?.username || credential.username,
                    password: credential.credentials?.password || credential.password
                };
                await getCimbaliMachines(cimbaliCreds, 0, 1);
            } else {
                return res.status(400).json({ success: false, message: 'Provider non supportato' });
            }

            return res.status(200).json({
                success: true,
                message: `Connessione a ${provider} riuscita con successo`
            });
        } catch (apiError) {
            console.error(`[Test Connection] Errore API ${provider}:`, apiError);
            return res.status(200).json({
                success: false,
                message: `Connessione a ${provider} fallita: ${apiError instanceof Error ? apiError.message : 'Errore sconosciuto'}`
            });
        }

    } catch (error) {
        console.error('Test Connection Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
