<div align="center">
  <img src="public/assets/icons/ilmenite_icon.png" alt="Ilmenite Logo" width="128" height="128">
  <h1>Ilmenite</h1>
  <p><strong>The ultimate competitive programming extension for Codeforces.</strong></p>
</div>

---

## ðŸš€ Features

Ilmenite modernizes the standard Codeforces experience and provides advanced tools for top-tier competitive programmers:

* **ðŸŽ¨ Advanced Theme Engine:** Full control over UI colors, brightness, contrast, and eye-comfort modes for late-night coding.
* **âš¡ Code Snippets & Templates:** Stop typing boilerplate. Insert highly customized snippets instantly, and set default templates for different languages.
* **ðŸ§  Auto Suggestions:** Intelligent keyword and variable autocompletion directly inside the Codeforces editor.
* **â˜ï¸ Unlimited Cloud Sync:** Securely back up all your snippets, settings, and templates to the cloud using Supabase.
* **âŒ¨ï¸ Custom Shortcuts:** Navigate the platform at lightning speed without taking your hands off the keyboard.
* **ðŸ§ª Unlimited Testcases:** Add, edit, and run as many custom testcases as you need.

## ðŸ› ï¸ Tech Stack

* **Frontend:** React 18, TypeScript, TailwindCSS
* **Code Editor:** Monaco Editor (with Vim bindings)
* **Bundler:** Webpack 5
* **Backend / Auth:** Supabase (PostgreSQL), GitHub OAuth
* **Monetization:** Lemon Squeezy (via Supabase Edge Functions)

## ðŸ“¦ Developer Setup

If you want to build or modify the extension locally, follow these steps:

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Variables
Before building, you must add your Supabase credentials to `src/utils/supabaseClient.ts`:
``typescript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
``

### 3. Development Mode
Run the Webpack dev server. This will launch a local server for quick UI testing:
```bash
npm run start
```

### 4. Production Build & Packaging
To build the extension for the Chrome Web Store, Microsoft Edge Add-ons, and Mozilla Firefox Add-ons, run the package script:
```bash
npm run package
```
This command automatically compiles production-ready, obfuscated code and creates separate `.zip` files for both Chromium and Firefox engines inside the `extension-releases/` folder.

## âš–ï¸ License
This project is licensed under the MIT License. See the `LICENCE` file for details.

