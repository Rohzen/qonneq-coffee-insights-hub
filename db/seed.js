import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5430'),
    database: process.env.DB_NAME || 'qonneq',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'openpgpwd',
});

async function seed() {
    try {
        const email = 'admin@qonneq.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create User
        const userRes = await pool.query(
            'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role RETURNING id',
            [email, hashedPassword, 'Admin User', 'admin']
        );
        const userId = userRes.rows[0].id;

        // 2. Create Company
        const companyRes = await pool.query(
            'INSERT INTO companies (name) VALUES ($1) RETURNING id',
            ['Demo Company']
        );
        const companyId = companyRes.rows[0].id;

        // 3. Link User to Company
        await pool.query(
            'INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [userId, companyId, 'admin']
        );

        // 4. Add Sample Credentials (Mocked for testing)
        await pool.query(
            'INSERT INTO api_credentials (company_id, provider, credentials) VALUES ($1, $2, $3)',
            [companyId, 'cimbali', JSON.stringify({ username: 'demo_user', password: 'demo_password' })]
        );

        await pool.query(
            'INSERT INTO api_credentials (company_id, provider, credentials) VALUES ($1, $2, $3)',
            [companyId, 'brita', JSON.stringify({ apiKey: 'demo_key', tenantId: 'demo_tenant' })]
        );

        console.log('Seed completed successfully!');
        console.log(`User: ${email} / Password: ${password}`);

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seed();
