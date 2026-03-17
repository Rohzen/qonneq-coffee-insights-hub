import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export const getDbPool = () => {
    if (pool) return pool;

    const isProduction = process.env.NODE_ENV === 'production';

    // Vercel Postgres provides POSTGRES_URL
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

    const config: PoolConfig = connectionString
        ? { connectionString, ssl: isProduction ? { rejectUnauthorized: false } : false }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5430'),
            database: process.env.DB_NAME || 'qonneq',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'openpgpwd',
        };

    pool = new Pool(config);

    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });

    return pool;
};

export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await getDbPool().query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV !== 'production') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
    }

    return res;
};
