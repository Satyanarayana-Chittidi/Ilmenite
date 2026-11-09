import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    email: string;
    tier: 'free' | 'plus';
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    const secret = process.env.JWT_SECRET || 'super_secret_ilmenite_jwt_key_2026';

    try {
        const decoded = jwt.verify(token, secret) as AuthUser;
        req.user = decoded;
        next();
    } catch (err: any) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
};

export const optionalAuthenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        next();
        return;
    }

    const secret = process.env.JWT_SECRET || 'super_secret_ilmenite_jwt_key_2026';
    try {
        const decoded = jwt.verify(token, secret) as AuthUser;
        req.user = decoded;
    } catch {
        // Silently continue if invalid optional token
    }
    next();
};
