import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { testConnection } from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const landingPath = path.resolve(__dirname, '../../landing');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for Chrome extensions, Vercel deployments, and local dev
app.use(cors({
    origin: '*',
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
});

export default app;
