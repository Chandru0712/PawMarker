# PawMarker - Build & Shipping Instructions

## Available APK Files

### 1. Debug APK (Ready for Testing)

- **File**: `PawMarker-debug.apk` (133.23 MB)
- **Status**: ✓ Signed with debug certificate
- **Use for**: Testing on devices, internal distribution
- **Installation**: Works immediately on any Android device with "Install from unknown sources" enabled

### 2. Release APK (Production Ready - Unsigned)

- **File**: `PawMarker-release-unsigned.apk` (132.45 MB)
- **Status**: ⚠ UNSIGNED - Needs signing before distribution
- **Use for**: Google Play Store, production distribution
- **Next step**: Sign with your production keystore

---

## For Immediate Testing

Use **PawMarker-debug.apk** - it's ready to install and test!

---

## For Production/Shipping (Signed Release APK)

### Option 1: Sign with Android Studio

1. Open `packages/mobile/android` in Android Studio
2. **Build** → **Generate Signed Bundle/APK**
3. Select **APK**
4. Create or select your keystore
5. Follow the wizard to generate signed APK

### Option 2: Sign via Command Line (requires JDK)

#### Step 1: Create a Keystore (one-time setup)

```bash
keytool -genkey -v -keystore pawmarker.keystore \
  -alias pawmarker \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

#### Step 2: Sign the APK

```bash
# Align the APK
zipalign -v -p 4 PawMarker-release-unsigned.apk PawMarker-release-unsigned-aligned.apk

# Sign the APK
apksigner sign --ks pawmarker.keystore \
  --out PawMarker-release-signed.apk \
  PawMarker-release-unsigned-aligned.apk

# Verify signature
apksigner verify PawMarker-release-signed.apk
```

### Option 3: Configure Automatic Signing in Gradle

**Do NOT commit keystore passwords or paths to source control.** Load them
from a gitignored `keystore.properties` file or from environment variables.

Create `packages/mobile/android/keystore.properties` (already covered by
`.gitignore` as `key.properties` — add `keystore.properties` too if you
prefer that filename):

```properties
storeFile=/absolute/path/to/pawmarker.keystore
storePassword=${KEYSTORE_PASSWORD}
keyAlias=${KEY_ALIAS}
keyPassword=${KEY_PASSWORD}
```

Edit `packages/mobile/android/app/build.gradle`:

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            // Values resolve from keystore.properties, which in turn
            // references environment variables. Never hardcode the
            // real password / alias in a tracked file.
            storeFile file(keystoreProperties["storeFile"] ?: System.getenv("KEYSTORE_FILE"))
            storePassword keystoreProperties["storePassword"] ?: System.getenv("KEYSTORE_PASSWORD")
            keyAlias keystoreProperties["keyAlias"] ?: System.getenv("KEY_ALIAS")
            keyPassword keystoreProperties["keyPassword"] ?: System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

Then export the credentials in your shell / CI job and rebuild:

```bash
export KEYSTORE_PASSWORD=...   # never commit this
export KEY_ALIAS=...
export KEY_PASSWORD=...
./gradlew assembleRelease
```

---

## Quick Build Commands

```bash
# Build web app
npm run build:app

# Sync with Capacitor
cd packages/mobile
npx cap sync android

# Build Debug APK (auto-signed, ready to test)
cd android
.\gradlew assembleDebug

# Build Release APK (needs signing for production)
.\gradlew assembleRelease
```

---

## App Features Included

✓ 10 image slots with keyboard controls (1-9, 0)
✓ 3 auto-rotating images per slot (5-second intervals)
✓ Smooth fade transitions (0.6s)
✓ Full-screen overlay with frame images
✓ All images embedded (133 MB total)

---

## Distribution Options

### For Testing

- Use **PawMarker-debug.apk**
- Share via USB, email, Google Drive, etc.
- Install directly on devices

### For Production

- Sign **PawMarker-release-unsigned.apk** first
- Upload signed APK to Google Play Store
- Or distribute via enterprise MDM/app stores

---

## Important Files

- `PawMarker-debug.apk` - Signed debug APK (ready to use)
- `PawMarker-release-unsigned.apk` - Unsigned release APK (needs signing)
- `packages/mobile/android/` - Android project source
- `packages/app/dist/` - Web app build output

---

## Support

For issues or questions, check:

- `README.md` - Project documentation
- `QUICK_START.md` - Quick reference guide
- `.github/copilot-instructions.md` - Development guidelines
