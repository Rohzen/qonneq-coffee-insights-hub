
import { query } from './lib/db';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDb() {
    console.log('🚀 Initializing Database...');

    try {
        // 1. Read and run schema.sql
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema (splitting by semicolon for basic execution)
        const statements = schema.split(';').filter(s => s.trim());
        for (const statement of statements) {
            await query(statement);
        }
        console.log('✅ Base schema applied.');

        // 2. Run Migrations
        console.log('🛠 Running Migrations...');

        // Users Table
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'portal\'');

        // Companies Table
        await query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS odoo_url VARCHAR(255)');
        await query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS odoo_db VARCHAR(255)');

        // Credentials Table
        await query('ALTER TABLE api_credentials ADD COLUMN IF NOT EXISTS name VARCHAR(255)');
        await query('ALTER TABLE api_credentials ADD COLUMN IF NOT EXISTS description TEXT');

        // Machines Table - Link to credentials
        await query('ALTER TABLE machines ADD COLUMN IF NOT EXISTS credential_id UUID REFERENCES api_credentials(id) ON DELETE SET NULL');

        console.log('✅ Migrations applied successfully.');

        // 3. Check if admin exists
        const adminCheck = await query("SELECT id FROM users WHERE email = 'admin@qonneq.com'");

        if (adminCheck.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);

            // Create Admin User
            const userRes = await query(
                "INSERT INTO users (email, password_hash, name, role) VALUES ('admin@qonneq.com', $1, 'System Admin', 'admin') RETURNING id",
                [hashedPassword]
            );
            const userId = userRes.rows[0].id;

            // Create Default Company
            const companyRes = await query(
                "INSERT INTO companies (name) VALUES ('System') RETURNING id"
            );
            const companyId = companyRes.rows[0].id;

            // Link Admin to Company
            await query(
                "INSERT INTO company_users (user_id, company_id, role) VALUES ($1, $2, 'admin')",
                [userId, companyId]
            );

            console.log('👤 Default Admin created (admin@qonneq.com / admin123)');
        } else {
            // Ensure existing admin has the role
            await query("UPDATE users SET role = 'admin' WHERE email = 'admin@qonneq.com'");
            console.log('ℹ️ Admin user verified.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Database Initialization Failed:', error);
        process.exit(1);
    }
}

initDb();
