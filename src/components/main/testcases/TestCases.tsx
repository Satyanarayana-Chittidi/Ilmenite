import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TestCase } from '../../../types/types';
import { MAX_TEST_CASES } from '../../../data/constants';
import { useCFStore } from '../../../zustand/useCFStore';
import { CircleX, Plus, Copy, Check, RotateCcw, Terminal, LoaderCircle, X } from 'lucide-react';
import TestCaseNotAccess from './TestCaseNotAccess';
import { browserAPI } from '../../../utils/browser/browserDetect';
import { useTestCases } from '../../../utils/hooks/useTestCases';

const TestCases = React.memo(() => {
    const [selectedTab, setSelectedTab] = useState<number>(0);
    const { requestTestCases } = useTestCases();
    const currentSlug = useCFStore((state) => state.currentSlug);
    const testCases = useCFStore((state) => state.testCases);
    const setTestCases = useCFStore((state) => state.setTestCases);
    const isRunning = useCFStore((state) => state.isRunning);
    const [copied, setCopied] = useState<{ input: boolean, expectedOutput: boolean, output: boolean }>({ input: false, expectedOutput: false, output: false });

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const outputRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = (inputRef.current.scrollHeight + 2) + 'px';
        }
        if (outputRef.current) {
            outputRef.current.style.height = 'auto';
            outputRef.current.style.height = (outputRef.current.scrollHeight + 2) + 'px';
        }
    }, [currentSlug, testCases, selectedTab]);

    const isAllTestCasesPassed = () => {
        if (!testCases.testCases[selectedTab]?.Output) return false;
        return testCases.testCases.length > 0 && testCases.testCases.every((testCase) =>
            testCase.ExpectedOutput?.trim() === testCase.Output?.trim()
        )
    };



    const getStatusMessage = () => {
        if (isAllTestCasesPassed()) {
            return (
                <div className="flex items-center gap-2">
                    <div className="text-base font-medium text-green-500">Accepted</div>
                    {testCases.testCases[selectedTab]?.TimeAndMemory && (
                        <div className="text-xs text-gray-500">
                            Used: {testCases.testCases[selectedTab]?.TimeAndMemory?.Time}ms, {testCases.testCases[selectedTab]?.TimeAndMemory?.Memory}KB
                        </div>
                    )}
                </div>
            );
        } else if (testCases.ErrorMessage) {
            return (
                <div className="text-base font-medium text-red-500">
                    {testCases.ErrorMessage.includes('Compilation Error') ? 'Compilation Error' :
                        testCases.ErrorMessage.includes('Time Limit') ? 'Time Limit Exceeded' :
                            testCases.ErrorMessage.includes('Memory Limit') ? 'Memory Limit Exceeded' :
                                testCases.ErrorMessage.includes('Runtime Error') ? 'Runtime Error' :
                                    testCases.ErrorMessage.includes('Rate Limit Exceeded') ? 'Rate Limit Exceeded' :
                                        testCases.ErrorMessage.includes('Network Error') ? 'Network Error' :
                                            testCases.ErrorMessage.includes('No Code') ? testCases.ErrorMessage :
                                                testCases.ErrorMessage.includes('Internal Error') ? 'Internal Error' : 'Wrong Answer'}
                </div>
            );
        } else if (testCases.testCases[selectedTab]?.Output) {
            return (
                <div className="flex items-center gap-2">
                    <div className="text-base font-medium text-red-500">Wrong Answer</div>
                    {testCases.testCases[selectedTab].TimeAndMemory && (
                        <div className="text-xs text-gray-500">
                            Used: {testCases.testCases[selectedTab].TimeAndMemory?.Time}ms, {testCases.testCases[selectedTab].TimeAndMemory?.Memory}KB
                        </div>
                    )}
                </div>
            )
        }
        return;
    };

    const getStatusIcon = (testCase: TestCase) => {
        if (!testCase.Output) return null;
        const isCorrect = testCase.Output.trim() === testCase.ExpectedOutput.trim();
        if (isCorrect) {
            return (
                <div className="flex items-center justify-center w-3 h-3 bg-green-500 rounded-sm mr-1.5 flex-shrink-0">
                    <Check size={8} className="text-white dark:text-black" strokeWidth={3} />
                </div>
            );
        } else {
            return (
                <div className="flex items-center justify-center w-3 h-3 bg-red-500 rounded-sm mr-1.5 flex-shrink-0">
                    <X size={8} className="text-white dark:text-black" strokeWidth={3} />
                </div>
            );
        }
    };

    const getTabStyle = (index: number) => {
        const baseStyle = "flex items-center justify-center w-auto min-w-[5rem] px-2 py-[5px] text-[14px] font-medium rounded-lg transition-colors duration-200";

        const selectedStyle = selectedTab === index
            ? 'bg-gray-300 dark:bg-zinc-800'
            : 'bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-800/50';

        return `${baseStyle} ${selectedStyle} text-gray-700 dark:text-gray-300`;
    };

    const handleCopy = async (text: string, type: 'input' | 'expectedOutput' | 'output') => {
        await navigator.clipboard.writeText(text);
        setCopied(prev => ({ ...prev, [type]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 2000);
    };

    useEffect(() => {
        if (selectedTab >= testCases.testCases.length) {
            setSelectedTab(Math.max(0, testCases.testCases.length - 1));
        }
    }, [testCases.testCases.length]);

    const handleInputChange = (index: number, newInput: string) => {
        if (isRunning) return;
        const updatedTestCases = [...testCases.testCases];
        updatedTestCases[index].Input = newInput;
        setTestCases({ testCases: updatedTestCases });
    };

    const handleExpectedOutputChange = (index: number, newOutput: string) => {
        if (isRunning) return;
        const updatedTestCases = [...testCases.testCases];
        updatedTestCases[index].ExpectedOutput = newOutput;
        setTestCases({ testCases: updatedTestCases });
    };

    const addTestCase = () => {
        if (testCases.testCases.length < MAX_TEST_CASES) {
            const newTestCase: TestCase = {
                Input: '', ExpectedOutput: '',
                Testcase: testCases.testCases.length + 1,
                TimeAndMemory: { Time: '', Memory: '' },
                Output: ''
            };

            setTestCases({ testCases: [...testCases.testCases.map(testCase => ({ ...testCase, Output: '' })), newTestCase], ErrorMessage: '' }); setSelectedTab(testCases.testCases.length);
        }
    };

    const removeTestCase = (index: number) => {
        const updatedTestCases = testCases.testCases.filter((_, i) => i !== index);
        setTestCases({ testCases: updatedTestCases });

        setSelectedTab((prev) => Math.max(0, prev > index ? prev - 1 : prev));
    };

    const resetTestCases = () => {
        requestTestCases();
        setSelectedTab(0);
    };

    return (
        <>
            {!currentSlug ? (
                <TestCaseNotAccess />
            ) : (
                <div className="w-full dark:bg-[#111111] pt-[5px] px-[10px] pb-0 rounded-md overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className='w-full flex flex-col gap-2 border-b border-gray-500 text-xl text-black dark:text-white py-2 px-2'>
                        <h2 className="flex justify-between items-center font-[600]">
                            <div className="flex items-center justify-center gap-2">
                                {isRunning ?
                                    <LoaderCircle className="animate-spin w-4 h-4" /> :
                                    <Terminal size={20} color="currentColor" className="text-[#22c55e] dark:text-[#4ade80]" />
                                }
                                Test Cases
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={resetTestCases}
                                    className={`bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all text-sm h-7 w-7 rounded-lg flex items-center justify-center ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                                    title="Reset test cases"
                                    disabled={isRunning}
                                >
                                    <RotateCcw className="text-[#111111] dark:text-[#ffffff]" size={16} />
                                </button>
                                <button
                                    onClick={addTestCase}
                                    className={`relative bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all text-sm h-7 w-7 rounded-lg flex items-center justify-center ${testCases.testCases.length >= MAX_TEST_CASES || isRunning ? "cursor-not-allowed opacity-50" : ""}`}
                                    disabled={testCases.testCases.length >= MAX_TEST_CASES || isRunning}
                                    title="Add test case"
                                >
                                    <Plus className="text-[#111111] dark:text-[#ffffff]" size={16} />
                                </button>
                            </div>
                        </h2>
                        {getStatusMessage()}
                    </div>
                    
                    <div className="flex gap-2 mb-0 pl-[4px] pr-3 pt-3 pb-0 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {testCases.testCases.map((_, index) => (
                            <div key={index} className="relative group">
                                <button
                                    onClick={() => setSelectedTab(index)}
                                    className={getTabStyle(index)}
                                >
                                    {getStatusIcon(testCases.testCases[index])}
                                    Case {index + 1}
                                </button>
                                <button
                                    onClick={() => removeTestCase(index)}
                                    className={`absolute hidden group-hover:flex -top-1.5 -right-1.5 text-xs text-gray-400 hover:text-gray-600 rounded-full w-4 h-4 items-center justify-center ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                                    disabled={isRunning}
                                >
                                    <CircleX />
                                </button>
                            </div>
                        ))}
                    </div>

                    {testCases.testCases.length > 0 && selectedTab < testCases.testCases.length && (
                        <div className="flex flex-col p-2">
                            <div>
                                <div className="relative">
                                    <label className="text-sm text-gray-700 dark:text-gray-300">
                                        <h2 className="text-[12px] text-[#3c3c4399] dark:text-[#eff2f699] font-[600] pb-1">Input</h2>
                                        <textarea
                                            ref={inputRef}
                                            value={testCases.testCases[selectedTab].Input}
                                            onChange={(e) => handleInputChange(selectedTab, e.target.value)}
                                            rows={1}
                                            style={{ overflow: 'hidden' }}
                                            className="mono-font w-full p-3 rounded-lg bg-zinc-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 transition-colors duration-200 border border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 outline-none resize-none shadow-inner"
                                        />
                                    </label>
                                    <button
                                        onClick={() => handleCopy(testCases.testCases[selectedTab].Input, 'input')}
                                        className="absolute top-8 right-2 text-gray-400 hover:text-gray-600"
                                    >
                                        {copied.input ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>

                            {testCases.testCases.length > 0 && testCases.testCases[selectedTab]?.Output && (
                                <div className="mt-[9px]">
                                    <h2 className="text-[12px] text-[#3c3c4399] dark:text-[#eff2f699] font-[600] pb-1">Output</h2>
                                    <div className="relative">
                                        <div className={`p-3 rounded-lg whitespace-pre-wrap overflow-hidden shadow-inner ${testCases.testCases[selectedTab]?.Output.trim() === testCases.testCases[selectedTab].ExpectedOutput.trim()
                                            ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'
                                            : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                                            }`}>
                                            {testCases.testCases[selectedTab]?.Output}
                                        </div>

                                        <button
                                            onClick={() => handleCopy(testCases.testCases[selectedTab]?.Output || '', 'output')}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                        >
                                            {copied.output ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                                <div className="relative mt-[9px]">
                                    <label className="text-sm text-gray-700 dark:text-gray-300">
                                        <h2 className="text-[12px] text-[#3c3c4399] dark:text-[#eff2f699] font-[600] pb-1">Expected Output</h2>
                                        <textarea
                                            ref={outputRef}
                                            value={testCases.testCases[selectedTab].ExpectedOutput}
                                            onChange={(e) => handleExpectedOutputChange(selectedTab, e.target.value)}
                                            rows={1}
                                            style={{ overflow: 'hidden' }}
                                            className="mono-font w-full p-3 rounded-lg bg-zinc-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 transition-colors duration-200 border border-transparent focus:border-zinc-400 dark:focus:border-zinc-600 outline-none resize-none shadow-inner"
                                        />
                                    </label>
                                    <button
                                        onClick={() => handleCopy(testCases.testCases[selectedTab].ExpectedOutput, 'expectedOutput')}
                                        className="absolute top-8 right-2 text-gray-400 hover:text-gray-600"
                                    >
                                        {copied.expectedOutput ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
});

export default TestCases;
