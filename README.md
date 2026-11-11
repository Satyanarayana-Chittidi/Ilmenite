# Ilmenite

<p align="center">
  <strong>The Ultimate In-Browser Competitive Programming Environment, Distributed Cloud Synchronization, and Code Execution Engine for Codeforces</strong>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/ilmenite/oanffehmigchhkjfeccpdkmmonpbbapc"><strong>Chrome Web Store</strong></a> &bull;
  <a href="https://ilmenite.vercel.app"><strong>Official Website</strong></a> &bull;
  <a href="https://ilmenite.onrender.com"><strong>Backend API</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension Manifest V3" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Monaco_Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MySQL_8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL 8.0" />
  <img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF" alt="Razorpay" />
  <img src="https://img.shields.io/badge/Brevo-0B99FF?style=for-the-badge&logo=brevo&logoColor=white" alt="Brevo" />
</p>

---

## Live Deployments & Store

- **Chrome Web Store:** https://chromewebstore.google.com/detail/ilmenite/oanffehmigchhkjfeccpdkmmonpbbapc  
  Official Chrome Extension available for instant installation.

- **Web Application / Landing:** https://ilmenite.vercel.app  
  Official product showcase and subscription checkout deployed on Vercel.

- **Backend API Service:** https://ilmenite.onrender.com  
  REST API, authentication, sandboxed code execution, and cloud synchronization deployed on Render.

- **Database:** TiDB Cloud (MySQL 8.0 Compatible)  
  High-availability distributed relational database hosting user profiles, problem code versions, snippets, and subscriptions.

---

## Platform Overview

Ilmenite is an end-to-end full-stack platform engineered to modernize competitive programming workflows on Codeforces. It seamlessly injects an in-browser VS Code (Monaco) IDE, customizable testcase runner, and multi-device cloud synchronization directly alongside problem statements.

By eliminating context-switching between external editors, local terminals, and the browser, Ilmenite drastically cuts down solution submission time and enables competitive programmers to code, debug, and submit with zero friction.

### What the Platform Offers

- **In-Browser Monaco IDE:** Embedded Visual Studio Code engine with syntax highlighting for C++, Python, Java, and JavaScript, intelligent autocomplete, and optional Vim keybindings.
- **Custom Testcase Runner:** Execute code against unlimited user-defined testcases with instant diffs between expected and actual outputs.
- **Sandboxed In-House Code Runner:** Multi-language backend compilation and execution with strict execution limits, memory bounds, and automated fallback to Judge0.
- **Cloud Code & Settings Synchronization:** Automatically saves problem solutions and user preferences (editor theme, snippets, templates, font size) across all devices.
- **Dual Authentication System:** Email + Password registration with Brevo 6-digit OTP verification, plus one-click GitHub OAuth sync.
- **Subscription & Payment Processing:** Integrated Razorpay checkout with webhook signature verification for Pro tier feature upgrades.
- **Customizable Appearance:** Rich dark/light themes, customizable code editor themes, and responsive layouts.

---

## System Architecture

Ilmenite operates as a distributed full-stack architecture:

### 1. Browser Extension (React 18, Monaco Editor, Tailwind CSS, Zustand, Manifest V3)
- Injected directly into Codeforces problem pages with zero latency.
- Manages local editor states, testcase diff calculations, and settings persistence.
- Communicates with the backend API via authenticated JWT requests.

### 2. Backend Service (Node.js, Express, TypeScript, Brevo API, Razorpay SDK)
- Serves endpoints for user authentication, registration OTP dispatch via Brevo HTTP API, code synchronization, and Razorpay billing.
- Executes untrusted user code in process-isolated environments with wall-clock time limit enforcement.

### 3. Distributed Database (MySQL 8.0 / TiDB Cloud)
- Stores user accounts, hashed credentials, temporary OTPs, problem code versions, user snippets, and subscription transaction logs.
- Guarantees transactional consistency and ACID compliance for subscription and authentication workflows.

---

## Local Setup and Installation

### Prerequisites

- Node.js (version 20 or higher)
- MySQL (version 8.0 or higher) or TiDB Cloud instance
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Satyanarayana-Chittidi/Ilmenite.git
cd Ilmenite
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Configure `.env` in `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ilmenite_db
JWT_SECRET=your_jwt_secret
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@ilmenite.dev
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Initialize the database schema:

```bash
npm run init-db
npm run dev
```

### 3. Chrome Extension Setup

```bash
cd ..
npm install
npm run build:dev
```

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `dist/` directory.
4. Open any problem page on [Codeforces](https://codeforces.com/problemset) to launch Ilmenite.

---

## License

Distributed under the MIT License. Designed and developed by [Satyanarayana Chittidi](https://github.com/Satyanarayana-Chittidi).
