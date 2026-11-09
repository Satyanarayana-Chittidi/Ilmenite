import { Request, Response } from 'express';
import { executeCode } from '../services/codeRunnerService.js';

export const runCode = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, language, testCases, timeLimit } = req.body;

        if (!code || !language || !Array.isArray(testCases)) {
            res.status(400).json({ error: 'code, language, and testCases array are required' });
            return;
        }

        const timeLimitMs = timeLimit ? parseInt(timeLimit, 10) : 3000;
        const results = await executeCode(code, language, testCases, timeLimitMs);

        res.json({ results });
    } catch (error: any) {
        console.error('[Execution Error]:', error);
        res.status(500).json({ error: 'Execution failed: ' + error.message });
    }
};
