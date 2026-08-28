<div align="center">
  <img src="public/assets/icons/ilmenite_icon.png" alt="Ilmenite Logo" width="128" height="128">
  <h1>Ilmenite Plus</h1>
  <p><strong>Advanced Competitive Programming Environment for Codeforces</strong></p>
</div>

<div align="center">
  <!-- Insert GitHub badges here, e.g., CI/CD status, version, license -->
  <a href="https://github.com/Satyanarayana-Chittidi/Ilmenite/releases"><img src="https://img.shields.io/github/v/release/Satyanarayana-Chittidi/Ilmenite?style=flat-square" alt="Release Version"></a>
  <a href="https://github.com/Satyanarayana-Chittidi/Ilmenite/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Satyanarayana-Chittidi/Ilmenite?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Firefox-blue?style=flat-square" alt="Supported Platforms">
</div>

<br />

> **[PLACEHOLDER: Insert a high-quality Hero image or GIF demonstrating the extension in action here]**

## Overview

Ilmenite Plus is a high-performance browser extension engineered to modernize the Codeforces platform. Designed specifically for competitive programmers, it seamlessly injects a suite of advanced development tools, customizable environments, and a robust IDE-like experience directly into the browser. 

By eliminating the friction between reading problem statements and writing code, Ilmenite Plus drastically reduces submission times and enhances overall competitive efficiency.

---

## Core Capabilities

### In-Browser IDE Integration
* **Monaco Engine:** Powered by the same core engine that runs Visual Studio Code, providing syntax highlighting, intelligent auto-suggestions, and deep language support.
* **Vim Keybindings:** Native Vim motion integration for developers who rely on keyboard-driven workflows.
* **Custom Snippet Management:** Define, store, and instantly inject complex boilerplate code or algorithmic templates.

> **[PLACEHOLDER: Insert a screenshot of the Monaco Editor active on a Codeforces problem page]**

### Cloud Synchronization
* **Persistent Settings:** All editor configurations, custom keyboard shortcuts, and UI preferences are synced in real-time.
* **Supabase Backend:** Utilizes PostgreSQL and strict Row Level Security (RLS) to securely manage user profiles and JSONB data structures.
* **Multi-Device Support:** Instantly retrieve your personalized workspace environment across any machine upon login.

### Advanced Theme Engine
* **Fluid UI:** GPU-accelerated interfaces and smooth transitions powered by Framer Motion.
* **Extensive Customization:** Granular control over UI colors, brightness, contrast, and dedicated eye-comfort modes tailored for extended coding sessions.

### Competitive Tooling
* **Dynamic Testcase Execution:** Add, modify, and execute unlimited custom test cases directly against your code before submission.
* **Zero-Friction Navigation:** Highly configurable global shortcuts ensure rapid navigation through problem sets and contest leaderboards.

> **[PLACEHOLDER: Insert a screenshot of the Custom Testcases panel or the Settings Dashboard]**

---

## Technical Architecture

Ilmenite Plus is built utilizing a modern, scalable web stack to ensure maximum performance within the constrained environment of a browser extension.

* **Frontend Framework:** React 18
* **Language:** TypeScript
* **Styling:** Tailwind CSS, PostCSS
* **State Management:** Zustand
* **Animations:** Framer Motion
* **Core Integrations:** Monaco Editor API
* **Backend Services:** Supabase (PostgreSQL, Auth)
* **Build System:** Webpack 5, Babel

---

## Installation

### Chrome Web Store
The official, compiled release is available on the Chrome Web Store.
1. Visit the [Ilmenite Plus Web Store Page](#) *(Link coming soon)*.
2. Click **Add to Chrome**.
3. Pin the extension to your toolbar and navigate to Codeforces to begin.

### Manual Installation (Developer Mode)
If you wish to test beta features or run the extension locally:
1. Download the latest ilmenite-chrome-vX.X.X.zip from the [Releases](https://github.com/Satyanarayana-Chittidi/Ilmenite/releases) page.
2. Extract the archive to a local folder.
3. Open your browser and navigate to the Extensions page (chrome://extensions/).
4. Enable **Developer Mode**.
5. Click **Load unpacked** and select the extracted dist directory.

---

## Developer Setup

Contributions to Ilmenite Plus are highly encouraged. Follow the instructions below to set up the local development environment.

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn

### Initializing the Project
`ash
# Clone the repository
git clone https://github.com/Satyanarayana-Chittidi/Ilmenite.git

# Navigate to the project directory
cd Ilmenite

# Install dependencies
npm install
`

### Environment Configuration
To utilize cloud synchronization locally, you must configure the backend infrastructure:
1. Create a Supabase project.
2. Initialize the profiles table with settings (JSONB) and snippets (JSONB) columns.
3. Apply standard PostgreSQL Row Level Security (RLS) policies.
4. Replace the placeholder credentials inside src/utils/supabaseClient.ts with your specific API keys.

### Building and Packaging
Run the Webpack development server for local UI testing:
`ash
npm run start
`

Generate a production-ready build for the browser extension:
`ash
# Compiles minified assets to the /dist folder
npm run build

# Compiles and packages a .zip archive into /extension-releases
npm run package
`

---

## Contributing

We welcome pull requests for bug fixes, feature implementations, and documentation improvements. Please ensure that your code adheres to the existing architectural patterns and passes all ESLint checks before submission.

1. Fork the repository.
2. Create your feature branch (git checkout -b feature/NewFeature).
3. Commit your changes (git commit -m 'Add a sophisticated new feature').
4. Push to the branch (git push origin feature/NewFeature).
5. Open a Pull Request.

---

## License

This project is distributed under the MIT License. See the LICENSE file for more details.
