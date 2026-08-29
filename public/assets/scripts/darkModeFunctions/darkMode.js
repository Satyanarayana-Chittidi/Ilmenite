if (typeof isFirefox === "undefined") {
  let isFirefox = false;
  let browserAPI = chrome;
}

const currentURL = window.location.href;
let styleElement;
let customStyleElement;

const injectDarkModeCSS = () => {
  styleElement = document.createElement("style");
  styleElement.textContent = `
            html {
                background-color: #0f0f0f !important;
            }
                
            body {
                filter: invert(0.94) hue-rotate(160deg) !important;
            }

            /* for undo filter */
            .cf-ilmenite-no-invert, img, picture, video, iframe, canvas, .legendColorBox, #legend_unordered_list li svg, .welldone, #heatmap-tooltip, #cf-heatmap svg rect:not([fill="#ebedf0"]) {
                filter: invert(1) hue-rotate(-160deg) !important;
            }

            .problems .accepted-problem td.act {
                background-color: #44ff44 !important;
            }

            .problems .accepted-problem td.id {
                border-left: 6px solid #44ff44 !important;
            }

            .problems .rejected-problem td.act {
                background-color: #ffff00 !important
            }

            .problems .rejected-problem td.id {
                border-left: 6px solid #ffff00 !important;
            }

            .red-link {
                filter: invert(0.95) hue-rotate(-160deg) !important;
            }

            .tex-font-style-tt {
                font-weight: 600 !important;
            }

            .user-gray, .user-green, .user-cyan, .user-violet, .user-orange, .user-red, .user-legendary {
                filter: invert(0.95) hue-rotate(-160deg) !important;
            }

            .user-blue {
                filter: invert(0.2) !important;
                color: #0000ff !important;
            }

            .user-legendary span, .user-4000 span {
                filter: invert(0.95) hue-rotate(-160deg) !important;
            }

            table {
                filter: brightness(0.99) !important;
            }

            img[title="Codeforces"], img[alt="ITMO University"], img.tex-formula, img.tex-graphics {
                filter: none !important;
            }

            .login-button-custom {
                background-color: #423dc8 !important;
            }

            input, textarea, select {
                background-color: #dadadd !important;
                color: #000000 !important;
                border: none !important;
                border-radius: 4px !important;
                padding-top: 4px !important;
                padding-bottom: 4px !important;
            }

            button {
                background-color: #2a2a2a !important;
                color: #e0e0e0 !important;
                border-color: #555 !important;
            }

            a {
                color: #122A70 !important;
            }

            .menu-list-container a, .second-level-menu-list a {
                color: #000000 !important;

            }

            /* cf-heatmap */
            #cf-heatmap svg rect:not([fill="#ebedf0"]) {
                opacity: 1 !important;
            }

            #heatmap-tooltip > a {
                color: #197AF6 !important;
            }

            /* Main window scrollbar (not inverted) */
            html::-webkit-scrollbar,
            body.cf-ilmenite-custom-scrollbars::-webkit-scrollbar {
                width: 8px !important;
                height: 8px !important;
                background: #2a2a2a !important;
                background-color: #2a2a2a !important;
            }
            html::-webkit-scrollbar-track, html::-webkit-scrollbar-track-piece,
            body.cf-ilmenite-custom-scrollbars::-webkit-scrollbar-track,
            body.cf-ilmenite-custom-scrollbars::-webkit-scrollbar-track-piece {
                background: #2a2a2a !important;
                background-color: #2a2a2a !important;
            }
            html::-webkit-scrollbar-thumb,
            body.cf-ilmenite-custom-scrollbars::-webkit-scrollbar-thumb {
                background: #555 !important;
                background-color: #555 !important;
                border-radius: 4px !important;
            }
            html::-webkit-scrollbar-thumb:hover,
            body.cf-ilmenite-custom-scrollbars::-webkit-scrollbar-thumb:hover {
                background: #666 !important;
                background-color: #666 !important;
            }
            html::-webkit-scrollbar-corner,
            body.cf-ilmenite-custom-scrollbars::-webkit-scrollbar-corner {
                background: #2a2a2a !important;
                background-color: #2a2a2a !important;
            }

            /* Internal scrollbars (inverted by body filter) */
            body.cf-ilmenite-custom-scrollbars *::-webkit-scrollbar,
            body *::-webkit-scrollbar {
                width: 8px !important;
                height: 8px !important;
                background: #d5d5d5 !important;
                background-color: #d5d5d5 !important;
            }
            body.cf-ilmenite-custom-scrollbars *::-webkit-scrollbar-track, body.cf-ilmenite-custom-scrollbars *::-webkit-scrollbar-track-piece,
            body *::-webkit-scrollbar-track, body *::-webkit-scrollbar-track-piece {
                background: #d5d5d5 !important;
                background-color: #d5d5d5 !important;
            }
            body.cf-ilmenite-custom-scrollbars *::-webkit-scrollbar-thumb,
            body *::-webkit-scrollbar-thumb {
                background: #aaa !important;
                background-color: #aaa !important;
                border-radius: 4px !important;
            }
            body.cf-ilmenite-custom-scrollbars *::-webkit-scrollbar-thumb:hover,
            body *::-webkit-scrollbar-thumb:hover {
                background: #999 !important;
                background-color: #999 !important;
            }
            body.cf-ilmenite-custom-scrollbars *::-webkit-scrollbar-corner,
            body *::-webkit-scrollbar-corner {
                background: #d5d5d5 !important;
                background-color: #d5d5d5 !important;
            }

            ::selection {
                background-color: #bb86fc;
                color: #121212;
            }
        `;


  if (document.head) {
    document.head.appendChild(styleElement);
  } else {
    const observer = new MutationObserver(() => {
      if (document.head) {
        document.head.appendChild(styleElement);
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }

  browserAPI.storage.local.get("themeCustomSettings", (result) => {
    if (result.themeCustomSettings) {
      applyCustomThemeSettings(result.themeCustomSettings);
    }
  });
};

const applyCustomThemeSettings = (settings) => {
  if (customStyleElement) {
    customStyleElement.remove();
  }

  customStyleElement = document.createElement("style");
  
  // Safe defaults
  const bgHex = settings.bgHex || '#0f0f0f';
  const brightness = settings.brightness !== undefined ? settings.brightness : 100;
  const contrast = settings.contrast !== undefined ? settings.contrast : 100;
  const eyeComfort = settings.eyeComfort !== undefined ? settings.eyeComfort : 0;

  let hexValue = 15; // default for #0f0f0f
  if (bgHex.length === 7) {
    hexValue = parseInt(bgHex.slice(1, 3), 16);
  } else if (bgHex.length === 4) {
    hexValue = parseInt(bgHex.slice(1, 2) + bgHex.slice(1, 2), 16);
  }
  hexValue = isNaN(hexValue) ? 15 : hexValue;
  const invertValue = 100 - (hexValue / 255 * 100);

  const I = invertValue / 100;
  // Calculate exact contrast needed to stretch the crushed dynamic range back to [0, 1]
  const C = (2 * I - 1) !== 0 ? (1 / (2 * I - 1)) * 100 : 100;

  customStyleElement.textContent = `
      html {
        background-color: ${bgHex} !important;
        filter: 
          brightness(${brightness}%) 
          contrast(${contrast}%) 
          sepia(${eyeComfort}%) !important;
      }
      body {
        filter: invert(${invertValue}%) hue-rotate(160deg) !important;
      }
      /* Perfectly undo the body filter for images */
      .cf-ilmenite-no-invert, img, picture, video, iframe, canvas, .legendColorBox, #legend_unordered_list li svg, .welldone, #heatmap-tooltip, #cf-heatmap svg rect:not([fill="#ebedf0"]) {
        filter: hue-rotate(-160deg) invert(100%) contrast(${Math.abs(C)}%) !important;
      }
    `;

  if (document.head) {
    document.head.appendChild(customStyleElement);
  } else {
    const observer = new MutationObserver(() => {
      if (document.head) {
        document.head.appendChild(customStyleElement);
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
};

const sortToggleImgInvert = () => {
  if (!currentURL.includes("codeforces.com/problemset")) {
    return;
  }
  const anchorElements = document.querySelectorAll("a.non-decorated");

  anchorElements.forEach((anchor) => {
    const imgElements = anchor.querySelectorAll("img");
    if (imgElements && imgElements.length > 1) {
      imgElements[1].classList.add("custom-image");
    }
  });
};

const removeSortToggleImgInvert = () => {
  if (!currentURL.includes("codeforces.com/problemset")) {
    return;
  }
  const anchorElements = document.querySelectorAll("a.non-decorated");

  anchorElements.forEach((anchor) => {
    const imgElements = anchor.querySelectorAll("img");
    if (imgElements && imgElements.length > 1) {
      imgElements[1].classList.remove("custom-image");
    }
  });
};
