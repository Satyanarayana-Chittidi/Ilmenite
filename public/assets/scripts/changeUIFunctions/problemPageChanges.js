const isProblemPage = () => {
    const url = window.location.href;
    return //problemset/problem/([0-9]+)/([^/]+)|/contest/([0-9]+)/problem/([^/]+)|/gym/([0-9]+)/problem/([^/]+)/.test(url);
};

const injectCodeforcesIlmeniteIframe = () => {
    if (!isProblemPage()) return;
    if (document.getElementById('cf-ilmenite-iframe-container')) return;

    document.body.classList.add('cf-problem-page');
    const browserAPI = typeof browser !== "undefined" ? browser : chrome;

    let panelWidth = 420;
    let isDark = true;

    const themeStyle = document.createElement("style");
    themeStyle.textContent = `
      .ilmenite-theme-icon {
        transition: transform 0.5s ease-in-out, stroke 0.5s ease-in-out;
      }
      .ilmenite-theme-icon.dark {
        transform: rotate(90deg);
        stroke: #fde047;
      }
      .ilmenite-theme-icon.light {
        transform: rotate(40deg);
        stroke: #1e3a8a;
      }
      .ilmenite-mask-circle {
        transition: cx 0.5s ease-in-out, cy 0.5s ease-in-out;
        r: 6px;
      }
      .ilmenite-theme-icon.dark .ilmenite-mask-circle {
        cx: 30px; cy: 0px;
      }
      .ilmenite-theme-icon.light .ilmenite-mask-circle {
        cx: 12px; cy: 4px;
      }
      .ilmenite-main-circle {
        transition: r 0.5s ease-in-out, fill 0.5s ease-in-out;
        cx: 12px; cy: 12px;
      }
      .ilmenite-theme-icon.dark .ilmenite-main-circle {
        r: 5px; fill: #fde047;
      }
      .ilmenite-theme-icon.light .ilmenite-main-circle {
        r: 9px; fill: #1e3a8a;
      }
      .ilmenite-sun-rays {
        transition: opacity 0.5s ease-in-out, stroke 0.5s ease-in-out;
      }
      .ilmenite-theme-icon.dark .ilmenite-sun-rays {
        opacity: 1; stroke: #fde047;
      }
      .ilmenite-theme-icon.light .ilmenite-sun-rays {
        opacity: 0; stroke: #1e3a8a;
      }
    `;
    document.documentElement.appendChild(themeStyle);

    browserAPI.storage.local.get(["sidePanelWidth", "theme"]).then((result) => {
        isDark = result.theme !== "light";

        const btnContainer = document.createElement("div");
        btnContainer.id = "ilmenite-floating-btns";
        btnContainer.style.position = "fixed";
        btnContainer.style.top = "20px";
        btnContainer.style.right = "20px";
        btnContainer.style.display = "none";
        btnContainer.style.flexDirection = "column";
        btnContainer.style.gap = "8px";
        btnContainer.style.zIndex = "2147483647";

        const updateBtnStyles = () => {
            const bg = isDark ? "#2a2a2a" : "#e5e7eb";
            const color = isDark ? "#ffffff" : "#444444";
            
            [openBtn, themeBtn].forEach(btn => {
                btn.style.backgroundColor = bg;
                btn.style.color = color;
            });
            
            const iconSvg = themeBtn.querySelector("svg");
            if(iconSvg) {
                iconSvg.className = "ilmenite-theme-icon " + (isDark ? "dark" : "light");
            }
        };

        const openBtn = document.createElement("div");
        openBtn.id = "ilmenite-open-panel-btn";
        openBtn.innerHTML = `<svg style="margin: auto; display: block;" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
        openBtn.style.width = "36px";
        openBtn.style.height = "36px";
        openBtn.style.borderRadius = "12px";
        openBtn.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        openBtn.style.display = "flex";
        openBtn.style.alignItems = "center";
        openBtn.style.justifyContent = "center";
        openBtn.style.cursor = "pointer";
        openBtn.title = "Open Editor";
        openBtn.style.transition = "background-color 0.2s, transform 0.2s";

        openBtn.addEventListener("mouseenter", () => {
            openBtn.style.backgroundColor = isDark ? "#3a3a3a" : "#d1d5db";
        });
        openBtn.addEventListener("mouseleave", () => {
            openBtn.style.backgroundColor = isDark ? "#2a2a2a" : "#e5e7eb";
        });

        const themeBtn = document.createElement("div");
        themeBtn.id = "ilmenite-theme-btn";
        themeBtn.innerHTML = `
        <svg class="ilmenite-theme-icon ${isDark ? 'dark' : 'light'}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <mask id="ilmenite-moon-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <circle class="ilmenite-mask-circle" fill="black" />
            </mask>
            <circle class="ilmenite-main-circle" mask="url(#ilmenite-moon-mask)" />
            <g class="ilmenite-sun-rays">
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </g>
        </svg>`;
        themeBtn.style.width = "36px";
        themeBtn.style.height = "36px";
        themeBtn.style.borderRadius = "12px";
        themeBtn.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
        themeBtn.style.display = "flex";
        themeBtn.style.alignItems = "center";
        themeBtn.style.justifyContent = "center";
        themeBtn.style.cursor = "pointer";
        themeBtn.title = "Toggle Theme";
        themeBtn.style.transition = "background-color 0.2s, transform 0.2s";

        themeBtn.addEventListener("mouseenter", () => {
            themeBtn.style.backgroundColor = isDark ? "#3a3a3a" : "#fef08a"; // yellow-200 in light mode
        });
        themeBtn.addEventListener("mouseleave", () => {
            themeBtn.style.backgroundColor = isDark ? "#2a2a2a" : "#e5e7eb";
        });

        themeBtn.addEventListener("click", () => {
            isDark = !isDark;
            browserAPI.storage.local.set({ theme: isDark ? "dark" : "light" });
        });

        browserAPI.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "local" && changes.theme) {
                isDark = changes.theme.newValue === "dark";
                updateBtnStyles();
            }
        });

        updateBtnStyles();

        btnContainer.appendChild(openBtn);
        btnContainer.appendChild(themeBtn);
        document.documentElement.appendChild(btnContainer);
        let defaultWidth = window.innerWidth * 0.3;
        if (window.innerWidth - defaultWidth < 960) {
            defaultWidth = Math.max(420, window.innerWidth - 960);
        }
        panelWidth = result.sidePanelWidth || defaultWidth;

        // Create iframe container (replaces direct iframe for cleaner dom if needed, but we can just use iframe)
        const iframe = document.createElement('iframe');
        iframe.id = 'cf-ilmenite-iframe-container'; // use as the ID marker
        iframe.src = browserAPI.runtime.getURL('index.html');
        iframe.style.position = "fixed";
        iframe.style.top = "0";
        iframe.style.right = "0";
        iframe.style.width = `${panelWidth}px`;
        iframe.style.height = "100vh";
        iframe.style.border = "none";
        iframe.style.borderLeft = "1px solid #333";
        iframe.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.5)";
        iframe.style.zIndex = "2147483646";
        iframe.style.backgroundColor = "#1e1e1e";

        // Create resizer
        const resizer = document.createElement("div");
        resizer.id = "cf-ilmenite-editor-resizer";
        resizer.style.position = "fixed";
        resizer.style.top = "0";
        resizer.style.right = `${panelWidth}px`;
        resizer.style.width = "8px";
        resizer.style.height = "100vh";
        resizer.style.cursor = "ew-resize";
        resizer.style.zIndex = "2147483647";
        resizer.style.backgroundColor = "transparent";

        resizer.addEventListener(
            "mouseenter",
            () => (resizer.style.backgroundColor = "rgba(100, 150, 255, 0.3)"),
        );
        resizer.addEventListener(
            "mouseleave",
            () => (resizer.style.backgroundColor = "transparent"),
        );

        document.documentElement.appendChild(iframe);
        document.documentElement.appendChild(resizer);

        const pageContent = document.getElementById("pageContent");

        function openPanel() {
            iframe.style.display = "block";
            resizer.style.display = "block";
            btnContainer.style.display = "none";

            document.documentElement.style.overflowY = "auto";
            document.documentElement.style.overflowX = "hidden";
            document.body.style.marginRight = "0";
            document.body.style.width = `calc(100% - ${panelWidth}px)`;
            document.body.style.height = "auto";
            document.body.style.minHeight = "100vh";
            document.body.style.overflowX = "hidden";
            document.body.style.overflowY = "hidden";
            document.body.style.boxSizing = "border-box";

            if (pageContent) pageContent.style.paddingRight = "10px";
        }

        function closePanel() {
            iframe.style.display = "none";
            resizer.style.display = "none";
            btnContainer.style.display = "flex";

            document.documentElement.style.overflowY = "";
            document.documentElement.style.overflowX = "";
            document.body.style.marginRight = "";
            document.body.style.width = "";
            document.body.style.height = "";
            document.body.style.minHeight = "";
            document.body.style.overflowX = "";
            document.body.style.overflowY = "";
            document.body.style.minWidth = "";

            if (pageContent) pageContent.style.paddingRight = "";
        }

        openPanel();

        openBtn.addEventListener("click", openPanel);

        // Listen for close message from React app (replaces the native closeBtn)
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CLOSE_CF_ILMENITE_IFRAME') {
                closePanel();
            }
        });

        // Drag to resize logic
        let isResizing = false;

        resizer.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isResizing = true;
            document.documentElement.style.userSelect = "none";
            document.body.style.userSelect = "none";
            iframe.style.pointerEvents = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;

            let newWidth = window.innerWidth - e.clientX;
            const minWidth = 420;
            if (newWidth < minWidth) newWidth = minWidth;
            if (newWidth > window.innerWidth - 300) newWidth = window.innerWidth - 300;

            panelWidth = newWidth;
            iframe.style.width = `${panelWidth}px`;
            resizer.style.right = `${panelWidth}px`;
            document.body.style.width = `calc(100% - ${panelWidth}px)`;
        });

        document.addEventListener("mouseup", () => {
            if (isResizing) {
                isResizing = false;
                document.documentElement.style.userSelect = "";
                document.body.style.userSelect = "";
                iframe.style.pointerEvents = "";
                browserAPI.storage.local.set({ sidePanelWidth: panelWidth });
            }
        });
    });
};

const hideBottomCopyrightGlobally = () => {
    const footer = document.getElementById('footer');
    if (footer) footer.style.display = 'none';
};

document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add('cf-ilmenite-custom-scrollbars');
    hideBottomCopyrightGlobally();
});
