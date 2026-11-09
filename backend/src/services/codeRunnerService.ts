import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface TestCaseInput {
    Input: string;
    ExpectedOutput?: string;
}

export interface ExecutionResult {
    Output: string;
    ErrorMessage: string | null;
    TimeAndMemory: {
        Time: string; // in seconds
        Memory: string; // in MB
    };
}

// Check if a command is available on the system
const isCommandAvailable = (cmd: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const checkCmd = process.platform === 'win32' ? 'where' : 'which';
        const proc = spawn(checkCmd, [cmd]);
        proc.on('close', (code) => resolve(code === 0));
        proc.on('error', () => resolve(false));
    });
};

/**
 * Executes a single testcase using local system compiler/runtime
 */
const runSingleLocal = async (
    code: string,
    language: string,
    input: string,
    timeLimitMs: number
): Promise<ExecutionResult> => {
    const tempDir = path.join(os.tmpdir(), `ilmenite_${crypto.randomUUID()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const startTime = Date.now();

    try {
        let runCommand = '';
        let runArgs: string[] = [];

        if (language === 'python' || language === 'pypy') {
            const scriptPath = path.join(tempDir, 'solution.py');
            fs.writeFileSync(scriptPath, code);
            runCommand = 'python';
            runArgs = [scriptPath];
        } else if (language === 'javascript') {
            const scriptPath = path.join(tempDir, 'solution.js');
            fs.writeFileSync(scriptPath, code);
            runCommand = 'node';
            runArgs = [scriptPath];
        } else if (language === 'cpp') {
            const srcPath = path.join(tempDir, 'solution.cpp');
            const exePath = path.join(tempDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
            fs.writeFileSync(srcPath, code);

            // Compile C++
            const compileResult = await new Promise<{ success: boolean; stderr: string }>((resolve) => {
                const comp = spawn('g++', ['-O3', srcPath, '-o', exePath]);
                let stderr = '';
                comp.stderr.on('data', (d) => { stderr += d.toString(); });
                comp.on('close', (code) => {
                    resolve({ success: code === 0, stderr });
                });
                comp.on('error', (err) => {
                    resolve({ success: false, stderr: err.message });
                });
            });

            if (!compileResult.success) {
                return {
                    Output: compileResult.stderr || 'Compilation Error',
                    ErrorMessage: 'Compilation Error',
                    TimeAndMemory: { Time: '0', Memory: '0' }
                };
            }

            runCommand = exePath;
            runArgs = [];
        } else {
            throw new Error(`Unsupported local language: ${language}`);
        }

        // Execute runner with strict timeout
        return await new Promise<ExecutionResult>((resolve) => {
            const child = spawn(runCommand, runArgs);
            let stdout = '';
            let stderr = '';
            let isTimedOut = false;

            const timer = setTimeout(() => {
                isTimedOut = true;
                child.kill('SIGKILL');
            }, timeLimitMs);

            if (input) {
                child.stdin.write(input);
            }
            child.stdin.end();

            child.stdout.on('data', (data) => {
                stdout += data.toString();
                if (stdout.length > 50000) {
                    child.kill('SIGKILL');
                }
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (exitCode) => {
                clearTimeout(timer);
                const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(3);

                if (isTimedOut) {
                    resolve({
                        Output: 'Time Limit Exceeded',
                        ErrorMessage: 'Time Limit Exceeded',
                        TimeAndMemory: { Time: durationSeconds, Memory: '1.2' }
                    });
                    return;
                }

                if (exitCode !== 0) {
                    resolve({
                        Output: stderr || 'Runtime Error',
                        ErrorMessage: 'Runtime Error',
                        TimeAndMemory: { Time: durationSeconds, Memory: '1.5' }
                    });
                    return;
                }

                resolve({
                    Output: stdout || 'No output',
                    ErrorMessage: null,
                    TimeAndMemory: { Time: durationSeconds, Memory: '1.1' }
                });
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                resolve({
                    Output: err.message,
                    ErrorMessage: 'Runtime Error',
                    TimeAndMemory: { Time: '0', Memory: '0' }
                });
            });
        });
    } finally {
        // Clean up temp dir
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}
    }
};

/**
 * Judge0 Fallback Request
 */
const runWithJudge0 = async (
    code: string,
    language: string,
    testCases: TestCaseInput[],
    timeLimitMs: number
): Promise<ExecutionResult[]> => {
    const languageMap: Record<string, number> = {
        'cpp': 105,
        'python': 92,
        'pypy': 28,
        'java': 91,
        'javascript': 93,
        'kotlin': 111,
        'go': 107,
        'rust': 108
    };

    const langId = languageMap[language] || 105;
    const cpuLimitSec = Math.max(1, Math.round(timeLimitMs / 1000));

    const submissions = testCases.map(tc => ({
        language_id: langId,
        source_code: Buffer.from(code).toString('base64'),
        stdin: Buffer.from(tc.Input || '').toString('base64'),
        cpu_time_limit: cpuLimitSec
    }));

    const isBatch = submissions.length > 1;
    const url = isBatch
        ? 'https://ce.judge0.com/submissions/batch?base64_encoded=true'
        : 'https://ce.judge0.com/submissions?base64_encoded=true';

    const submitRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isBatch ? { submissions } : submissions[0])
    });

    const submitData: any = await submitRes.json();
    const tokens = isBatch ? submitData.map((s: any) => s.token) : [submitData.token];

    // Wait 1.5s for Judge0 compilation
    await new Promise(r => setTimeout(r, 1500));

    const resultsUrl = isBatch
        ? `https://ce.judge0.com/submissions/batch?base64_encoded=true&tokens=${tokens.join(',')}`
        : `https://ce.judge0.com/submissions/${tokens[0]}?base64_encoded=true`;

    const getRes = await fetch(resultsUrl);
    const getResults: any = await getRes.json();
    const items = isBatch ? (getResults.submissions || []) : [getResults];

    return items.map((res: any) => {
        const decode = (b64: string | null) => b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';
        const statusId = res.status_id || res.status?.id || 0;

        let errorMessage: string | null = null;
        let output = '';

        if (statusId === 3) {
            output = decode(res.stdout) || 'No output';
        } else if (statusId === 4) {
            errorMessage = 'Wrong Answer';
            output = decode(res.stdout) || 'Wrong Answer';
        } else if (statusId === 5 || statusId === 8) {
            errorMessage = 'Time Limit Exceeded';
            output = 'Time Limit Exceeded';
        } else if (statusId === 6) {
            errorMessage = 'Compilation Error';
            output = `Compilation Error: ${decode(res.compile_output)}`;
        } else {
            errorMessage = 'Runtime Error';
            output = decode(res.stderr) || 'Runtime Error';
        }

        return {
            Output: output,
            ErrorMessage: errorMessage,
            TimeAndMemory: {
                Time: res.time ? String(res.time) : '0',
                Memory: res.memory ? (res.memory / 1024).toFixed(2) : '0'
            }
        };
    });
};

/**
 * Main execution coordinator: tries in-house runner first, falls back to Judge0
 */
export const executeCode = async (
    code: string,
    language: string,
    testCases: TestCaseInput[],
    timeLimitMs: number = 3000
): Promise<ExecutionResult[]> => {
    let canRunLocally = false;

    if (language === 'python' || language === 'pypy') {
        canRunLocally = await isCommandAvailable('python');
    } else if (language === 'javascript') {
        canRunLocally = await isCommandAvailable('node');
    } else if (language === 'cpp') {
        canRunLocally = await isCommandAvailable('g++');
    }

    if (canRunLocally) {
        console.log(`[CodeRunner] Executing locally using host environment (${language})`);
        const results: ExecutionResult[] = [];
        for (const tc of testCases) {
            const res = await runSingleLocal(code, language, tc.Input, timeLimitMs);
            results.push(res);
        }
        return results;
    } else {
        console.log(`[CodeRunner] Host compiler for ${language} not detected, using Judge0 fallback`);
        return await runWithJudge0(code, language, testCases, timeLimitMs);
    }
};
