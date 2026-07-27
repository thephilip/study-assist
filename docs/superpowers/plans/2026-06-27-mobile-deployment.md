# Mobile Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a paid Android app via Google Play by wrapping the existing PWA in a Capacitor shell.

**Architecture:** The existing Vite + React SPA is built with `base: ''` and copied into a Capacitor native project. The Android platform generates a signed AAB for Play Store distribution. One 3-line change in `entitlements.ts` skips brand gating when `VITE_PAID_BUILD=true`.

**Tech Stack:** Capacitor 7, Vite 8, Android Studio (for signing), Google Play Console

---

### Task 1: Add Capacitor Dependencies and npm Script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Capacitor packages**

Run:
```bash
pnpm add @capacitor/core
pnpm add -D @capacitor/cli @capacitor/android
```

`@capacitor/core` goes in `dependencies` (it's the WebView runtime). The CLI and platform packages are dev-only.

Expected output: `@capacitor/core` in `dependencies`, `@capacitor/cli` and `@capacitor/android` in `devDependencies`.

- [ ] **Step 2: Add build:native script**

Open `package.json` and add to the `scripts` block:

```json
"build:native": "vite build --config vite.config.native.ts && npx cap copy"
```

The full scripts block should look like:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "build:native": "vite build --config vite.config.native.ts && npx cap copy"
}
```

- [ ] **Step 3: Verify the script with a dry-run**

Run: `node -e "const p = require('./package.json'); console.log(p.scripts['build:native'])"`
Expected: `vite build --config vite.config.native.ts && npx cap copy`

---

### Task 2: Create capacitor.config.ts

**Files:**
- Create: `capacitor.config.ts`

- [ ] **Step 1: Write the Capacitor config**

Create `capacitor.config.ts` at project root:

```ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.studyassist.app',
  appName: 'Study Assist',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
```

`appId` must match the Google Play package name. `webDir: 'dist'` points to Vite's build output. `androidScheme: 'https'` enables secure context for service workers.

- [ ] **Step 2: Verify the config is valid**

Run: `npx cap doctor` — should only complain about missing platform directories (next task).

---

### Task 3: Create vite.config.native.ts

**Files:**
- Create: `vite.config.native.ts`

- [ ] **Step 1: Write the native Vite config**

Create `vite.config.native.ts` — identical to `vite.config.ts` except `base: ''`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

The only diff from `vite.config.ts`: `base: ''` instead of `base: '/study-assist/'`. This makes all asset paths relative for the native WebView.

- [ ] **Step 2: Verify the build works**

Run: `vite build --config vite.config.native.ts`
Expected: Vite builds to `dist/` with relative asset paths. No `cap copy` yet — Android platform doesn't exist until Task 6.

**Note:** `vite.config.native.ts` gets a `define` block added in Task 5. What you write now will be merged with that change.

---

### Task 4: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add native platform dirs to .gitignore**

Append to `.gitignore`:

```
# Capacitor native projects
android/
ios/
```

The platform directories are generated (`npx cap add android`) and regeneratable. Storing them in git adds ~100MB of SDK files. Always regenerate.

- [ ] **Step 2: Verify**

Run: `git check-ignore android/ ios/ 2>/dev/null && echo "ignored" || echo "not ignored"`
Expected: `ignored`

---

### Task 5: Add Paid-Build Flag

**Files:**
- Modify: `src/lib/entitlements.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `vite.config.native.ts`

- [ ] **Step 1: Declare the env var type**

Add `VITE_PAID_BUILD` to `ImportMetaEnv` in `src/vite-env.d.ts` so `tsc` doesn't error:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PAID_BUILD: string
}
```

- [ ] **Step 2: Set the env var in the native Vite config**

In `vite.config.native.ts`, add a `define` block so `VITE_PAID_BUILD` always equals `'true'` for native builds:

```ts
export default defineConfig({
  base: '',
  define: {
    'import.meta.env.VITE_PAID_BUILD': JSON.stringify('true'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Vite's `define` replaces the literal string `import.meta.env.VITE_PAID_BUILD` in the source with `'true'` at build time. In the free-tier build (`vite.config.ts`), it's not defined, so it stays `undefined` at runtime.

- [ ] **Step 3: Add early-return guards to entitlements.ts**

In `src/lib/entitlements.ts`, add a paid-build check at the top of `isBrandUnlocked` and `isFeatureUnlocked`:

```ts
export function isBrandUnlocked(brand: Brand): boolean {
  if (import.meta.env.VITE_PAID_BUILD === 'true') return true
  return FREE_BRANDS.includes(brand) || getStoredBrands().includes(brand)
}

export function isFeatureUnlocked(feature: ProFeature): boolean {
  if (import.meta.env.VITE_PAID_BUILD === 'true') return true
  return getStoredFeatures().includes(feature)
}
```

These are the only runtime changes in the entire plan. Two early-return guards. The env var is replaced at build time — in the free-tier build the check constant-folds to `false` and the dead code is tree-shaken.

- [ ] **Step 4: Rebuild and verify**

Run: `pnpm build:native`
Expected: exits without errors (tsc passes, Vite bundles, cap copy runs). The grep is pointless — the build succeeding means the type declaration and define block agree.

---

### Task 6: Initialize Android Platform

**Files:**
- Generated: `android/` (the entire Android Studio project)

- [ ] **Step 1: Add the Android platform**

```bash
npx cap add android
```

Expected: creates `android/` directory with a complete Android Studio project. Output should end with `[SUCCESS]`.

- [ ] **Step 2: Sync and build**

```bash
pnpm build:native
npx cap sync android
```

`cap sync` updates the Android project with the latest web assets and config changes.

- [ ] **Step 3: Open in Android Studio and verify**

```bash
npx cap open android
```

Android Studio opens. Wait for Gradle sync to finish (may download SDK components on first run). The project should build without errors.

- [ ] **Step 4: Take a screenshot of Android Studio with the project loaded**

For Play Store listing assets later. Not a code step — just useful to note.

---

### Task 7: Generate Signed Release APK

**Files:**
- Created during signing: a `.keystore` file (store securely, not in repo)

- [ ] **Step 1: Generate a keystore**

```bash
keytool -genkey -v -keystore study-assist-release.keystore \
  -alias study-assist -keyalg RSA -keysize 2048 -validity 10000
```

Set a strong password. Store this keystore **outside the repo** and back it up (e.g. password manager). Losing it means you cannot update the app on Play Store.

- [ ] **Step 2: Build the signed AAB**

In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Select **Android App Bundle**
3. Point to the keystore from step 1
4. Select release build variant
5. Wait for build

The AAB will be at `android/app/build/outputs/bundle/release/app-release.aab`.

- [ ] **Step 3: Verify the AAB is signed**

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab 2>&1 | grep "jar signed"
```

Expected: `jar signed.` (with valid signer info)

---

### Task 8: Submit to Google Play

**No code changes in this task.**

- [ ] **Step 1: Create a Google Play Developer account**

Go to https://play.google.com/console/signup — pay $25 (one-time fee).

- [ ] **Step 2: Create a new app**

In Play Console: Create app → name "Study Assist" → select "Art & Design" or "Photography" category.

- [ ] **Step 3: Fill out store listing**

- **Short description:** "A painting reference tool for artists — value maps, notan, color picker, paint mixing, and more. All processing happens on-device; no uploads required."
- **Full description:** copy from the README
- **Privacy policy:** paste "All image processing is performed entirely on-device. No images or data are uploaded, stored, or transmitted."
- **Screenshots:** upload 4 screenshots (Pixel tablet emulation in Chrome DevTools)
- **Icon:** generate from `public/icons/`

- [ ] **Step 4: Upload the AAB**

Production → Release → Upload the `app-release.aab` from Task 7.

- [ ] **Step 5: Set pricing**

Managed Publishing → Pricing & Distribution → Set as a paid app → choose price.

- [ ] **Step 6: Publish**

Review → Roll out to production. The app appears on Play Store within a few hours.

---

## Self-Review Checklist

- [ ] Does Task 5 (paid flag) match the spec's Monetization section?
- [ ] Are all file paths exact?
- [ ] Are there any TBDs or placeholders?
- [ ] Do the Capacitor config and Vite config agree on `webDir: 'dist'`?
- [ ] Is the keystore step explicit about backup?

## Spec Coverage

| Spec requirement | Task | Notes |
|---|---|---|
| Capacitor native shell | Tasks 1-3, 6 | Config + platform init |
| Build script | Task 1 | `build:native` npm script |
| `base: ''` override | Task 3 | `vite.config.native.ts` |
| Paid build bypass | Task 5 | `VITE_PAID_BUILD` env var |
| Android platform init | Task 6 | `npx cap add android` |
| Signed release | Task 7 | Keystore + AAB generation |
| Play Store submission | Task 8 | Manual Play Console steps |
| No IAP | N/A | Excluded by design |
| GitHub Pages config unchanged | Task 3 | Separate native config file |
| gitignore native dirs | Task 4 | |
