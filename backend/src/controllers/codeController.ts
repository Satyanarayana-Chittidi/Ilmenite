import { Response } from 'express';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const checkIsPlus = async (userId: string): Promise<boolean> => {
    const [rows]: any = await pool.query('SELECT tier FROM users WHERE id = ?', [userId]);
    return rows.length > 0 && rows[0].tier === 'plus';
};

/**
 * Save code for a problem slug or template
 * Enforces tier='plus' check
 */
export const saveCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { file_name, content } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!file_name || typeof content !== 'string') {
            res.status(400).json({ error: 'file_name and content are required' });
            return;
        }

        // Verify tier
        const isPlus = await checkIsPlus(userId);
        if (!isPlus) {
            res.status(403).json({ error: 'Cloud code save is only available for Plus tier users', downgrade: true });
            return;
        }

        await pool.query(
            `INSERT INTO user_codes (user_id, file_name, content)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             content = VALUES(content),
             updated_at = CURRENT_TIMESTAMP`,
            [userId, file_name, content]
        );

        res.json({ success: true, message: `Code saved for ${file_name}` });
    } catch (error: any) {
        console.error('[Code Save Error]:', error);
        res.status(500).json({ error: 'Failed to save code: ' + error.message });
    }
};

/**
 * Fetch code for a specific slug or template
 */
export const getCodeBySlug = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { slug } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const isPlus = await checkIsPlus(userId);
        if (!isPlus) {
            res.status(403).json({ error: 'Cloud code sync is only available for Plus tier users', downgrade: true });
            return;
        }

        const [rows]: any = await pool.query(
            'SELECT content, updated_at FROM user_codes WHERE user_id = ? AND file_name = ?',
            [userId, slug]
        );

        if (rows.length === 0) {
            res.status(404).json({ error: 'Code not found for slug: ' + slug });
            return;
        }

        res.json({ content: rows[0].content, updated_at: rows[0].updated_at });
    } catch (error: any) {
        console.error('[Code Fetch Error]:', error);
        res.status(500).json({ error: 'Failed to fetch code: ' + error.message });
    }
};

/**
 * Count total saved problems (excluding user_template)
 */
export const getCodeCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const [rows]: any = await pool.query(
            "SELECT COUNT(*) as count FROM user_codes WHERE user_id = ? AND file_name != 'user_template'",
            [userId]
        );

        res.json({ count: rows[0]?.count || 0 });
    } catch (error: any) {
        console.error('[Code Count Error]:', error);
        res.status(500).json({ error: 'Failed to count saved codes: ' + error.message });
    }
};

/**
 * Delete all saved codes for user
 */
export const deleteAllCodes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const isPlus = await checkIsPlus(userId);
        if (!isPlus) {
            res.status(403).json({ error: 'Cloud operations are only available for Plus tier users', downgrade: true });
            return;
        }

        await pool.query('DELETE FROM user_codes WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'All saved codes deleted' });
    } catch (error: any) {
        console.error('[Code Delete All Error]:', error);
        res.status(500).json({ error: 'Failed to delete codes: ' + error.message });
    }
};

/**
 * Sync settings and custom snippets
 */
export const syncSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { settings, snippets } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const isPlus = await checkIsPlus(userId);
        if (!isPlus) {
            res.status(403).json({ error: 'Cloud settings sync is only available for Plus tier users', downgrade: true });
            return;
        }

        const settingsJson = settings ? JSON.stringify(settings) : null;
        const snippetsJson = snippets ? JSON.stringify(snippets) : null;

        await pool.query(
            `INSERT INTO user_settings (user_id, settings, snippets)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             settings = COALESCE(VALUES(settings), settings),
             snippets = COALESCE(VALUES(snippets), snippets),
             updated_at = CURRENT_TIMESTAMP`,
            [userId, settingsJson, snippetsJson]
        );

        res.json({ success: true, message: 'Settings synced successfully' });
    } catch (error: any) {
        console.error('[Settings Sync Error]:', error);
        res.status(500).json({ error: 'Failed to sync settings: ' + error.message });
    }
};

/**
 * Fetch settings and custom snippets
 */
export const getSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const isPlus = await checkIsPlus(userId);
        if (!isPlus) {
            res.status(403).json({ error: 'Cloud settings sync is only available for Plus tier users', downgrade: true });
            return;
        }

        const [rows]: any = await pool.query(
            'SELECT settings, snippets, updated_at FROM user_settings WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0) {
            res.json({ settings: null, snippets: null });
            return;
        }

        const parseJson = (val: any) => {
            if (!val) return null;
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch { return val; }
            }
            return val;
        };

        res.json({
            settings: parseJson(rows[0].settings),
            snippets: parseJson(rows[0].snippets),
            updated_at: rows[0].updated_at
        });
    } catch (error: any) {
        console.error('[Settings Get Error]:', error);
        res.status(500).json({ error: 'Failed to fetch settings: ' + error.message });
    }
};

/**
 * Record a submission log (only when user clicks Submit)
 */
export const logSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { problem_slug, language, verdict } = req.body;

        if (!userId || !problem_slug || !language) {
            res.status(400).json({ error: 'problem_slug and language are required' });
            return;
        }

        await pool.query(
            'INSERT INTO submission_logs (user_id, problem_slug, language, verdict) VALUES (?, ?, ?, ?)',
            [userId, problem_slug, language, verdict || 'Submitted']
        );

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Submission Log Error]:', error);
        res.status(500).json({ error: 'Failed to log submission: ' + error.message });
    }
};
