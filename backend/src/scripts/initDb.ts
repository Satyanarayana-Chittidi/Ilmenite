import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
    const dbName = process.env.DB_NAME || 'ilmenite';
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const sslEnabled = process.env.DB_SSL === 'true';

    console.log(`[InitDB] Connecting to MySQL server at ${host}:${port} as ${user}...`);

    let rootConnection;
    try {
        rootConnection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            ssl: sslEnabled ? {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            } : undefined,
            multipleStatements: true
        });

        console.log(`[InitDB] Ensuring database '${dbName}' exists...`);
        await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await rootConnection.query(`USE \`${dbName}\`;`);

        const schemaPath = path.join(__dirname, '../migrations/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('[InitDB] Executing schema.sql statements...');
        // Split statements by semicolon
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            await rootConnection.query(statement);
        }

        console.log('[InitDB] Tables successfully created / verified in database:', dbName);
    } catch (err: any) {
        console.error('[InitDB] Error initializing database:', err.message);
        process.exit(1);
    } finally {
        if (rootConnection) {
            await rootConnection.end();
        }
    }
}

initDatabase();
