import { CodeEntry, TestCaseArray } from '../../types/types';
import { getCodeMap, getSlugQueue, getTestCaseMap, getTestCaseQueue } from '../helper';
import { MAX_PROBLEM_IO_SIZE, SINGLE_CODE_LIMIT_BYTES, STORAGE_LIMIT_BYTES } from '../../data/constants';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useCFStore } from '../../zustand/useCFStore';
import { saveCloudCode } from './cloudCodeService';
import LZString from 'lz-string';

export const saveCodeForSlug = async (
    slug: string, 
    editor: monaco.editor.IStandaloneCodeEditor | null,
    totalSize: number,
    setTotalSize: (size: number) => void,
    syncToCloud: boolean = false
) => {
    if (editor) {
        const editorValue = editor.getValue();
        const size = editorValue?.length || 0;

        if (size > SINGLE_CODE_LIMIT_BYTES) {
            alert("Code size exceeds. Please reduce the size of your code.");
            return;
        }

        const codeMap = getCodeMap();
        const slugQueue = getSlugQueue();

        const position = editor.getPosition();
        const cursorPos = position ? editor.getModel()?.getOffsetAt(position) : undefined;
        const codeWithCursor = editorValue.slice(0, cursorPos) + "$0" + editorValue.slice(cursorPos);
        const compressedCode = LZString.compressToUTF16(codeWithCursor!);

        if (!codeMap.has(slug)) {
            slugQueue.add(slug);
        }

        const oldSize = codeMap.get(slug)?.size || 0;
        let newTotalSize = totalSize - oldSize + size;

        const maxFiles = 50;

        // Enforce max files OR byte limit for all users to prevent localStorage QuotaExceededError
        while (newTotalSize > STORAGE_LIMIT_BYTES || slugQueue.size() > maxFiles) {
            const oldSlug = slugQueue.remove();
            if (oldSlug) {
                const removedSize = codeMap.get(oldSlug)?.size || 0;
                newTotalSize -= removedSize;
                codeMap.delete(oldSlug);
            }
        }

        setTotalSize(newTotalSize);

        const entry: CodeEntry = {
            code: compressedCode,
            size,
            timestamp: Date.now()
        };

        codeMap.set(slug, entry);

        try {
            localStorage.setItem('codeMap', JSON.stringify(Array.from(codeMap.entries())));
            localStorage.setItem('slugQueue', slugQueue.toJSON());
        } catch (e) {
            console.error("Local storage quota exceeded. Unable to save codeMap locally.", e);
        }

        if (useCFStore.getState().isPlusUser && syncToCloud) {
            useCFStore.getState().setCloudSaveStatus('saving');
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
            const savePromise = saveCloudCode(slug, compressedCode);
            
            Promise.all([savePromise, minDelay]).then(() => {
                useCFStore.getState().setCloudSaveStatus('saved');
                setTimeout(() => {
                    useCFStore.getState().setCloudSaveStatus('idle');
                }, 2000);
            }).catch(err => {
                console.error("Background sync to Supabase failed", err);
                useCFStore.getState().setCloudSaveStatus('idle');
            });
        }
    }
};

export const saveTestCaseForSlug = async (slug: string, testCasesToSave: TestCaseArray) => {
    const testCaseMap = getTestCaseMap();
    const testCaseQueue = getTestCaseQueue();

    if (!testCaseMap.has(slug)) {
        testCaseQueue.add(slug);
    }

    testCaseMap.set(slug, testCasesToSave);

    if (testCaseQueue.size() > MAX_PROBLEM_IO_SIZE) {
        const slugToRemove = testCaseQueue.remove();
        if (slugToRemove) {
            testCaseMap.delete(slugToRemove);
        }
    }
};

export const initializeStorage = () => {
    const storedQueue = getCodeMap();
    let size = 0;
    const now = Date.now();
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    const toDelete: string[] = [];

    // Check expiration for free tier items
    storedQueue.forEach((entry, slug) => {
        if (entry.timestamp && now - entry.timestamp > FORTY_EIGHT_HOURS) {
            toDelete.push(slug);
        } else {
            size += entry.size;
        }
    });

    if (toDelete.length > 0) {
        const slugQueue = getSlugQueue();
        let queueItems: string[] = [];
        try {
            queueItems = JSON.parse(slugQueue.toJSON());
        } catch(e) {}
        
        toDelete.forEach(slug => {
            storedQueue.delete(slug);
            queueItems = queueItems.filter(s => s !== slug);
        });
        
        const newSlugQueue = Queue.fromJSON<string>(queueItems);
        localStorage.setItem('codeMap', JSON.stringify(Array.from(storedQueue.entries())));
        localStorage.setItem('slugQueue', newSlugQueue.toJSON());
    }

    return size;
};

export const syncCurrentCodeToCloud = async (slug: string) => {
    const isPlusUser = useCFStore.getState().isPlusUser;
    if (!isPlusUser || !slug) return;
    
    const codeMap = getCodeMap();
    const entry = codeMap.get(slug);
    if (entry) {
        await saveCloudCode(slug, entry.code);
    }
};
