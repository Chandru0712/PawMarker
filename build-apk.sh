#!/bin/bash
# Android APK build script for PawMarker
# Prerequisites: Android SDK, JDK 11+, Gradle

echo "Building PawMarker APK..."

# Build the app first
echo ""
echo "Step 1: Building React app..."
npm run build -w packages/app

# Sync with Capacitor
echo ""
echo "Step 2: Syncing with Capacitor..."
npx cap sync

# Build APK
echo ""
echo "Step 3: Building APK..."
cd packages/mobile/android
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ APK build successful!"
    echo "APK location: packages/mobile/android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo ""
    echo "✗ APK build failed. Check the errors above."
    exit 1
fi
