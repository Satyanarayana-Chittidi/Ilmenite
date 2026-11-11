import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { testConnection } from './config/db.js';
import { testEmailConnection } from './services/emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const landingPath = path.resolve(__dirname, '../../landing');

const app = express();
const PORT = process.env.PORT || 5000;

// Secure CORS: strictly allow Chrome Extensions, official domains, webhooks, and local dev
const allowedOrigins = [
    'https://ilmenite.vercel.app',
    'https://satyanarayana-chittidi.github.io',
    'https://ilmenite.app'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, mobile, curl, Razorpay webhooks)
        if (!origin) return callback(null, true);

        // Allow all Chrome extension origins
        if (origin.startsWith('chrome-extension://')) return callback(null, true);

        // Allow local development
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return callback(null, true);

        // Allow official production landing pages
        if (allowedOrigins.some(d => origin === d || origin.endsWith('.ilmenite.app') || origin.endsWith('.github.io'))) {
            return callback(null, true);
        }

        return callback(new Error('Cross-Origin Request Blocked by Ilmenite CORS Policy'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString('utf8');
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve landing page statically
app.use(express.static(landingPath));

// Lightweight health check & root endpoints for uptime monitoring (e.g. UptimeRobot)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Ilmenite Backend', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'Ilmenite Backend', message: 'API is running' });
});

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

const server = app.listen(PORT, async () => {
    console.log(`===============================================`);
    console.log(`🚀 Ilmenite Backend running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);

    // Test DB connection on startup
    await testConnection();

    // Test Email connection on startup
    testEmailConnection().catch(() => {});
});

export default app;
