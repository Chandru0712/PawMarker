# PawMarker - Copilot Instructions

## Project Overview
Cross-platform image carousel application built with:
- **Frontend**: React 18 + Vite
- **Desktop**: Electron
- **Mobile**: Capacitor + Android

## Quick Start

1. Install dependencies: `npm install`
2. Development: `npm run dev`
3. Build desktop: `npm run build:desktop`
4. Build Android APK: `build-apk.bat` (Windows) or `bash build-apk.sh`

## Important Paths

- **Shared React components**: `packages/app/src/`
- **Electron main process**: `packages/desktop/src/main.js`
- **Android config**: `packages/mobile/capacitor.config.json`
- **Build output (desktop)**: `packages/desktop/dist/`
- **Build output (web)**: `packages/app/dist/`
- **Android APK**: `packages/mobile/android/app/build/outputs/apk/`

## Environment Setup

### Required for Android builds:
- ANDROID_HOME environment variable set
- JDK 11+ installed
- Android SDK with target API 33+

### Required for Electron:
- Node.js 16+
- electron-builder available globally or via npm

## Common Tasks

- **Hot reload development**: `npm run dev`
- **Rebuild after component changes**: `npm run build:app`
- **Test on Android device**: `npm run android:debug`
- **Create release APK**: `npm run android:release`

## Troubleshooting

If builds fail:
1. Clear node_modules: `rm -r node_modules`
2. Clear build caches: `rm -r packages/*/dist packages/*/build`
3. Reinstall: `npm install`
4. For Android: Check ANDROID_HOME and gradle daemon: `./gradlew clean`

## Code Structure

- **Component with 3-layer overlay**: `ImageCarousel.jsx`
  - Layer 1: Main image display
  - Layer 2: Control overlay
  - Layer 3: 10-slot carousel thumbnails
- **Multi-select**: Right-click on thumbnails for multi-selection
