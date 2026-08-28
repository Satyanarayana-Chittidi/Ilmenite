import { getProblemName } from "../dom/getProblemName";
import { getProblemUrl } from "../dom/getProblemUrl";
import { getUserId } from "../dom/getUserId";
import * as monaco from 'monaco-editor';
import { browserAPI } from "../browser/browserDetect";
import { useCFStore } from "../../zustand/useCFStore";
import { getValueFromLanguage } from "../helper";
import { syncCurrentCodeToCloud } from "./storageService";

export const handleSubmission = async (editor: monaco.editor.IStandaloneCodeEditor | null, setIsSubmitting: (isSubmitting: boolean) => void, language: string, testCases: any) => {
    if(!editor) {
        alert("Wait for editor to load");
        return;
    }

    const editorValue = editor.getValue();
    if (!editorValue || editorValue.trim() === '') {
        const { setTestCases } = useCFStore.getState();
        const updatedTestCases = { ...testCases };
        updatedTestCases.ErrorMessage = 'No Code to Submit';
        updatedTestCases.testCases.forEach((testCase: any) => {
            testCase.Output = 'No Code to Submit';
            testCase.TimeAndMemory = { Time: '0', Memory: '0' };
        });
        setTestCases(updatedTestCases);
        return;
    }

    setIsSubmitting(true);

    try {
        const problemUrl = await getProblemUrl();
        const problemName = await getProblemName();
        const userId = await getUserId();
        
        if(userId.includes("Unknown")) {
            const { setTestCases } = useCFStore.getState();
            setTestCases({ ...testCases, ErrorMessage: "Please login to Codeforces to submit code." });
            setIsSubmitting(false);
            return;
        }

        const currentSlug = useCFStore.getState().currentSlug;
        if (currentSlug) {
            await syncCurrentCodeToCloud(currentSlug);
        }
        
        let [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

        const languageValue = getValueFromLanguage(language);

        const result = await new Promise((resolve) => {
            browserAPI.scripting.executeScript({
                target: { tabId: tab.id! },
                func: function(codeToSubmit, langValue) {
                    return new Promise((resolveInner) => {
                        const languageSelect = document.querySelector('select[name="programTypeId"]') as HTMLSelectElement;
                        if (languageSelect) {
                            languageSelect.value = langValue;
                            languageSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }

                        const blob = new Blob([codeToSubmit], { type: 'text/plain' });
                        const file = new File([blob], 'solution.txt', { type: 'text/plain' });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        
                        const fileInput = document.querySelector('input[type="file"][name="sourceFile"]') as HTMLInputElement;
                        if (!fileInput) {
                            alert("File input not found on Codeforces!");
                            resolveInner(false);
                            return;
                        }

                        fileInput.files = dataTransfer.files;
                        fileInput.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(() => {
                            const submitButton = document.querySelector('#sidebarSubmitButton') as HTMLInputElement;
                            if (submitButton) {
                                submitButton.click();
                                resolveInner(true);
                            } else {
                                alert("Submit button (#sidebarSubmitButton) not found on Codeforces!");
                                resolveInner(false);
                            }
                        }, 200);
                    });
                },
                args: [editorValue, languageValue]
            }, (results) => {
                if (browserAPI.runtime.lastError) {
                    console.error(browserAPI.runtime.lastError);
                    resolve(false);
                } else if (results && results[0]) {
                    resolve(results[0].result);
                } else {
                    resolve(false);
                }
            });
        });

        if (!result) {
            const { setTestCases } = useCFStore.getState();
            setTestCases({ ...testCases, ErrorMessage: "Submission failed. Please check if you are logged in and on a valid problem page." });
        }

    } catch (error) {
        console.error("Submission error:", error);
        const { setTestCases } = useCFStore.getState();
        setTestCases({ ...testCases, ErrorMessage: "Error: " + (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
};



