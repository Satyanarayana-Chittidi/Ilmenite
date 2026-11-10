/**
 * Sandboxed Code Execution Service
 * Uses isolated Judge0 sandbox environment.
 * Host system process spawning is intentionally disabled for security (prevents RCE).
 */

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

const languageMap: Record<string, number> = {
    'cpp': 105,
    'c': 104,
    'python': 92,
    'pypy': 28,
    'java': 91,
    'javascript': 93,
    'kotlin': 111,
    'go': 107,
    'rust': 108,
    'ruby': 72
};

/**
 * Executes test cases using Judge0's isolated sandbox
 */
const runWithJudge0 = async (
    code: string,
    language: string,
    testCases: TestCaseInput[],
    timeLimitMs: number
): Promise<ExecutionResult[]> => {
    const langId = languageMap[language.toLowerCase()] || 105;
    const cpuLimitSec = Math.max(1, Math.round(timeLimitMs / 1000));

    const submissions = testCases.map(tc => ({
        language_id: langId,
        source_code: Buffer.from(code).toString('base64'),
        stdin: Buffer.from(tc.Input || '').toString('base64'),
        cpu_time_limit: cpuLimitSec
    }));

    const isBatch = submissions.length > 1;
    const apiUrl = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
    const apiKey = process.env.JUDGE0_API_KEY;

    const url = isBatch
        ? `${apiUrl}/submissions/batch?base64_encoded=true`
        : `${apiUrl}/submissions?base64_encoded=true`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (apiKey) {
        headers['X-RapidAPI-Key'] = apiKey;
    }

    const submitRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(isBatch ? { submissions } : submissions[0])
    });

    if (!submitRes.ok) {
        throw new Error(`Judge0 API error: ${submitRes.status} ${submitRes.statusText}`);
    }

    const submitData: any = await submitRes.json();
    const tokens: string[] = isBatch
        ? submitData.map((s: any) => s.token)
        : [submitData.token];

    // Poll for results (max 10 seconds)
    const startTime = Date.now();
    let completedResults: any[] = [];

    while (Date.now() - startTime < 10000) {
        await new Promise(r => setTimeout(r, 600));

        const checkUrl = isBatch
            ? `${apiUrl}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=true`
            : `${apiUrl}/submissions/${tokens[0]}?base64_encoded=true`;

        const checkRes = await fetch(checkUrl, { headers });
        if (!checkRes.ok) continue;

        const checkData: any = await checkRes.json();
        const results = isBatch ? checkData.submissions : [checkData];

        const allFinished = results.every((r: any) => r && r.status && r.status.id >= 3);
        if (allFinished) {
            completedResults = results;
            break;
        }
    }

    const decode = (str: string | null | undefined): string => {
        if (!str) return '';
        try {
            return Buffer.from(str, 'base64').toString('utf8');
        } catch {
            return str;
        }
    };

    return completedResults.map((res: any) => {
        if (!res) {
            return {
                Output: 'Execution timed out',
                ErrorMessage: 'Timeout',
                TimeAndMemory: { Time: '0', Memory: '0' }
            };
        }

        const statusId = res.status?.id;
        let errorMessage: string | null = null;
        let output = '';

        if (statusId === 3) {
            // Success / Accepted
            output = decode(res.stdout);
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
 * Main execution coordinator: exclusively uses sandboxed Judge0 runner
 */
export const executeCode = async (
    code: string,
    language: string,
    testCases: TestCaseInput[],
    timeLimitMs: number = 3000
): Promise<ExecutionResult[]> => {
    return await runWithJudge0(code, language, testCases, timeLimitMs);
};
