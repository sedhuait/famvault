# GoldFile — Encrypted Offline Family Gold & Precious Asset Vault

**GoldFile** is a 100% offline, privacy-first mobile application built with Expo and React Native for Indian families to catalog, value, track, and audit their precious assets — Gold, Silver, Diamonds, Platinum, Sovereign Gold Bonds (SGB), Digital Gold, and Temple/Antique ornaments.

All vault data is **encrypted on-device** using a PIN- or Biometric-protected key (`expo-secure-store` + `expo-local-authentication`) and never leaves your phone unless you explicitly export an encrypted `.goldfile` backup to iCloud Drive, Google Drive, or a local PDF/CSV audit report.

---

## Key Features

- **100% Offline & Encrypted:** Mandatory PIN / Biometric (Face ID, Touch ID, Fingerprint) onboarding and app lock. Vault storage is encrypted on-device before persistence.
- **Ornament & Asset Classification:** Track 20+ traditional & modern ornament types (_Haram, Necklace, Chain, Ring, Nose Ring, Bangle, Oddiyanam, Kolusu, Netti Chutti, Coin, Bar, Bullion, SGB, Silverware_, etc.) with custom vector icons and metal-aware secondary options.
- **Purity & Weight Tracking:** Supports `24K (999)`, `22K (916)`, `18K (750)`, `14K`, `80% Vessel`, `999 Silver`, `950 Platinum`, and `Carat / Cent` diamond valuation, plus **Grams ↔ Pavun (Sovereign = 8g)** toggle.
- **Custody & Family Beneficiary Audit:** Track whether items are in a **Bank Locker**, **Home Safe**, **Pooja Room**, **Daily Wear**, **Gold Loan**, or **Borrowed**, with transfer logs and family member attribution (_Self, Wife, Amma, Daughter, Son, Joint_).
- **CBDT Safe-Limit Compliance:** Automatic tracking against CBDT circular gold holding guidelines per family member.
- **Bills & Photo Vault:** Attach ornament photos and purchase invoice PDFs/images locally on-device.
- **Backup & Export:** Password-encrypted `.goldfile` backups (iCloud / Google Drive / Files) plus printable **PDF Audit Reports** and **CSV** exports.

---

## App Identifiers & Configuration (`app.json`)

| Property                  | Value                                  |
| ------------------------- | -------------------------------------- |
| **App Name**              | `GoldFile`                             |
| **Expo Slug**             | `goldfile`                             |
| **URL Scheme**            | `goldfile://`                          |
| **Version**               | `1.0.0`                                |
| **iOS Bundle Identifier** | `in.codera.goldfile`                   |
| **iOS Build Number**      | `1`                                    |
| **iOS Tablet Support**    | `false` (`supportsTablet: false`)      |
| **iOS Export Compliance** | `ITSAppUsesNonExemptEncryption: false` |
| **Android Package Name**  | `in.codera.goldfile`                   |
| **EAS Project ID**        | `7282513a-3668-49cb-b8b9-2fdb3d773ecb` |
| **Expo Owner**            | `codera.in`                            |

### Required Permissions & Purpose Strings

Configured automatically via Expo config plugins in `app.json`:

#### iOS (`Info.plist`)

- **`NSFaceIDUsageDescription`** (`expo-local-authentication`):
  `"Allow GoldFile to unlock your family precious metals vault with Face ID."`
- **`NSPhotoLibraryUsageDescription`** (`expo-image-picker`):
  `"Allow GoldFile to attach jewelry photos and invoice images."`
- **`NSCameraUsageDescription`** (`expo-image-picker`):
  `"Allow GoldFile to capture jewelry photos and GST bills."`

#### Android (`AndroidManifest.xml`)

- `android.permission.USE_BIOMETRIC`
- `android.permission.USE_FINGERPRINT`
- `android.permission.RECORD_AUDIO` _(added by `expo-image-picker` / media capture plugin)_
- Camera & Media permissions injected by `expo-image-picker`

> **Note:** `ios/` and `android/` are generated automatically via Continuous Native Generation (CNG) during `npx expo prebuild` / `eas build`. Do not edit native folders manually; configure everything in `app.json`.

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on iOS Simulator / Android Emulator (requires dev build for native crypto/biometrics)
npx expo run:ios
npx expo run:android

# Run web preview
npx expo start --web

# Lint, format check, and TypeScript typecheck
npm run check

# Run unit & integration test suite
npm test

# Run tests with coverage report
npm run test:coverage
```

---

## Building & Submitting with EAS (Cloud Build — No Local Xcode/Android Studio Needed)

### 1. Prerequisites

```bash
# Install or invoke EAS CLI
npx eas-cli@latest login

# Verify project & Apple/Google credentials status
npx eas-cli@latest whoami
```

If `eas.json` does not exist yet, initialize it:

```bash
npx eas-cli@latest build:configure
```

Recommended `eas.json` profiles:

```json
{
  "cli": {
    "version": ">= 14.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Publishing to Apple App Store Connect (iOS)

### Step 1: Apple Developer Portal Setup

1. Sign in to [Apple Developer](https://developer.apple.com/account) with your paid Apple Developer Program membership.
2. Go to **Certificates, Identifiers & Profiles → Identifiers → `+` → App IDs → App**.
3. Register the exact Bundle ID:
   - **Description:** `GoldFile`
   - **Bundle ID (Explicit):** `in.codera.goldfile`
   - **Capabilities:** Enable **iCloud** (iCloud Documents, if using native iCloud container) and **Face ID** (handled via `NSFaceIDUsageDescription`).

### Step 2: Create the App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **`+` (New App)**.
2. Fill in:
   - **Platforms:** `iOS`
   - **Name:** `GoldFile`
   - **Primary Language:** `English (U.S.)` or `English (U.K.)`
   - **Bundle ID:** `in.codera.goldfile`
   - **SKU:** `in-codera-goldfile-001`
   - **User Access:** Full Access
3. **App Privacy Declarations:**
   - **Data Collection:** Select **"No, we do not collect data from this app"** (GoldFile is 100% offline; all records, photos, and bills stay on-device or in the user's own iCloud/Google Drive).
4. **Encryption / Export Compliance:**
   - `ITSAppUsesNonExemptEncryption` is already set to `false` in `app.json` because GoldFile only uses standard OS-provided / exempt local encryption for user data protection.
5. **App Review Information:**
   - Provide a demo note explaining that onboarding sets a local 6-digit PIN (or enables sample vault data) and no server login is required.

### Step 3: Build & Submit iOS via EAS

```bash
# Build production .ipa in the cloud (EAS handles distribution cert & provisioning profile)
npx eas-cli@latest build --platform ios --profile production

# Submit directly to App Store Connect / TestFlight
npx eas-cli@latest submit --platform ios --profile production
```

---

## Publishing to Google Play Console (Android)

### Step 1: Create the App in Google Play Console

1. Sign in to [Google Play Console](https://play.google.com/console) → **Create app**.
2. Fill in:
   - **App name:** `GoldFile`
   - **Default language:** `English`
   - **App or game:** `App`
   - **Free or paid:** `Free` (or Paid)
3. **Package Name:** Must match `app.json` → `in.codera.goldfile` (verified when you upload your first `.aab`).

### Step 2: Complete Play Console Declarations

1. **App Access:** Select _"All functionality is available without special access"_ (since onboarding & PIN are created locally by the user).
2. **Ads:** _"No, my app does not contain ads"_.
3. **Content Rating:** Complete the IARC questionnaire (Finance / Utility, no violence/user-generated public content).
4. **Data Safety:**
   - **Does your app collect or share any of the required user data types?** → **No** (all data is stored locally and encrypted on-device).
5. **Permissions Justification (if prompted):**
   - `USE_BIOMETRIC` / `USE_FINGERPRINT`: Unlocking the encrypted local vault.
   - `CAMERA` / Photo access: Capturing ornament photos and purchase invoices locally.
   - _(Optional)_ If you do not record audio, you can block `RECORD_AUDIO` in `app.json` under `android.blockedPermissions: ["android.permission.RECORD_AUDIO"]` if Google Play flags it during review.
6. **Store Listing Assets:**
   - App icon: `512×512` PNG (use `assets/images/icon.png` resized or exported).
   - Feature graphic: `1024×500` PNG.
   - Phone screenshots: Minimum 2 screenshots (use real captures from `website/assets/screenshots/`).
   - Privacy Policy URL: Host `website/index.html` (which includes a privacy summary) or a dedicated `/privacy` page.

### Step 3: Build & Submit Android via EAS

```bash
# Build production Android App Bundle (.aab)
npx eas-cli@latest build --platform android --profile production

# Download .aab for manual first upload (Google Play requires the first AAB to be uploaded manually in Play Console),
# or configure a Google Play Service Account JSON key for automated submission:
npx eas-cli@latest submit --platform android --profile production
```

---

## Landing Website (`website/`)

The `website/` folder contains a standalone, zero-dependency, responsive single-page marketing website showcasing GoldFile with real app screenshots.

- **Entry point:** `website/index.html`
- **Store Links:** Update the `APPLE_STORE_URL` and `GOOGLE_PLAY_URL` constants in `website/index.html` (or the `<a id="apple-store-link">` / `<a id="google-play-link">` hrefs) once your store listings are live.
- **Deploy anywhere:** Upload `website/` to Vercel, Netlify, GitHub Pages, Cloudflare Pages, or S3.
