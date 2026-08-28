// Functions in respective folders
// changeLoginPageUI, changeProblemSetPageUI, removeLoginPageUI, removeProblemSetPageUI-> changeUIFunctions
// injectDarkModeCSS, sortToggleImgInvert, removeSortToggleImgInvert -> darkModeFunctions
const isFirefox = false;
const browserAPI = chrome;

browserAPI.storage.local.get(["changeUI", "theme", "themeCustomSettings", "defaultThemeSettings", "isPlusUser"]).then((result) => {
    if (result.changeUI === "true" && result.isPlusUser) {
        const applyUIChanges = () => {
            changeLoginPageUI();
            changeProblemSetPageUI();
        };
        
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", applyUIChanges);
        } else {
            applyUIChanges();
        }
    }

    const currentTheme = result.theme || "dark";
    if (currentTheme === "dark") {
        injectDarkModeCSS();
        sortToggleImgInvert();

        if (result.themeCustomSettings) {
            applyCustomThemeSettings(result.themeCustomSettings);
        } else if (result.defaultThemeSettings) {
            applyCustomThemeSettings(result.defaultThemeSettings);
        }
    }
});

browserAPI.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
        if (changes.theme) {
            if (changes.theme.newValue === "dark") {
                injectDarkModeCSS();
                sortToggleImgInvert();

                browserAPI.storage.local.get(["themeCustomSettings", "defaultThemeSettings"], (result) => {
                    if (result.themeCustomSettings) {
                        applyCustomThemeSettings(result.themeCustomSettings);
                    } else if (result.defaultThemeSettings) {
                        applyCustomThemeSettings(result.defaultThemeSettings);
                    }
                });
            } else {
                if (styleElement) {
                    styleElement.remove();
                }
                if (customStyleElement) {
                    customStyleElement.remove();
                }
                removeSortToggleImgInvert();
            }
        } else if (changes.themeCustomSettings) {
            if (document.documentElement.classList.contains('dark') ||
                document.querySelector('html[data-theme="dark"]')) {
                applyCustomThemeSettings(changes.themeCustomSettings.newValue);
            }
        } else if (changes.changeUI || changes.isPlusUser) {
            browserAPI.storage.local.get(["changeUI", "isPlusUser"]).then((res) => {
                if (res.changeUI === "true" && res.isPlusUser) {
                    changeLoginPageUI();
                    changeProblemSetPageUI();
                } else {
                    removeChangeLoginPageUI();
                    removeChangeProblemSetPageUI();
                }
            });
        }
    }
});

browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'APPLY_CUSTOM_THEME') {
        applyCustomThemeSettings(message.settings);
        sendResponse({ success: true });
    }
    return true;
});

function injectGlobalThemeToggle() {
    const isProblemPage = /^\/(?:problemset\/problem\/|contest\/\d+\/problem\/)/.test(window.location.pathname);
    if (isProblemPage) return; // problem page already has it via iframeInject.js

    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    let isDark = true;

    const themeStyle = document.createElement("style");
    themeStyle.textContent = `
      .ilmenite-theme-icon { transition: transform 0.5s ease-in-out; transform-origin: center; }
      .ilmenite-theme-icon.dark { transform: rotate(90deg); stroke: #fde047; }
      .ilmenite-theme-icon.light { transform: rotate(40deg); stroke: #1e3a8a; }
      .ilmenite-mask-circle { transition: cx 0.5s ease-in-out, cy 0.5s ease-in-out; r: 6px; }
      .ilmenite-theme-icon.dark .ilmenite-mask-circle { cx: 30px; cy: 0px; }
      .ilmenite-theme-icon.light .ilmenite-mask-circle { cx: 12px; cy: 4px; }
      .ilmenite-main-circle { transition: r 0.5s ease-in-out; cx: 12px; cy: 12px; }
      .ilmenite-theme-icon.dark .ilmenite-main-circle { r: 5px; fill: #fde047; }
      .ilmenite-theme-icon.light .ilmenite-main-circle { r: 9px; fill: #1e3a8a; }
      .ilmenite-sun-rays { transition: opacity 0.5s ease-in-out; }
      .ilmenite-theme-icon.dark .ilmenite-sun-rays { opacity: 1; stroke: #fde047; }
      .ilmenite-theme-icon.light .ilmenite-sun-rays { opacity: 0; stroke: #1e3a8a; }
    `;
    document.documentElement.appendChild(themeStyle);

    browserAPI.storage.local.get(["theme"]).then((result) => {
        isDark = result.theme !== "light";

        const themeBtn = document.createElement("div");
        themeBtn.id = "ilmenite-global-theme-btn";
        themeBtn.innerHTML = `
        <svg class="ilmenite-theme-icon ${isDark ? 'dark' : 'light'}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <mask id="ilmenite-global-moon-mask"><rect x="0" y="0" width="100%" height="100%" fill="white" /><circle class="ilmenite-mask-circle" cx="12" cy="4" r="6" fill="black" /></mask>
            <circle class="ilmenite-main-circle" cx="12" cy="12" r="9" mask="url(#ilmenite-global-moon-mask)" fill="currentColor" />
            <g class="ilmenite-sun-rays">
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
        </svg>`;
        themeBtn.style.position = "fixed";
        themeBtn.style.top = "20px";
        themeBtn.style.right = "20px";
        themeBtn.style.width = "36px";
        themeBtn.style.height = "36px";
        themeBtn.style.borderRadius = "12px";
        themeBtn.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        themeBtn.style.display = "flex";
        themeBtn.style.alignItems = "center";
        themeBtn.style.justifyContent = "center";
        themeBtn.style.cursor = "pointer";
        themeBtn.style.zIndex = "999990";
        themeBtn.title = "Toggle Theme";
        themeBtn.style.transition = "background-color 0.2s, transform 0.2s";

        const updateBtnStyles = () => {
            themeBtn.style.backgroundColor = isDark ? "#2a2a2a" : "#e5e7eb";
            themeBtn.style.color = isDark ? "#ffffff" : "#444444";
            const iconSvg = themeBtn.querySelector("svg");
            if (iconSvg) iconSvg.setAttribute("class", "ilmenite-theme-icon " + (isDark ? "dark" : "light"));
        };

        themeBtn.addEventListener("mouseenter", () => {
            themeBtn.style.backgroundColor = isDark ? "rgba(253, 224, 71, 0.15)" : "rgba(30, 58, 138, 0.15)";
        });
        themeBtn.addEventListener("mouseleave", () => {
            themeBtn.style.backgroundColor = isDark ? "#2a2a2a" : "#e5e7eb";
        });

        themeBtn.addEventListener("click", () => {
            isDark = !isDark;
            updateBtnStyles();
            browserAPI.storage.local.set({ theme: isDark ? "dark" : "light" });
        });

        browserAPI.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "local" && changes.theme) {
                isDark = changes.theme.newValue === "dark";
                updateBtnStyles();
            }
        });

        updateBtnStyles();
        document.documentElement.appendChild(themeBtn);
    });
}

injectGlobalThemeToggle();
