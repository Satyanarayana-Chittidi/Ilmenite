import { Router } from 'express';
import {
    sendOtp,
    registerWithOtp,
    login,
    oauthSync,
    getMe,
    updateAvatar,
    getGitHubOAuthUrl,
    handleGitHubCallback
} from '../controllers/authController.js';
import {
    saveCode,
    getCodeBySlug,
    getCodeCount,
    deleteAllCodes,
    syncSettings,
    getSettings
} from '../controllers/codeController.js';
import { runCode } from '../controllers/executionController.js';
import {
    createSubscription,
    verifyPayment,
    handleWebhook,
    getSubscriptionStatus
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Ilmenite Backend', timestamp: new Date().toISOString() });
});

// --- Auth Routes ---
router.post('/auth/send-otp', sendOtp);
router.post('/auth/register', registerWithOtp);
router.post('/auth/login', login);
router.post('/auth/oauth-sync', oauthSync);
router.get('/auth/github/url', getGitHubOAuthUrl);
router.post('/auth/github/callback', handleGitHubCallback);
router.post('/auth/avatar', authenticateToken, updateAvatar);
router.get('/auth/me', authenticateToken, getMe);

// --- Code Execution Route ---
router.post('/execute', runCode);

// --- Code & Settings Sync Routes ---
router.post('/code/save', authenticateToken, saveCode);
router.get('/code/count', authenticateToken, getCodeCount);
router.delete('/code/all', authenticateToken, deleteAllCodes);
router.get('/code/:slug', authenticateToken, getCodeBySlug);
router.post('/settings/sync', authenticateToken, syncSettings);
router.get('/settings', authenticateToken, getSettings);

// --- Payment & Subscription Routes ---
router.post('/payment/create-subscription', createSubscription);
router.post('/payment/verify', verifyPayment);
router.post('/payment/webhook', handleWebhook);
router.get('/payment/status/:userId', getSubscriptionStatus);

export default router;
