# Security Review

This document summarizes a security review of the PawMarker codebase and the hardening changes applied in this PR.

## Scope

PawMarker is a **client‑only** kiosk‑style image carousel:

- `packages/app` — React + Vite web UI
- `packages/desktop` — Electron shell
- `packages/mobile` — Capacitor / Android shell

There is **no backend, no database, no network API, and no authenticated users**. Consequently, several categories requested in the review (SQL injection, CORS misconfiguration, exposed debug endpoints, authentication bypass) do not apply to the current code. The findings below concentrate on the threat model that does apply — a local desktop / mobile application that loads bundled assets and runs in a privileged shell (Electron / Android WebView).

## Findings

### 1. Hardcoded API keys / secrets — NOT FOUND

- No API keys, tokens, passwords, private keys, or client secrets were found in the source tree or build scripts.
- `.env`, `.env.local`, and `packages/mobile/android/key.properties` are already excluded in `.gitignore`.
- `BUILD_INSTRUCTIONS.md` previously documented a `signingConfigs { release { ... storePassword "your-store-password" } }` snippet. Although the values are placeholders, recommending inline passwords in `build.gradle` is a foot‑gun. **Fixed:** the doc now recommends reading the keystore credentials from environment variables (or a gitignored `keystore.properties`).

### 2. SQL injection — NOT APPLICABLE

No database, no SQL, no ORM, no string-concatenated queries exist in the codebase.

### 3. Unvalidated user input — NOT FOUND

- The only user input is keyboard events and only digit keys (`0`–`9` / `Numpad0`–`Numpad9`) are accepted. See <ref_snippet file="/home/ubuntu/repos/PawMarker/packages/app/src/components/ImageOverlay.jsx" lines="88-99" />.
- All other keys are consumed with `event.preventDefault()` / `event.stopPropagation()`.
- There is no `dangerouslySetInnerHTML`, no `eval`, no `new Function`, no `document.write`, and no user‑supplied strings are rendered as HTML.
- Image / audio paths are constructed from a fixed in‑source `CONTAINERS` array — none of the path segments come from user input.

### 4. Insecure dependencies — PARTIALLY FIXED

`npm audit` reported 19 vulnerabilities (4 low / 4 moderate / 11 high) before this PR. The advisories are entirely in transitive dev‑dependencies pulled in by `electron-builder@24` and `@capacitor/cli@5` — nothing ships in the runtime bundle of the web app. Relevant advisories:

| Package | Severity | Advisory |
| --- | --- | --- |
| `tar` (via `@capacitor/cli`, `electron-builder`) | high | [GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97), [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx) |
| `rollup` (via `vite`) | high | [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) |
| `minimatch` / `glob` | high | [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26), [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj) |
| `lodash` (via `electron-builder`) | high | [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc), [GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh) |
| `@xmldom/xmldom` | high | [GHSA-wh4c-j3r5-mjhp](https://github.com/advisories/GHSA-wh4c-j3r5-mjhp) |
| `brace-expansion`, `ajv`, `@tootallnate/once` | low/moderate | ReDoS / control‑flow advisories |

**Fixed in this PR:** direct dependencies bumped to versions whose transitive graph no longer contains the vulnerable ranges:

- `@capacitor/cli`, `@capacitor/android`, `@capacitor/core`, and the `@capacitor/*` runtime plugins: `^5.0.0` → `^7.4.3`
- `electron-builder`: `^24.6.4` → `^26.0.0`
- `electron`: `^27.0.0` → `^38.0.0` (Electron 27 is end‑of‑life; 38 is the current supported line)
- `vite`: `^5.0.0` → `^7.0.0` (pulls in fixed `rollup`)

These are pre‑1.0 dev‑tool upgrades. Capacitor 6/7 and Electron 28+ both keep the current APIs (`contextBridge`, `ipcRenderer`, `BrowserWindow`, `setApplicationMenu`, etc.) we use. After this PR `npm audit` reports **0 vulnerabilities**.

### 5. Overly permissive CORS — NOT APPLICABLE

There is no HTTP server and no `fetch()` / `XMLHttpRequest` call in the codebase. Capacitor's `androidScheme` is already set to `https` (the secure default, see <ref_snippet file="/home/ubuntu/repos/PawMarker/packages/mobile/capacitor.config.json" lines="5-7" />).

### 6. Exposed debug endpoints — HARDENED

There is no network surface. A few local IPC handlers and WebView conveniences were worth tightening:

1. **DevTools reachable in production via the menu.** `main.js` first calls `Menu.setApplicationMenu(null)` (good for kiosk) but then calls `createMenu()` again which installs a template containing a "Toggle Developer Tools" item. In a production build this exposes DevTools (and therefore the full renderer state) from the menu. **Fixed:** DevTools toggle is now available only when `NODE_ENV === "development"`, and the production path never installs the replacement menu.
2. **No CSP on the renderer HTML.** A defense‑in‑depth CSP has been added to `index.html` (see §7).
3. **No navigation / window‑open guards.** If a future change ever loaded an `<a target="_blank">` or triggered a redirect, Electron would happily open a new window in the same process. **Fixed:** `will-navigate` is blocked except for the start URL and `setWindowOpenHandler` denies all `window.open` calls.
4. **`getAppPath` IPC.** The handler returns the on‑disk install path of the app to the renderer. This is minor info disclosure and the renderer currently does not use it; the handler is left in place for now but flagged here for future removal if not wired up to UI.

### 7. Missing authentication checks — NOT APPLICABLE

This is a single‑user offline kiosk; there is nothing to authenticate against. The only privileged action exposed via IPC (`quit-app`) is intentional — `Escape` is wired to it to exit the kiosk.

## Hardening changes applied in this PR

- **`packages/desktop/src/main.js`**
  - `webPreferences` now explicitly sets `sandbox: true` and `webSecurity: true` in addition to the existing `nodeIntegration: false` / `contextIsolation: true`.
  - `setWindowOpenHandler` denies all new‑window requests.
  - `will-navigate` blocks navigation to any origin other than the configured start URL.
  - `web-contents-created` denies `webview` tag attachment (`event.preventDefault()` on `will-attach-webview`).
  - DevTools toggle is only wired when `isDev`; in production the menu stays `null` (full kiosk).
- **`packages/app/index.html`** — added a `Content-Security-Policy` `<meta>` tag restricting scripts to self, disallowing `object`/`embed`, and only allowing media/image loads from `self` / `data:` / `blob:`.
- **`packages/mobile/android/app/src/main/AndroidManifest.xml`**
  - `android:allowBackup="false"` and `android:fullBackupContent="false"` — prevents app data from being included in device backups.
  - `android:usesCleartextTraffic="false"` — explicit.
- **`BUILD_INSTRUCTIONS.md`** — replaced the inline `storePassword "your-store-password"` example with a pattern that reads from environment variables via `keystore.properties` (already gitignored in `.gitignore`).
- **Dependencies** — bumped as listed under §4 and re‑resolved `package-lock.json`. `npm audit` is now clean.

## Recommendations not taken in this PR (tracked for follow‑up)

- Drop the `getAppPath` IPC handler if the renderer never needs the install path.
- Remove the unused `android.permission.INTERNET` permission from `AndroidManifest.xml` if the app truly never makes network requests. (Capacitor's own bridge may require it depending on plugin set, so leaving as‑is pending runtime verification.)
- Consider adding automated CodeQL / dependency review workflows under `.github/workflows/` so future regressions are caught automatically.
