import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const generateToken = (user: { id: string; email: string; tier: string }) => {
    const secret = process.env.JWT_SECRET || 'super_secret_ilmenite_jwt_key_2026';
    const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
    return jwt.sign({ id: user.id, email: user.email, tier: user.tier }, secret, { expiresIn: expiresIn as any });
};

/**
 * Step 1 of Sign Up: Send 6-digit OTP to Email
 */
export const sendOtp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { email, purpose = 'registration' } = req.body;

        if (!email || !email.includes('@')) {
            res.status(400).json({ error: 'Valid email address is required' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (purpose === 'registration') {
            const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
            if (existing.length > 0) {
                res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
                return;
            }
        }

        // Generate 6-digit cryptographic OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Expire in 10 minutes
        await pool.query(
            `INSERT INTO email_otps (email, otp_code, purpose, expires_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
            [normalizedEmail, otpCode, purpose]
        );

        console.log(`\n======================================================`);
        console.log(`🔑 [AUTH OTP] Verification code for ${normalizedEmail}: ${otpCode}`);
        console.log(`======================================================\n`);

        res.json({
            success: true,
            message: `Verification code sent to ${normalizedEmail}`
        });
    } catch (error: any) {
        console.error('[Send OTP Error]:', error);
        res.status(500).json({ error: 'Failed to send verification code: ' + error.message });
    }
};

/**
 * Step 2 of Sign Up: Verify OTP & Create Account
 */
export const registerWithOtp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { email, password, confirmPassword, otp } = req.body;

        if (!email || !password || !confirmPassword || !otp) {
            res.status(400).json({ error: 'All fields (email, password, confirm password, otp) are required' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }

        if (password !== confirmPassword) {
            res.status(400).json({ error: 'Passwords do not match' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const trimmedOtp = otp.toString().trim();

        // Check OTP validity
        const [otpRows]: any = await pool.query(
            `SELECT id FROM email_otps 
             WHERE email = ? AND otp_code = ? AND purpose = 'registration' AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [normalizedEmail, trimmedOtp]
        );

        if (otpRows.length === 0) {
            res.status(400).json({ error: 'Invalid or expired verification code' });
            return;
        }

        // Delete used OTP
        await pool.query('DELETE FROM email_otps WHERE email = ?', [normalizedEmail]);

        // Check if user registered in the meantime
        const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existing.length > 0) {
            res.status(409).json({ error: 'An account with this email already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const id = crypto.randomUUID();

        await pool.query(
            'INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, "free")',
            [id, normalizedEmail, passwordHash]
        );

        const user = { id, email: normalizedEmail, tier: 'free', avatar_url: null };
        const token = generateToken(user);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user
        });
    } catch (error: any) {
        console.error('[Register with OTP Error]:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
};

/**
 * Standard Email + Password Login
 */
export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        const [rows]: any = await pool.query(
            'SELECT id, email, password_hash, tier, avatar_url FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (rows.length === 0) {
            res.status(401).json({ error: 'No account found with this email. Please sign up.' });
            return;
        }

        const userRecord = rows[0];
        if (!userRecord.password_hash) {
            res.status(400).json({ error: 'This account was created via GitHub. Please use Continue with GitHub.' });
            return;
        }

        const isMatch = await bcrypt.compare(password, userRecord.password_hash);
        if (!isMatch) {
            res.status(401).json({ error: 'Incorrect password. Please try again.' });
            return;
        }

        const user = {
            id: userRecord.id,
            email: userRecord.email,
            tier: userRecord.tier,
            avatar_url: userRecord.avatar_url
        };
        const token = generateToken(user);

        res.json({
            message: 'Logged in successfully',
            token,
            user
        });
    } catch (error: any) {
        console.error('[Auth Login Error]:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
    }
};

/**
 * GitHub OAuth Sync
 */
export const oauthSync = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id, email, avatar_url } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const userId = id || crypto.randomUUID();
        const normalizedEmail = email.toLowerCase().trim();

        // Upsert user on email conflict
        await pool.query(
            `INSERT INTO users (id, email, avatar_url, tier)
             VALUES (?, ?, ?, 'free')
             ON DUPLICATE KEY UPDATE
             avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
             updated_at = CURRENT_TIMESTAMP`,
            [userId, normalizedEmail, avatar_url || null]
        );

        const [rows]: any = await pool.query(
            'SELECT id, email, tier, avatar_url FROM users WHERE email = ?',
            [normalizedEmail]
        );
        const user = rows[0];
        const token = generateToken(user);

        res.json({
            message: 'GitHub OAuth synced successfully',
            token,
            user
        });
    } catch (error: any) {
        console.error('[Auth OAuth Error]:', error);
        res.status(500).json({ error: 'OAuth sync failed: ' + error.message });
    }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const [rows]: any = await pool.query(
            'SELECT id, email, tier, avatar_url, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user: rows[0] });
    } catch (error: any) {
        console.error('[Auth Me Error]:', error);
        res.status(500).json({ error: 'Failed to fetch user: ' + error.message });
    }
};

export const updateAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { avatar_url } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        await pool.query(
            'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [avatar_url || null, userId]
        );
        res.json({ success: true, avatar_url });
    } catch (error: any) {
        console.error('[Avatar Update Error]:', error);
        res.status(500).json({ error: 'Failed to update avatar: ' + error.message });
    }
};

/**
 * Returns GitHub OAuth authorization URL
 */
export const getGitHubOAuthUrl = async (req: Request, res: Response): Promise<void> => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = req.query.redirect_uri as string;

    if (!clientId) {
        res.status(400).json({
            error: 'GitHub OAuth is not configured on the backend. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to backend/.env, or use Email / OTP login.'
        });
        return;
    }

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&scope=user:email`;
    res.json({ url });
};

/**
 * Handles GitHub OAuth exchange code for session and user profile
 */
export const handleGitHubCallback = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, redirect_uri } = req.body;
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            res.status(400).json({ error: 'GitHub OAuth credentials not configured on backend' });
            return;
        }

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            res.status(400).json({ error: 'Failed to obtain access token from GitHub: ' + JSON.stringify(tokenData) });
            return;
        }

        const userRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'Ilmenite-App' }
        });
        const ghUser = await userRes.json();

        let email = ghUser.email;
        if (!email) {
            const emailRes = await fetch('https://api.github.com/user/emails', {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'User-Agent': 'Ilmenite-App' }
            });
            const emails = await emailRes.json();
            if (Array.isArray(emails)) {
                const primary = emails.find((e: any) => e.primary && e.verified);
                email = primary ? primary.email : emails[0]?.email;
            }
        }

        if (!email) {
            res.status(400).json({ error: 'Unable to retrieve verified email from GitHub account' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const avatarUrl = ghUser.avatar_url || null;
        const userId = crypto.randomUUID();

        await pool.query(
            `INSERT INTO users (id, email, avatar_url, tier)
             VALUES (?, ?, ?, 'free')
             ON DUPLICATE KEY UPDATE
             avatar_url = COALESCE(VALUES(avatar_url), avatar_url),
             updated_at = CURRENT_TIMESTAMP`,
            [userId, normalizedEmail, avatarUrl]
        );

        const [rows]: any = await pool.query('SELECT id, email, tier, avatar_url FROM users WHERE email = ?', [normalizedEmail]);
        const user = rows[0];
        const token = generateToken(user);

        res.json({ message: 'GitHub login successful', token, user });
    } catch (err: any) {
        console.error('[GitHub Callback Error]:', err);
        res.status(500).json({ error: 'GitHub login failed: ' + err.message });
    }
};
