(function () {
	// Check if we are on a Codeforces problem page
	const isProblemPage =
		/^\/(?:problemset\/problem\/|contest\/\d+\/problem\/)/.test(
			window.location.pathname,
		);

	if (!isProblemPage) return;
	if (document.getElementById("ilmenite-editor-iframe")) return;

	// Hardcode styles inline to guarantee layout overrides regardless of CSS issues
	const sidebar = document.getElementById("sidebar");
	if (sidebar) sidebar.style.setProperty("display", "none", "important");



	const browserAPI = typeof browser !== "undefined" ? browser : chrome;

	let panelWidth = 420; // will be updated from storage
	let isPanelOpen = true;
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

	browserAPI.storage.local.get(["sidePanelWidth", "theme", "supabaseAvatar"]).then((result) => {
		isDark = result.theme !== "light";

		const btnContainer = document.createElement("div");
		btnContainer.id = "ilmenite-floating-btns";
		btnContainer.style.position = "fixed";
		btnContainer.style.top = "20px";
		btnContainer.style.right = "20px";
		btnContainer.style.display = "none";
		btnContainer.style.flexDirection = "column";
		btnContainer.style.gap = "8px";
		btnContainer.style.zIndex = "999990";

		const updateBtnStyles = () => {
			const bg = isDark ? "#2a2a2a" : "#e5e7eb";
			const color = isDark ? "#ffffff" : "#444444";
			[openBtn, themeBtn].forEach(btn => {
				btn.style.backgroundColor = bg;
				btn.style.color = color;
			});
			const iconSvg = themeBtn.querySelector("svg");
			if (iconSvg) iconSvg.setAttribute("class", "ilmenite-theme-icon " + (isDark ? "dark" : "light"));
            
            const existingIframe = document.getElementById("ilmenite-editor-iframe");
            if (existingIframe) {
                existingIframe.style.borderLeft = "none";
                existingIframe.style.boxShadow = isDark ? "-2px 0 5px rgba(0,0,0,0.5)" : "none";
                existingIframe.style.backgroundColor = isDark ? "#1e1e1e" : "#ffffff";
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
			<mask id="ilmenite-moon-mask"><rect x="0" y="0" width="100%" height="100%" fill="white" /><circle class="ilmenite-mask-circle" cx="12" cy="4" r="6" fill="black" /></mask>
			<circle class="ilmenite-main-circle" cx="12" cy="12" r="9" mask="url(#ilmenite-moon-mask)" fill="currentColor" />
			<g class="ilmenite-sun-rays">
				<line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
				<line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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

		btnContainer.appendChild(openBtn);
		btnContainer.appendChild(themeBtn);
		document.documentElement.appendChild(btnContainer);
		let defaultWidth = document.documentElement.clientWidth * 0.3;
		if (document.documentElement.clientWidth - defaultWidth < 960) {
			defaultWidth = Math.max(40, document.documentElement.clientWidth - 960);
		}
		panelWidth = result.sidePanelWidth || defaultWidth;
		if (panelWidth > document.documentElement.clientWidth - 500) {
			panelWidth = Math.max(40, document.documentElement.clientWidth - 500);
		}

		const iframe = document.createElement("iframe");
		iframe.id = "ilmenite-editor-iframe";
		const isLive = document.querySelector('.countdown') ? 'true' : 'false';
		iframe.src = browserAPI.runtime.getURL("index.html") + "?url=" + encodeURIComponent(window.location.href) + "&isLive=" + isLive;
		iframe.allow = "clipboard-read; clipboard-write";

		const style = document.createElement("style");
		style.textContent = `
      iframe#ilmenite-editor-iframe {
          filter: none !important;
      }
      #sidebar {
          display: none !important;
      }



    `;
		document.documentElement.appendChild(style);

		iframe.style.position = "fixed";
		iframe.style.top = "0";
		iframe.style.right = "0";
		iframe.style.width = `${panelWidth}px`;
		iframe.style.height = "100vh";
		iframe.style.border = "none";
		iframe.style.borderLeft = "none";
		iframe.style.boxShadow = isDark ? "-2px 0 5px rgba(0,0,0,0.5)" : "none";
		iframe.style.zIndex = "999999";
		iframe.style.backgroundColor = isDark ? "#1e1e1e" : "#ffffff";

		const resizer = document.createElement("div");
		resizer.id = "ilmenite-editor-resizer";
		resizer.style.position = "fixed";
		resizer.style.top = "0";
		resizer.style.right = `${panelWidth}px`;
		resizer.style.width = "8px";
		resizer.style.height = "100vh";
		resizer.style.cursor = "ew-resize";
		resizer.style.zIndex = "1000000";
		resizer.style.backgroundColor = "transparent";

		resizer.addEventListener(
			"mouseenter",
			() => (resizer.style.backgroundColor = "transparent"),
		);
		resizer.addEventListener(
			"mouseleave",
			() => (resizer.style.backgroundColor = "transparent"),
		);

		// Transparent spacer to allow scrolling when iframe overlaps
		const scrollSpacer = document.createElement('div');
		scrollSpacer.id = 'cf-ilmenite-scroll-spacer';
		scrollSpacer.style.height = '1px';
		scrollSpacer.style.position = 'absolute';
		scrollSpacer.style.top = '0';
		scrollSpacer.style.left = '100%';
		scrollSpacer.style.width = '0px';
		document.body.appendChild(scrollSpacer);

		document.documentElement.appendChild(iframe);
		document.documentElement.appendChild(resizer);

		const pageContent = document.getElementById("pageContent");

		function openPanel() {
			isPanelOpen = true;
			iframe.style.display = "block";
			resizer.style.display = "block";
			btnContainer.style.display = "none";

			document.body.classList.add("cf-ilmenite-panel-open");

			document.documentElement.style.overflowY = "auto";
			document.documentElement.style.overflowX = "hidden";
			document.body.style.position = "relative";
			document.body.style.marginLeft = "0";
			document.body.style.marginRight = "0";
			document.body.style.width = "100%";
			document.body.style.paddingRight = `${panelWidth}px`;
			document.body.style.height = "auto";
			document.body.style.minHeight = "100vh";
			document.body.style.overflowX = "hidden";
			document.body.style.boxSizing = "border-box";
			
			scrollSpacer.style.width = Math.max(0, panelWidth - 420) + "px";
		}

		function closePanel() {
			isPanelOpen = false;
			iframe.style.display = "none";
			resizer.style.display = "none";
			btnContainer.style.display = "flex"; 

			document.body.classList.remove("cf-ilmenite-panel-open");

			document.documentElement.style.overflowY = "";
			document.documentElement.style.overflowX = "";
			document.body.style.position = "";
			document.body.style.marginLeft = "";
			document.body.style.marginRight = "";
			document.body.style.width = "";
			document.body.style.paddingRight = "";
			document.body.style.height = "";
			document.body.style.minHeight = "";
			document.body.style.overflowX = "";
			document.body.style.boxSizing = "";
			
			scrollSpacer.style.width = "0px";
		}

		openPanel();
		openBtn.addEventListener("click", openPanel);

        // Listen for close message from React app
        const extensionOrigin = browserAPI.runtime.getURL('').replace(/\/$/, '');
        window.addEventListener('message', (event) => {
            // Only accept close messages from the extension's own iframe
            if (event.origin !== extensionOrigin && event.origin !== '') return;
            if (event.data && event.data.type === 'CLOSE_CF_ILMENITE_IFRAME') {
                closePanel();
            }
            if (event.data && event.data.type === 'CF_EXPAND_PANEL') {
                panelWidth = 420;
                iframe.style.width = `${panelWidth}px`;
                resizer.style.right = `${panelWidth}px`;
                document.body.style.paddingRight = `${panelWidth}px`;
                scrollSpacer.style.width = Math.max(0, panelWidth - 420) + "px";
                browserAPI.storage.local.set({ sidePanelWidth: panelWidth });
            }
        });

		let isResizing = false;
        let resizeOffsetX = 0;
		let animationFrameId = null;

		const onMouseMove = (e) => {
			if (!isResizing) return;

			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}

			animationFrameId = requestAnimationFrame(() => {
				let newWidth = document.documentElement.clientWidth - e.clientX - resizeOffsetX;
				if (newWidth <= 45) {
					newWidth = 40;
				}
				if (newWidth > document.documentElement.clientWidth - 500)
					newWidth = document.documentElement.clientWidth - 500;

				panelWidth = newWidth;
				iframe.style.width = `${panelWidth}px`;
				resizer.style.right = `${panelWidth}px`;

				document.body.style.width = "100%";
				document.body.style.paddingRight = `${panelWidth}px`;
				
				scrollSpacer.style.width = Math.max(0, panelWidth - 420) + "px";
				
				browserAPI.storage.local.set({ sidePanelWidth: panelWidth });
			});
		};

		const onMouseUp = () => {
			if (isResizing) {
				isResizing = false;
				document.documentElement.style.userSelect = "";
				document.body.style.userSelect = "";
				iframe.style.pointerEvents = "";
				browserAPI.storage.local.set({ sidePanelWidth: panelWidth });
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			}
		};

		resizer.addEventListener("mousedown", (e) => {
			e.preventDefault();
			isResizing = true;
            resizeOffsetX = document.documentElement.clientWidth - e.clientX - panelWidth;
			document.documentElement.style.userSelect = "none";
			document.body.style.userSelect = "none";
			iframe.style.pointerEvents = "none";
			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		});

		// Move profile link and logout buttons to the secondary menu on problem pages
		if (document.querySelector('.problem-statement')) {
			const langChooser = document.querySelector('.lang-chooser');
			const secondLevelMenu = document.querySelector('.second-level-menu');
			
			if (langChooser && langChooser.children.length > 1 && secondLevelMenu) {
				const profileDiv = langChooser.lastElementChild;
				const links = profileDiv.querySelectorAll('a');
				
				if (links.length >= 2) {
					const profileLink = links[0];
					const isLoggedIn = profileLink.href.includes('/profile/');
					
					// Create upgraded profile container
					const upgradedProfile = document.createElement('div');
					upgradedProfile.style.display = 'flex';
					upgradedProfile.style.alignItems = 'center';
					upgradedProfile.style.gap = '8px';
					upgradedProfile.style.position = 'relative'; // For dropdown anchoring
					upgradedProfile.style.flexShrink = '0'; // Prevent shrinking before morphing
					
					let handleText = null;

					if (isLoggedIn) {
						upgradedProfile.style.cursor = 'pointer';
						const handle = profileLink.textContent.trim();
						const logoutLink = links[1];
						
						// Profile Header (Visible part)
						const profileHeader = document.createElement('div');
						profileHeader.style.display = 'flex';
						profileHeader.style.alignItems = 'center';
						profileHeader.style.gap = '8px';

						// Create circular image
						const img = document.createElement('img');
						img.style.width = '30px';
						img.style.height = '30px';
						img.style.borderRadius = '50%';
						img.style.objectFit = 'cover';
						img.style.border = '1px solid #ddd'; // clean single circle
						
						// Fetch avatar
						fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
							.then(res => res.json())
							.then(data => {
								if (data.status === 'OK' && data.result.length > 0) {
									img.src = data.result[0].avatar;
								}
							})
							.catch(e => console.error(e));
							
						// Create clean handle text
						handleText = document.createElement('span'); 
						handleText.className = 'cf-ilmenite-profile-handle';
						handleText.textContent = handle;
						handleText.style.setProperty('color', '#000000', 'important'); // Overridden in inject-styles for dark mode if needed
						handleText.style.setProperty('font-weight', 'normal', 'important');
						
						profileHeader.appendChild(img);
						profileHeader.appendChild(handleText);
						
						// Dropdown container
						const dropdown = document.createElement('div');
						dropdown.className = 'cf-ilmenite-no-invert'; // Tell Ilmenite dark mode to ignore us
						dropdown.style.position = 'absolute';
						dropdown.style.top = '100%';
						dropdown.style.right = '50%';
						dropdown.style.transform = 'translateX(50%) translateY(-10px)'; // Center dropdown relative to profile header and move up slightly
						dropdown.style.marginTop = '10px';
						dropdown.style.backgroundColor = '#1e1e1e';
						dropdown.style.border = '1px solid #333333';
						dropdown.style.borderRadius = '12px';
						dropdown.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
						dropdown.style.padding = '10px';
						dropdown.style.display = 'flex';
						dropdown.style.flexDirection = 'row';
						dropdown.style.gap = '10px';
						dropdown.style.zIndex = '100';
						dropdown.style.opacity = '0';
						dropdown.style.visibility = 'hidden';
						dropdown.style.transition = 'opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease';
						dropdown.style.pointerEvents = 'none'; // prevent clicks when hidden
						
						const createTile = (iconSvg, text, bgColor, color) => {
							const tile = document.createElement('div');
							tile.style.display = 'flex';
							tile.style.flexDirection = 'column';
							tile.style.alignItems = 'center';
							tile.style.justifyContent = 'center';
							tile.style.width = '80px';
							tile.style.height = '80px';
							tile.style.backgroundColor = bgColor;
							tile.style.color = color;
							tile.style.borderRadius = '8px';
							tile.style.cursor = 'pointer';
							tile.style.transition = 'filter 0.2s';
							
							const iconDiv = document.createElement('div');
							iconDiv.innerHTML = iconSvg;
							iconDiv.style.marginBottom = '8px';
							
							const textSpan = document.createElement('span');
							textSpan.textContent = text;
							textSpan.style.fontSize = '12px';
							textSpan.style.fontWeight = '500';
							
							tile.appendChild(iconDiv);
							tile.appendChild(textSpan);
							
							tile.onmouseover = () => tile.style.filter = 'brightness(1.2)';
							tile.onmouseout = () => tile.style.filter = 'brightness(1)';
							
							return tile;
						};
						
						const viewProfileTile = createTile(
							`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
							'Profile',
							'#333333', // Normal grey
							'#ffffff'
						);
						viewProfileTile.onclick = (e) => {
							e.stopPropagation();
							window.location.href = profileLink.href;
						};
						
						const logoutTile = createTile(
							`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
							'Logout',
							'#dc2626', // Red
							'#ffffff'
						);
						logoutTile.onclick = (e) => {
							e.stopPropagation();
							window.location.href = logoutLink.href;
						};
						
						dropdown.appendChild(viewProfileTile);
						dropdown.appendChild(logoutTile);
						
						upgradedProfile.appendChild(profileHeader);
						upgradedProfile.appendChild(dropdown);
						
						// Toggle logic
						let isOpen = false;
						upgradedProfile.addEventListener('click', (e) => {
							e.stopPropagation();
							isOpen = !isOpen;
							dropdown.style.opacity = isOpen ? '1' : '0';
							dropdown.style.visibility = isOpen ? 'visible' : 'hidden';
							dropdown.style.transform = isOpen ? 'translateX(50%) translateY(0)' : 'translateX(50%) translateY(-10px)';
							dropdown.style.pointerEvents = isOpen ? 'auto' : 'none';
						});
						
						// Close on outside click
						document.addEventListener('click', () => {
							if (isOpen) {
								isOpen = false;
								dropdown.style.opacity = '0';
								dropdown.style.visibility = 'hidden';
								dropdown.style.transform = 'translateX(50%) translateY(-10px)';
								dropdown.style.pointerEvents = 'none';
							}
						});
					} else {
						// Logged out state - show Enter / Register parallel to menu
						const enterLink = document.createElement('a');
						enterLink.href = '/enter';
						enterLink.textContent = 'Enter';
						enterLink.style.padding = '6px 16px';
						enterLink.style.backgroundColor = '#197AF6';
						enterLink.style.setProperty('color', '#ffffff', 'important');
						enterLink.style.textDecoration = 'none';
						enterLink.style.borderRadius = '6px';
						enterLink.style.fontWeight = 'normal';
						enterLink.style.fontSize = '14px';

						const registerLink = document.createElement('a');
						registerLink.href = '/register';
						registerLink.textContent = 'Register';
						registerLink.style.padding = '6px 16px';
						registerLink.style.backgroundColor = '#e0e0e0';
						registerLink.style.setProperty('color', '#333333', 'important');
						registerLink.style.textDecoration = 'none';
						registerLink.style.borderRadius = '6px';
						registerLink.style.fontWeight = 'normal';
						registerLink.style.fontSize = '14px';
						
						upgradedProfile.appendChild(enterLink);
						upgradedProfile.appendChild(registerLink);
					}
					
					// Move parallel to PRIMARY menu (.menu-box)
					const menuBox = document.querySelector('.menu-box');
					if (menuBox) {
						const primaryWrapper = document.createElement('div');
						primaryWrapper.style.display = 'flex';
						primaryWrapper.style.alignItems = 'center';
						primaryWrapper.style.justifyContent = 'space-between';
						primaryWrapper.style.width = '100%';
						primaryWrapper.style.marginBottom = '0px'; // Changed to 0px per user request
						
						menuBox.style.marginBottom = '0';
						menuBox.style.marginLeft = '0';
						
						menuBox.parentNode.insertBefore(primaryWrapper, menuBox);
						primaryWrapper.appendChild(menuBox);
						primaryWrapper.appendChild(upgradedProfile);
						
						// Dynamic exact-pixel morphing without hardcoded breakpoints
						let handleWidth = 0;
						const resizeObserver = new ResizeObserver(entries => {
							for (let entry of entries) {
								if (handleText) {
									if (handleWidth === 0 && handleText.offsetWidth > 0) {
										handleWidth = handleText.offsetWidth;
									}
									// Required width = menuBox + image(30) + gap(8) + handle + safety margin(20)
									const requiredWidth = menuBox.offsetWidth + 30 + 8 + (handleWidth || 150) + 20;
									if (entry.contentRect.width < requiredWidth) {
										handleText.style.setProperty('display', 'none', 'important');
									} else {
										handleText.style.setProperty('display', 'block', 'important');
									}
								}
							}
						});
						resizeObserver.observe(primaryWrapper);
					}
					
					// Hide original profileDiv
					profileDiv.style.display = 'none';
					
					// Hide the now empty header to save vertical space
					const header = document.getElementById('header');
					if (header) {
						header.style.setProperty('display', 'none', 'important');
					}
				}
			}
		}

		// === NEW: Extract Contest Number and Inject Problem Title, Tags, Limits ===
		const problemStatement = document.querySelector('.problem-statement');
		if (problemStatement) {
			const problemHeader = problemStatement.querySelector('.header');
			if (problemHeader) {
				// 1. Refactor Title and Inject Tags
				const titleEl = problemHeader.querySelector('.title');
				if (titleEl) {
					const match = window.location.href.match(/(?:contest|gym|problemset\/problem)\/(\d+)/);
					if (match) {
						const contestNumber = match[1];
						const origText = titleEl.textContent.trim();
						
						// Don't inject if it's already there (e.g. 1997-A.)
						if (!origText.startsWith(contestNumber + '-')) {
							const spaceIdx = origText.indexOf(' ');
							if (spaceIdx !== -1) {
								const letterPart = origText.substring(0, spaceIdx);
								const namePart = origText.substring(spaceIdx + 1);
								
								titleEl.style.fontSize = '1em'; // Reset base so % scales precisely to body
								titleEl.style.lineHeight = '1.2';
								titleEl.innerHTML = `<span style="font-size: 175%; font-weight: bold;">${contestNumber}-${letterPart}</span> <span style="font-size: 175%; font-weight: bold;">${namePart}</span>`;
							} else {
								titleEl.style.fontSize = '1em';
								titleEl.style.lineHeight = '1.2';
								titleEl.innerHTML = `<span style="font-size: 175%; font-weight: bold;">${contestNumber}-${origText}</span>`;
							}
						}
					}
					// Left align the entire header for consistency with the left-aligned title
					problemHeader.style.setProperty('text-align', 'left', 'important');
					
					// --- Tags and Rating Pills ---
					const tagsContainer = document.createElement('div');
					tagsContainer.style.display = 'flex';
					tagsContainer.style.alignItems = 'center';
					tagsContainer.style.gap = '8px';
					tagsContainer.style.marginTop = '12px';
					tagsContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';

					let ratingStr = "Unrated";
					let r = NaN;
					const tagsList = [];
					document.querySelectorAll('.tag-box').forEach(tag => {
						if (tag.title.trim() === 'Difficulty') {
							ratingStr = tag.textContent.trim();
							r = parseInt(ratingStr.replace('*', ''));
						} else {
							tagsList.push(tag.textContent.trim());
						}
					});

					// Base pill styles for uniform layout
					const applyPillStyles = (el, height = '20px') => {
						el.style.padding = '4px 12px';
						el.style.height = height;
						el.style.boxSizing = 'content-box';
						el.style.borderRadius = '9999px';
						el.style.fontSize = '12px';
						el.style.fontWeight = '600';
						el.style.display = 'inline-flex';
						el.style.alignItems = 'center';
						el.style.justifyContent = 'center';
						el.style.lineHeight = '1';
					};

					// 1. Difficulty Pill
					let diffText = "Unrated";
					let diffClass = '';
					let diffBg = '#f0f0f0';
					let diffColor = '#333333';
					
					if (!isNaN(r)) {
						if (r < 1200) { diffText = "Easy"; diffClass = 'user-green'; diffBg = 'rgba(0, 128, 0, 0.15)'; diffColor = null; }
						else if (r < 1900) { diffText = "Medium"; diffClass = 'user-orange'; diffBg = 'rgba(255, 140, 0, 0.15)'; diffColor = null; }
						else { diffText = "Hard"; diffClass = 'user-red'; diffBg = 'rgba(255, 0, 0, 0.15)'; diffColor = null; }
					}

					const difficultyPill = document.createElement('div');
					if (diffClass) difficultyPill.className = diffClass;
					applyPillStyles(difficultyPill);
					difficultyPill.style.backgroundColor = diffBg;
					if (diffColor) difficultyPill.style.color = diffColor;
					difficultyPill.textContent = diffText;
					tagsContainer.appendChild(difficultyPill);

					// 2. Rating Pill
					let displayRating = ratingStr;
					if (ratingStr !== "Unrated") {
						displayRating = ratingStr.replace('*', '').trim();
					}
					
					const ratingPill = document.createElement('div');
					applyPillStyles(ratingPill);
					ratingPill.style.backgroundColor = '#f0f0f0';
					ratingPill.style.color = '#333333';
					ratingPill.textContent = displayRating;
					tagsContainer.appendChild(ratingPill);

					// 3. Topics Pill
					const topicsPill = document.createElement('button');
					applyPillStyles(topicsPill);
					topicsPill.style.gap = '6px';
					topicsPill.style.backgroundColor = '#f0f0f0';
					topicsPill.style.color = '#333333';
					topicsPill.style.border = 'none';
					topicsPill.style.cursor = 'pointer';
					topicsPill.style.transition = 'filter 0.2s, background-color 0.2s';
					
					topicsPill.onmouseover = () => topicsPill.style.filter = 'brightness(0.95)';
					topicsPill.onmouseout = () => topicsPill.style.filter = 'brightness(1)';

					topicsPill.innerHTML = `<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg> Topics`;
					
					tagsContainer.appendChild(topicsPill);
					
					const expandedTags = document.createElement('div');
					expandedTags.style.display = 'flex';
					expandedTags.style.flexWrap = 'wrap';
					expandedTags.style.gap = '6px';
					expandedTags.style.marginTop = '0px';
					expandedTags.style.fontFamily = 'system-ui, -apple-system, sans-serif';
					expandedTags.style.maxHeight = '0px';
					expandedTags.style.opacity = '0';
					expandedTags.style.overflow = 'hidden';
					expandedTags.style.transition = 'max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease';
					
					if (tagsList.length === 0) {
						const tPill = document.createElement('div');
						applyPillStyles(tPill);
						tPill.style.fontWeight = '500';
						tPill.style.backgroundColor = '#f0f0f0';
						tPill.style.color = '#555555';
						tPill.textContent = "No topics";
						expandedTags.appendChild(tPill);
					} else {
						tagsList.forEach(t => {
							const tPill = document.createElement('div');
							applyPillStyles(tPill);
							tPill.style.fontWeight = '500';
							tPill.style.backgroundColor = '#f0f0f0';
							tPill.style.color = '#555555';
							tPill.textContent = t;
							expandedTags.appendChild(tPill);
						});
					}
					
					topicsPill.onclick = () => {
						if (expandedTags.style.maxHeight === '0px') {
							expandedTags.style.maxHeight = '200px';
							expandedTags.style.opacity = '1';
							expandedTags.style.marginTop = '12px';
							topicsPill.style.backgroundColor = '#e0e0e0';
						} else {
							expandedTags.style.maxHeight = '0px';
							expandedTags.style.opacity = '0';
							expandedTags.style.marginTop = '0px';
							topicsPill.style.backgroundColor = '#f0f0f0';
						}
					};
					
					titleEl.parentNode.insertBefore(tagsContainer, titleEl.nextSibling);
					titleEl.parentNode.insertBefore(expandedTags, tagsContainer.nextSibling);
				}

				// 2. Refactor Constraints
				const timeLimit = problemHeader.querySelector('.time-limit');
				const memoryLimit = problemHeader.querySelector('.memory-limit');
				const inputSpec = problemStatement.querySelector('.input-specification');
				
				if (timeLimit && memoryLimit && inputSpec) {
					const constraintsSec = document.createElement('div');
					constraintsSec.className = 'constraints-specification';
					
					const secTitle = document.createElement('div');
					secTitle.className = 'section-title';
					secTitle.textContent = 'Constraints';
					constraintsSec.appendChild(secTitle);
					
					const constraintsText = document.createElement('p');
					
					const formatConstraint = (el) => {
						const pt = el.querySelector('.property-title');
						if (pt && pt.nextSibling) {
							const titleText = pt.textContent.trim();
							const title = titleText.charAt(0).toUpperCase() + titleText.slice(1);
							return title + " : " + pt.nextSibling.textContent.trim();
						}
						return el.textContent.trim();
					};
					
					constraintsText.innerHTML = formatConstraint(timeLimit) + "<br/>" + formatConstraint(memoryLimit);
					constraintsSec.appendChild(constraintsText);
					
					inputSpec.parentNode.insertBefore(constraintsSec, inputSpec);
					
					timeLimit.style.display = 'none';
					memoryLimit.style.display = 'none';
				}
			}

			// Add horizontal rules between major problem sections
			const addHrBefore = (el) => {
				if (el && el.parentNode) {
					const hr = document.createElement('hr');
					hr.style.cssText = 'border: 0 !important; border-top: 1px solid rgba(128, 128, 128, 0.2) !important; margin: 5px 0 10px 0 !important; padding: 0 !important;';
					el.parentNode.insertBefore(hr, el);
				}
			};
			
			const constraintsEl = problemStatement.querySelector('.constraints-specification');
			const inputEl = problemStatement.querySelector('.input-specification');
			const outputEl = problemStatement.querySelector('.output-specification');
			const sampleEl = problemStatement.querySelector('.sample-tests');
			
			if (constraintsEl) addHrBefore(constraintsEl);
			else if (inputEl) addHrBefore(inputEl);
			
			if (constraintsEl && inputEl) addHrBefore(inputEl);
			addHrBefore(outputEl);
			addHrBefore(sampleEl);

			// === NEW: Virtual Contest & Contest Materials Migration ===
			let vcBox = null;
			let vcUrl = null;
			let materialsBox = null;

			// Find relevant boxes in the right sidebar
			document.querySelectorAll('.roundbox.sidebox').forEach(box => {
				const title = box.querySelector('.caption.titled');
				if (title) {
					const text = title.textContent.toLowerCase();
					if (text.includes('virtual participation') || text.includes('virtual contest')) {
						vcBox = box;
						const vcForm = box.querySelector('form');
						const link = box.querySelector('a');
						if (vcForm) vcUrl = vcForm.action;
						else if (link) vcUrl = link.href;
					}
					if (text.includes('contest materials')) {
						materialsBox = box;
					}
				}
			});

			// Fallback URL generation if we can't find a box
			if (!vcUrl) {
				const match = window.location.href.match(/(?:contest)\/(\d+)/);
				if (match) {
					vcUrl = `/contest/${match[1]}/virtual`;
				}
			}

			// 1. Add Virtual Contest to secondary menu
			const secondLevelMenuList = document.querySelector('.second-level-menu-list');
			if (secondLevelMenuList && vcUrl) {
				const vcLi = document.createElement('li');
				const vcLink = document.createElement('a');
				vcLink.href = vcUrl;
				vcLink.textContent = "Virtual Contest";
				vcLink.style.fontWeight = 'bold';
				vcLi.appendChild(vcLink);
				secondLevelMenuList.appendChild(vcLi);

				// Use vanilla JS with CSS transitions to mimic the jQuery "backout" easing
				// This avoids Content Security Policy (CSP) inline script violations
				const back = secondLevelMenuList.querySelector('li.backLava');
				if (back) {
					vcLi.addEventListener('mouseenter', () => {
						back.style.transition = 'all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
						back.style.left = vcLi.offsetLeft + 'px';
						back.style.top = vcLi.offsetTop + 'px';
						back.style.width = vcLi.offsetWidth + 'px';
						back.style.height = vcLi.offsetHeight + 'px';
					});
					
					vcLi.addEventListener('mouseleave', () => {
						let curr = secondLevelMenuList.querySelector('li.current');
						if (!curr) curr = secondLevelMenuList.querySelector('li:first-child');
						if (curr) {
							back.style.left = curr.offsetLeft + 'px';
							back.style.top = curr.offsetTop + 'px';
							back.style.width = curr.offsetWidth + 'px';
							back.style.height = curr.offsetHeight + 'px';
						}
					});
				}
			}

			// Hide original VC box to clean up sidebar
			if (vcBox) {
				vcBox.style.display = 'none';
			}

			// 2. Migrate Contest Materials to very bottom of problem page
			if (materialsBox) {
				materialsBox.parentNode.removeChild(materialsBox);
				
				// Create the new accordion container
				const accordion = document.createElement('div');
				accordion.style.marginTop = '20px';
				accordion.style.borderTop = '1px solid rgba(128, 128, 128, 0.2)';
				accordion.style.borderBottom = '1px solid rgba(128, 128, 128, 0.2)';
				accordion.style.padding = '12px 0';
				accordion.style.marginBottom = '8px';
				accordion.style.fontFamily = 'system-ui, -apple-system, sans-serif';

				// Create the button as a div to completely bypass native CF button styles
				const toggleBtn = document.createElement('div');
				toggleBtn.style.display = 'flex';
				toggleBtn.style.alignItems = 'center';
				toggleBtn.style.justifyContent = 'space-between';
				toggleBtn.style.width = '100%';
				toggleBtn.style.backgroundColor = 'transparent';
				toggleBtn.style.cursor = 'pointer';
				toggleBtn.style.padding = '0';
				toggleBtn.style.color = 'inherit';
				toggleBtn.style.transition = 'opacity 0.2s';

				const leftSpan = document.createElement('span');
				leftSpan.style.display = 'flex';
				leftSpan.style.alignItems = 'center';
				leftSpan.style.gap = '8px';
				leftSpan.style.fontSize = '14px';
				leftSpan.style.fontWeight = '500';
				leftSpan.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> Contest Materials`;

				const chevronSvg = document.createElement('div');
				chevronSvg.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
				chevronSvg.style.transition = 'transform 0.3s ease';
				chevronSvg.style.display = 'flex';
				chevronSvg.style.alignItems = 'center';
				chevronSvg.style.justifyContent = 'center';

				toggleBtn.appendChild(leftSpan);
				toggleBtn.appendChild(chevronSvg);

				// Create the expanding grid wrapper
				const gridWrapper = document.createElement('div');
				gridWrapper.style.display = 'grid';
				gridWrapper.style.gridTemplateRows = '0fr';
				gridWrapper.style.transition = 'grid-template-rows 0.3s ease-in-out';

				// Create inner hidden content
				const innerHidden = document.createElement('div');
				innerHidden.style.overflow = 'hidden';

				const contentPad = document.createElement('div');
				contentPad.style.paddingTop = '12px';
				contentPad.style.paddingLeft = '24px';

				// Ensure we skip .top-links and grab the actual content div
				const caption = materialsBox.querySelector('.caption');
				const contentDiv = caption ? caption.nextElementSibling : null;
				
				if (contentDiv) {
					contentPad.style.display = 'flex';
					contentPad.style.flexWrap = 'wrap';
					contentPad.style.gap = '10px';
					
					// Delete any "x" buttons natively used by CF
					contentDiv.querySelectorAll('img[src*="close"], .delete-resource-link, img[alt="delete"]').forEach(el => {
						if (el.parentNode && el.parentNode.tagName === 'A') {
							el.parentNode.remove();
						} else {
							el.remove();
						}
					});

					contentDiv.querySelectorAll('a').forEach(a => {
						if (a.classList.contains('delete-resource-link')) {
							a.remove();
							return;
						}
						const img = a.querySelector('img');
						if (img && (img.src.includes('close') || img.alt === 'delete')) {
							a.remove();
							return;
						}

						a.style.display = 'inline-flex';
						a.style.alignItems = 'center';
						a.style.gap = '6px';
						a.style.padding = '4px 14px';
						a.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
						a.style.borderRadius = '9999px'; // Prime style pill
						a.style.textDecoration = 'none';
						a.style.fontWeight = '500';
						a.style.fontSize = '12px';
						a.style.color = 'inherit';
						a.style.transition = 'background-color 0.2s';
						a.onmouseover = () => a.style.backgroundColor = 'rgba(128, 128, 128, 0.2)';
						a.onmouseout = () => a.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
						
						if (img) img.style.display = 'none';
						contentPad.appendChild(a);
					});
				}

				innerHidden.appendChild(contentPad);
				gridWrapper.appendChild(innerHidden);
				
				accordion.appendChild(toggleBtn);
				accordion.appendChild(gridWrapper);

				// Toggle logic
				let isOpen = false;
				toggleBtn.addEventListener('click', () => {
					isOpen = !isOpen;
					gridWrapper.style.gridTemplateRows = isOpen ? '1fr' : '0fr';
					chevronSvg.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
				});

				problemStatement.parentNode.insertBefore(accordion, problemStatement.nextSibling);
			}
		}

		// === NEW: Live Contest Timer Bridge ===
		setInterval(() => {
			const countdownEl = document.querySelector('.countdown');
			if (countdownEl && countdownEl.textContent && countdownEl.textContent.trim().length > 0) {
				const timeStr = countdownEl.textContent.trim();
				if (timeStr.includes(':')) { // Basic validation
					iframe.contentWindow?.postMessage({
						type: 'CF_LIVE_CONTEST_TIMER',
						payload: { time: timeStr, isLive: true }
					}, '*');
				}
			} else {
				iframe.contentWindow?.postMessage({
					type: 'CF_LIVE_CONTEST_TIMER',
					payload: { time: null, isLive: false }
				}, '*');
			}
		}, 1000);

	});
})();

