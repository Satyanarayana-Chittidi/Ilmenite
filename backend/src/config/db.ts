import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const sslEnabled = process.env.DB_SSL === 'true';

export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: port,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ilmenite',
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`[Database] Connected successfully to MySQL/TiDB at ${process.env.DB_HOST || 'localhost'}:${port}`);
        connection.release();
        return true;
    } catch (error: any) {
        console.error('[Database] Connection failed:', error.message);
        return false;
    }
};
