import { createClient } from '@supabase/supabase-js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    console.log('==================================================');
    console.log('🔄 Starting Data Migration: Supabase -> MySQL/TiDB');
    console.log('==================================================');

    const supabaseUrl = process.env.SUPABASE_URL || 'https://cuucmjfycczkpuyitczg.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseKey) {
        console.error('❌ Error: Please provide SUPABASE_SERVICE_ROLE_KEY in your .env file to pull data from Supabase.');
        console.log('Tip: You can find your Service Role Key in Supabase Dashboard -> Project Settings -> API.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'ilmenite';
    const sslEnabled = process.env.DB_SSL === 'true';

    console.log(`🔌 Connecting to target database ${database} at ${host}:${port}...`);

    let db;
    try {
        db = await mysql.createConnection({
            host,
            port,
            user,
            password,
            database,
            ssl: sslEnabled ? { rejectUnauthorized: false } : undefined
        });
        console.log('✅ Connected to target database.');
    } catch (err: any) {
        console.error('❌ Failed to connect to MySQL/TiDB:', err.message);
        process.exit(1);
    }

    try {
        // 1. Fetch and migrate profiles
        console.log('\n[1/2] Fetching profiles from Supabase...');
        const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*');

        if (profileErr) {
            console.error('❌ Error fetching profiles:', profileErr.message);
        } else if (!profiles || profiles.length === 0) {
            console.log('ℹ️ No profiles found in Supabase.');
        } else {
            console.log(`📦 Found ${profiles.length} profiles to migrate.`);
            let migratedProfiles = 0;

            for (const profile of profiles) {
                const userId = profile.id;
                const email = profile.email || `${userId}@ilmenite.user`;
                const tier = profile.tier === 'plus' ? 'plus' : 'free';
                const avatarUrl = profile.avatar_url || null;

                // Upsert user
                await db.query(
                    `INSERT INTO users (id, email, tier, avatar_url)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE tier = VALUES(tier), avatar_url = VALUES(avatar_url)`,
                    [userId, email, tier, avatarUrl]
                );

                // Upsert settings & snippets
                const settings = profile.settings ? JSON.stringify(profile.settings) : null;
                const snippets = profile.snippets ? JSON.stringify(profile.snippets) : null;

                if (settings || snippets) {
                    await db.query(
                        `INSERT INTO user_settings (user_id, settings, snippets)
                         VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE settings = VALUES(settings), snippets = VALUES(snippets)`,
                        [userId, settings, snippets]
                    );
                }

                migratedProfiles++;
            }
            console.log(`✅ Successfully migrated ${migratedProfiles} users and their settings.`);
        }

        // 2. Fetch and migrate files
        console.log('\n[2/2] Fetching code files from Supabase...');
        const { data: files, error: fileErr } = await supabase.from('files').select('*');

        if (fileErr) {
            console.error('❌ Error fetching files:', fileErr.message);
        } else if (!files || files.length === 0) {
            console.log('ℹ️ No code files found in Supabase.');
        } else {
            console.log(`📦 Found ${files.length} code files to migrate.`);
            let migratedFiles = 0;

            for (const file of files) {
                const userId = file.user_id;
                const fileName = file.file_name;
                const content = file.content || '';

                if (!userId || !fileName) continue;

                // Ensure user exists first
                await db.query(
                    `INSERT IGNORE INTO users (id, email, tier) VALUES (?, ?, 'free')`,
                    [userId, `${userId}@ilmenite.user`]
                );

                await db.query(
                    `INSERT INTO user_codes (user_id, file_name, content)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE content = VALUES(content)`,
                    [userId, fileName, content]
                );

                migratedFiles++;
            }
            console.log(`✅ Successfully migrated ${migratedFiles} code files.`);
        }

        console.log('\n🎉 Migration completed successfully!');
    } catch (err: any) {
        console.error('❌ Migration error:', err.message);
    } finally {
        if (db) await db.end();
    }
}

runMigration();
