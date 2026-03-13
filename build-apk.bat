@echo off
REM Android APK build script for PawMarker
REM Prerequisites: Android SDK, JDK 11+, Gradle
set ROOT_DIR=%~dp0

echo Building PawMarker APK...

REM Navigate to mobile directory
cd /d %~dp0

REM Build the app first
echo.
echo Step 1: Building React app...
call npm run build -w packages/app

REM Sync with Capacitor
echo.
echo Step 2: Syncing with Capacitor...
cd packages\mobile
call npx cap sync

REM Build APK
echo.
echo Step 3: Building APK...
cd android
call gradlew.bat assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ APK build successful!
    echo.
    copy app\build\outputs\apk\debug\app-debug.apk "%ROOT_DIR%PawMarker.apk" /Y
    echo Copied to project root: PawMarker.apk
) else (
    echo.
    echo ✗ APK build failed. Check the errors above.
    exit /b 1
)
