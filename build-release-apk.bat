@echo off
REM Android Release APK build script for PawMarker
REM This builds a RELEASE APK (unsigned unless keystore is configured)

echo Building PawMarker RELEASE APK...

REM Navigate to mobile directory
cd /d %~dp0

REM Build the app first
echo.
echo Step 1: Building React app (Production)...
call npm run build:app

REM Sync with Capacitor
echo.
echo Step 2: Syncing with Capacitor...
cd packages\mobile
call npx cap sync

REM Build Release APK
echo.
echo Step 3: Building Release APK...
cd android
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Release APK build successful!
    echo.
    echo IMPORTANT: Usually this APK is UNSIGNED needed to be signed manually or via Android Studio.
    echo Location: packages\mobile\android\app\build\outputs\apk\release\app-release-unsigned.apk
    
    REM Copy to root for easy access
    copy app\build\outputs\apk\release\app-release-unsigned.apk ..\..\..\PawMarker.apk
    
    echo Copied to project root: PawMarker.apk
) else (
    echo.
    echo ✗ Release APK build failed. Check the errors above.
    exit /b 1
)
