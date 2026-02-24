# PawMarker

A cross-platform Image Carousel application with support for **Electron (Windows/Mac/Linux)** and **Android APK**.

## Features

- 🖼️ Image carousel with 10-slot thumbnail display
- 🎨 3-layer overlay design (Main display, Control layer, Thumbnail carousel)
- 👆 Multi-select support via right-click on thumbnails
- 📱 Runs on Desktop (Electron) and Mobile (Android via Capacitor)
- ⚛️ Built with React + Vite for fast development
- 🎯 Monorepo structure for shared code

## Project Structure

```
PawMarker/
├── packages/
│   ├── app/              # Shared React web app
│   │   ├── src/
│   │   │   ├── components/   # Reusable components
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   └── public/
│   ├── desktop/          # Electron desktop app
│   │   └── src/
│   │       ├── main.js       # Electron main process
│   │       └── preload.js    # IPC bridge
│   └── mobile/           # Android/Capacitor app
│       └── capacitor.config.json
├── build-apk.bat        # Windows APK build script
├── build-apk.sh         # Linux/Mac APK build script
└── package.json         # Root monorepo config
```

## Prerequisites

### For Desktop (Electron)
- **Node.js** 16+ 
- **npm** 7+

### For Android APK
- **Node.js** 16+
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** (API level 33 recommended)
- **Android Studio** (for emulator testing) or physical Android device
- **Gradle** (included with Android SDK)

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **For Android development, set up Android environment:**
   - Install Android SDK via Android Studio
   - Set `ANDROID_HOME` environment variable
   - Example on Windows: `C:\Users\<YourUsername>\AppData\Local\Android\sdk`
   - Example on Mac/Linux: `~/Android/Sdk`

## Development

### Desktop (Electron)

**Development mode** (hot reload):
```bash
npm run dev
```

**Build** desktop app:
```bash
npm run build:desktop
```

### Web App Only

**Development** (Vite dev server):
```bash
npm run dev:app
```

**Build** web app:
```bash
npm run build:app
```

### Android APK

**1. Build the APK (Windows):**
```bash
build-apk.bat
```

**Or (Mac/Linux):**
```bash
bash build-apk.sh
```

**2. Manual steps:**
```bash
# Build React app
npm run build:app

# Sync with Capacitor
npx cap sync

# Open Android Studio to build/run
npx cap open android
```

**3. Install on device:**
```bash
# Debug APK
cd packages/mobile/android
./gradlew installDebug

# Or using adb
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Available Scripts

### Root Level
- `npm run dev` - Start desktop and web app concurrently
- `npm run build` - Build all packages
- `npm run android:prepare` - Prepare for Android build
- `npm run android:build` - Build Android APK

### Web App (`packages/app`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build production assets
- `npm run preview` - Preview production build

### Desktop (`packages/desktop`)
- `npm run dev` - Start Electron with hot reload
- `npm run build` - Build Electron app

### Mobile (`packages/mobile`)
- `npm run sync` - Sync web app with Capacitor
- `npm run build` - Build for Android
- `npm run open-android` - Open Android Studio
- `npm run android:debug` - Debug on connected device
- `npm run android:release` - Build release APK

## Building APK for Release

1. **Generate a release build:**
```bash
npm run android:release
```

2. **Sign the APK** (create key store if needed):
```bash
# Generate keystore
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.keystore \
  app-release.apk my-key-alias
```

3. **Zipalign for optimization:**
```bash
zipalign -v 4 app-release.apk app-release-aligned.apk
```

## Troubleshooting

### Android Build Issues

**"ANDROID_HOME not set"**
- Set `ANDROID_HOME` environment variable to your Android SDK location
- Windows: Use System Properties → Environment Variables
- Mac/Linux: Add to `~/.bashrc` or `~/.zshrc`: `export ANDROID_HOME=~/Android/Sdk`

**"Gradle Daemon died"**
```bash
cd packages/mobile/android
./gradlew clean
./gradlew assembleDebug
```

**"Capacitor not initialized"**
```bash
npm install
npx cap sync
```

### Electron Issues

**"Vite port already in use"**
- Change port in `packages/app/vite.config.js`
- Or kill process on port 5173

**"Module not found"**
```bash
npm install
npm run build:app
```

## Development Tips

- **Hot reload**: Changes to React components will hot-reload in development
- **Device testing**: Use `npm run android:debug` to test on connected Android device
- **Shared code**: Components in `packages/app` are shared across all platforms
- **Platform-specific code**: Add platform detection in components using environment variables

## Building for Production

```bash
# Desktop
npm run build:desktop

# Android
npm run android:release
```

## License

MIT

## Support

For issues and questions, check the troubleshooting section above or check Capacitor/Electron documentation:
- [Capacitor Docs](https://capacitorjs.com/)
- [Electron Docs](https://www.electronjs.org/docs)
- [Vite Docs](https://vitejs.dev/)
