import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const getRazorpayClient = () => {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_live_TOS2YlZMXnIFB8';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!key_secret) {
        return null;
    }

    return new Razorpay({ key_id, key_secret });
};

/**
 * Creates a Razorpay subscription for the user
 * Matches the exact response shape expected by the landing page!
 */
export const createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        let uid = req.body.uid || (req as AuthenticatedRequest).user?.id;
        const email = req.body.email;
        let normalizedEmail = email ? email.toLowerCase().trim() : null;

        // If uid looks like an email and email was not explicitly provided, normalize
        if (!normalizedEmail && typeof uid === 'string' && uid.includes('@')) {
            normalizedEmail = uid.toLowerCase().trim();
            uid = null;
        }

        // 1. Check if user already exists by email
        if (normalizedEmail) {
            const [existingByEmail]: any = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
            if (existingByEmail.length > 0) {
                uid = existingByEmail[0].id;
            }
        }

        // 2. Check if user exists by uid, or create record
        if (uid) {
            const [existingById]: any = await pool.query('SELECT id, email FROM users WHERE id = ?', [uid]);
            if (existingById.length === 0) {
                const targetEmail = normalizedEmail || `${uid}@ilmenite.user`;
                const [emailConflict]: any = await pool.query('SELECT id FROM users WHERE email = ?', [targetEmail]);
                if (emailConflict.length > 0) {
                    uid = emailConflict[0].id;
                } else {
                    await pool.query('INSERT INTO users (id, email, tier) VALUES (?, ?, "free")', [uid, targetEmail]);
                }
            } else if (normalizedEmail && existingById[0].email !== normalizedEmail) {
                const [conflict]: any = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [normalizedEmail, uid]);
                if (conflict.length > 0) {
                    uid = conflict[0].id;
                } else {
                    await pool.query('UPDATE users SET email = ? WHERE id = ?', [normalizedEmail, uid]);
                }
            }
        } else if (normalizedEmail) {
            uid = crypto.randomUUID();
            await pool.query('INSERT INTO users (id, email, tier) VALUES (?, ?, "free")', [uid, normalizedEmail]);
        }

        if (!uid) {
            res.status(400).json({ error: 'User ID (uid) or email is required' });
            return;
        }

        // 3. Absolute guarantee: verify user row exists in `users` table before touching subscriptions
        const [userVerification]: any = await pool.query('SELECT id FROM users WHERE id = ?', [uid]);
        if (userVerification.length === 0) {
            await pool.query('INSERT INTO users (id, email, tier) VALUES (?, ?, "free")', [
                uid,
                normalizedEmail || `${uid}@ilmenite.user`
            ]);
        }

        const razorpay = getRazorpayClient();
        const planId = process.env.RAZORPAY_PLAN_ID;

        // If Razorpay secret isn't configured yet, provide mock response for local dev
        if (!razorpay || !planId) {
            console.warn('[Payment] Razorpay credentials not fully set in .env. Returning local dev mock subscription.');
            const mockSubId = `sub_mock_${crypto.randomBytes(8).toString('hex')}`;

            await pool.query(
                `INSERT INTO subscriptions (user_id, razorpay_subscription_id, status)
                 VALUES (?, ?, 'created')
                 ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
                [uid, mockSubId]
            );

            res.json({
                id: mockSubId,
                subscription_id: mockSubId,
                short_url: null,
                isMock: true
            });
            return;
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            total_count: 12,
            customer_notify: 1,
            notes: { userId: uid }
        });

        await pool.query(
            `INSERT INTO subscriptions (user_id, razorpay_subscription_id, plan_id, status)
             VALUES (?, ?, ?, 'created')
             ON DUPLICATE KEY UPDATE status = 'created', updated_at = CURRENT_TIMESTAMP`,
            [uid, subscription.id, planId]
        );

        res.json({
            id: subscription.id,
            subscription_id: subscription.id,
            short_url: subscription.short_url,
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_Ty5kKoihqqxX9T'
        });
    } catch (error: any) {
        console.error('[Payment Create Sub Error]:', error);
        res.status(500).json({ error: 'Failed to create subscription: ' + (error.error?.description || error.message) });
    }
};

/**
 * Verifies Razorpay payment signature & immediately activates Plus tier
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uid, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

        if (!uid || !razorpay_payment_id || !razorpay_subscription_id) {
            res.status(400).json({ error: 'Missing payment verification parameters' });
            return;
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;

        // Validate HMAC signature if secret is present
        if (secret && razorpay_signature) {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                res.status(400).json({ error: 'Invalid payment signature' });
                return;
            }
        }

        // Activate Plus tier for user (supporting both UUID and email identifiers)
        if (uid.includes('@')) {
            await pool.query('UPDATE users SET tier = "plus" WHERE email = ?', [uid.toLowerCase().trim()]);
        } else {
            await pool.query('UPDATE users SET tier = "plus" WHERE id = ?', [uid]);
        }

        // Also ensure user_id from the subscriptions table row is updated
        const [subRows]: any = await pool.query(
            'SELECT user_id FROM subscriptions WHERE razorpay_subscription_id = ?',
            [razorpay_subscription_id]
        );
        if (subRows.length > 0 && subRows[0].user_id) {
            await pool.query('UPDATE users SET tier = "plus" WHERE id = ?', [subRows[0].user_id]);
        }

        await pool.query(
            `UPDATE subscriptions 
             SET status = 'active', razorpay_payment_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE razorpay_subscription_id = ?`,
            [razorpay_payment_id, razorpay_subscription_id]
        );

        console.log(`[Payment] User ${uid} elevated to Plus tier successfully.`);
        res.json({ success: true, tier: 'plus' });
    } catch (error: any) {
        console.error('[Payment Verify Error]:', error);
        res.status(500).json({ error: 'Failed to verify payment: ' + error.message });
    }
};

/**
 * Razorpay Webhook listener for background subscription events
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'] as string;

        if (webhookSecret && signature) {
            const bodyStr = (req as any).rawBody || JSON.stringify(req.body);
            try {
                const isValid = Razorpay.validateWebhookSignature(bodyStr, signature, webhookSecret);
                if (!isValid) {
                    console.warn('[Payment Webhook] Signature verification failed');
                    res.status(400).json({ error: 'Invalid webhook signature' });
                    return;
                }
            } catch (err: any) {
                console.warn('[Payment Webhook] Signature error:', err.message);
                res.status(400).json({ error: 'Webhook signature validation error' });
                return;
            }
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`[Payment Webhook] Received Razorpay event: ${event}`);

        if (event === 'subscription.activated' || event === 'subscription.charged') {
            const subEntity = payload.subscription.entity;
            const subId = subEntity.id;
            let userId = subEntity.notes?.userId;

            // Fallback: look up user_id from database if not in notes
            if (!userId) {
                const [existingSub]: any = await pool.query('SELECT user_id FROM subscriptions WHERE razorpay_subscription_id = ?', [subId]);
                if (existingSub.length > 0) {
                    userId = existingSub[0].user_id;
                }
            }

            if (userId) {
                if (userId.includes('@')) {
                    await pool.query('UPDATE users SET tier = "plus" WHERE email = ?', [userId.toLowerCase().trim()]);
                } else {
                    await pool.query('UPDATE users SET tier = "plus" WHERE id = ?', [userId]);
                }
            }

            await pool.query(
                'UPDATE subscriptions SET status = "active", updated_at = CURRENT_TIMESTAMP WHERE razorpay_subscription_id = ?',
                [subId]
            );
        } else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
            const subEntity = payload.subscription.entity;
            const subId = subEntity.id;
            let userId = subEntity.notes?.userId;

            if (!userId) {
                const [existingSub]: any = await pool.query('SELECT user_id FROM subscriptions WHERE razorpay_subscription_id = ?', [subId]);
                if (existingSub.length > 0) {
                    userId = existingSub[0].user_id;
                }
            }

            if (userId) {
                if (userId.includes('@')) {
                    await pool.query('UPDATE users SET tier = "free" WHERE email = ?', [userId.toLowerCase().trim()]);
                } else {
                    await pool.query('UPDATE users SET tier = "free" WHERE id = ?', [userId]);
                }
            }

            await pool.query(
                'UPDATE subscriptions SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE razorpay_subscription_id = ?',
                [subId]
            );
        }

        res.json({ status: 'ok' });
    } catch (error: any) {
        console.error('[Payment Webhook Error]:', error);
        res.status(500).json({ error: 'Webhook processing failed: ' + error.message });
    }
};

/**
 * Check user subscription status by userId or email
 */
export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const queryEmail = (req.query.email as string)?.trim();
        const queryUserId = (req.query.userId as string)?.trim();
        const rawParam = req.params.userId as string | undefined;
        const paramUserId = (rawParam && rawParam !== 'check' && rawParam !== 'undefined') ? String(rawParam).trim() : null;
        const identifier = queryEmail || queryUserId || paramUserId || req.user?.id;
        
        if (!identifier) {
            res.status(400).json({ error: 'userId or email required', tier: 'free' });
            return;
        }

        let userRows: any[] = [];
        if (identifier.includes('@')) {
            const [rows]: any = await pool.query(
                'SELECT id, email, tier, avatar_url FROM users WHERE email = ?',
                [identifier.toLowerCase().trim()]
            );
            userRows = rows;
        } else {
            const [rows]: any = await pool.query(
                'SELECT id, email, tier, avatar_url FROM users WHERE id = ?',
                [identifier]
            );
            userRows = rows;
            if (userRows.length === 0 && queryEmail) {
                const [emailRows]: any = await pool.query(
                    'SELECT id, email, tier, avatar_url FROM users WHERE email = ?',
                    [queryEmail.toLowerCase().trim()]
                );
                userRows = emailRows;
            }
        }

        if (userRows.length === 0) {
            res.json({
                user: {
                    id: identifier.includes('@') ? null : identifier,
                    email: identifier.includes('@') ? identifier : null,
                    avatar_url: null
                },
                tier: 'free',
                subscription: null
            });
            return;
        }

        const user = userRows[0];
        const [subRows]: any = await pool.query(
            'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [user.id]
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                avatar_url: user.avatar_url
            },
            tier: user.tier || 'free',
            subscription: subRows[0] || null
        });
    } catch (error: any) {
        console.error('[Payment Status Error]:', error);
        res.status(500).json({ error: 'Failed to fetch status: ' + error.message });
    }
};
