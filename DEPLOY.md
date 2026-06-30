# Mantara — Panduan Deploy Mobile (iOS & Android)

Game ini adalah **HTML5 single-file** yang dibungkus dengan **[Capacitor 7](https://capacitorjs.com/)** untuk App Store dan Google Play.

## Prasyarat

| Tool | iOS | Android |
|------|-----|---------|
| Node.js 18+ | ✓ | ✓ |
| Xcode 15+ | ✓ | — |
| Apple Developer ($99/tahun) | ✓ | — |
| Android Studio | — | ✓ |
| CocoaPods (`pod`) | ✓ | — |
| JDK 17 | — | ✓ |
| ImageMagick (`magick`) | opsional | opsional |

```bash
cd MantaraMain
npm install
```

**macOS — JDK 17 untuk Gradle Android** (wajib jika default Java Anda 21+):

```bash
brew install openjdk@17
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
```

**Android SDK** — install [Android Studio](https://developer.android.com/studio), lalu:

```bash
cp android/local.properties.example android/local.properties
# edit sdk.dir ke path SDK Anda, biasanya:
# /Users/USERNAME/Library/Android/sdk
```

## Workflow harian

```bash
# 1. Edit game di mantara v23.html
# 2. Build bundle web
npm run build

# 3. Regenerate ikon PWA + native (setelah ganti resources/icon.png)
npm run icons:all

# 4. Sinkron ke native
npm run cap:sync

# 5. Buka IDE native
npm run cap:ios      # Xcode
npm run cap:android  # Android Studio
```

Preview di browser:

```bash
npm run dev   # http://localhost:3000
```

Cek kesiapan rilis:

```bash
npm run release:check
```

---

## Struktur proyek

```
MantaraMain/
├── mantara v23.html      ← sumber game (edit di sini)
├── www/                  ← bundle deploy (generated)
│   ├── index.html
│   ├── assets/
│   ├── icons/
│   ├── manifest.webmanifest
│   ├── privacy.html
│   └── js/native-bridge.js
├── ios/                  ← proyek Xcode (generated)
├── android/              ← proyek Gradle (generated)
├── resources/
│   ├── icon.png          ← ikon store 1024×1024 (edit lalu icons:all)
│   └── splash.png        ← opsional; auto dari icon jika kosong
├── capacitor.config.json
└── scripts/
    ├── build-www.js
    ├── generate-app-icons.sh
    └── release-check.js
```

---

## iOS — App Store

### 1. Setup pertama

```bash
npm run cap:sync
npm run cap:ios
```

Di Xcode (`ios/App/App.xcworkspace`):

1. **Signing & Capabilities** → pilih Team Apple Developer Anda
2. **Bundle Identifier**: `com.mantara.game` (atau ubah di `capacitor.config.json` lalu `cap sync`)
3. **Deployment Target**: iOS 14.0+
4. Tambahkan capability **In-App Purchase** jika IAP aktif

### 2. App Store Connect

1. Buat app baru di [App Store Connect](https://appstoreconnect.apple.com)
2. **SKU** bebas, **Bundle ID** harus sama dengan Xcode
3. Upload screenshot (6.7", 6.5", 5.5" iPhone) — portrait
4. **Privacy Policy URL**: host `www/privacy.html` (GitHub Pages, Firebase Hosting, dll.)
5. **Age Rating**: simulasi kehidupan — biasanya 12+ (sesuaikan kuesioner)
6. **Kategori**: Games → Simulation / Role Playing

### 3. IAP (In-App Purchase)

Product ID di game (`mantara v23.html` → `IAP_PRODUCTS`) harus **persis sama** dengan App Store Connect:

| Product ID | Tipe |
|------------|------|
| `takdir.theme.royal` | Non-consumable |
| `takdir.theme.crimson` | Non-consumable |
| `takdir.theme.frost` | Non-consumable |
| `takdir.origin.dragon` | Non-consumable |
| `takdir.saveslots` | Non-consumable |
| `takdir.bundle.all` | Non-consumable |
| `takdir.tip.coffee` | Consumable |

Sambungkan billing native ke `window.TakdirIAP` di `www/js/native-bridge.js` (StoreKit 2 via RevenueCat atau plugin Capacitor).

### 4. Archive & upload

1. Xcode → Product → **Archive**
2. **Distribute App** → App Store Connect
3. Tunggu processing → submit for review

### 5. TestFlight

Archive yang sama bisa dipakai untuk internal testing sebelum review.

---

## Android — Google Play

### 1. Setup pertama

```bash
npm run cap:sync
npm run cap:android
```

Di Android Studio:

1. **File → Sync Project with Gradle Files**
2. `android/app/build.gradle` → `applicationId "com.mantara.game"`
3. **minSdkVersion** 24, **targetSdkVersion** 34+

### 2. Signing key (sekali)

```bash
keytool -genkey -v -keystore mantara-release.keystore -alias mantara -keyalg RSA -keysize 2048 -validity 10000
```

Simpan keystore & password di tempat aman. Tambahkan ke `android/gradle.properties` (jangan commit):

```properties
MANTARA_STORE_FILE=../mantara-release.keystore
MANTARA_STORE_PASSWORD=***
MANTARA_KEY_ALIAS=mantara
MANTARA_KEY_PASSWORD=***
```

### 3. Play Console

1. [Google Play Console](https://play.google.com/console) → buat aplikasi
2. **Privacy policy URL** → sama seperti iOS
3. **Data safety**: declare local storage only, no account
4. Upload **AAB** (bukan APK):

```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 4. IAP Android

Buat produk in-app di Play Console dengan ID yang sama dengan `IAP_PRODUCTS`.

---

## PWA (opsional, tanpa store)

Host folder `www/` di static hosting:

```bash
npm run build
# upload isi www/ ke Netlify, Vercel, Cloudflare Pages, dll.
```

`manifest.webmanifest` sudah disertakan untuk install ke home screen.

---

## Checklist sebelum submit

- [ ] `npm run release:check` lulus semua
- [ ] Game bisa dimainkan full loop (lahir → mati → pewarisan)
- [ ] Save/load multi-slot berfungsi di perangkat fisik
- [ ] Tombol back Android menutup modal dulu
- [ ] Safe area iPhone (notch) tidak menutupi UI
- [ ] Privacy policy URL live & dapat diakses
- [ ] Screenshot & deskripsi store dalam Bahasa Indonesia
- [ ] IAP: tombol "Pulihkan Pembelian" berfungsi (wajib Apple)
- [ ] Tidak ada `console.log` debug di production build
- [ ] Versi `version` di `package.json` / native project dinaikkan

---

## Troubleshooting

**Layar putih saat buka app**  
→ Jalankan `npm run build && npx cap sync`. Pastikan `www/index.html` ada.

**Asset ikon game tidak muncul**  
→ `npm run build` menyalin `assets/` ke `www/assets/`.

**localStorage tidak persist**  
→ Normal di WKWebView; pastikan tidak mode private. Capacitor WebView persist by default.

**IAP hanya simulasi**  
→ Expected di web preview. Sambungkan `TakdirIAP` ke StoreKit / Play Billing di native.

---

## Versi & rilis

Naikkan versi sebelum setiap upload:

- `package.json` → `"version": "1.0.1"`
- iOS: Xcode → General → Version / Build
- Android: `android/app/build.gradle` → `versionCode` + `versionName`

```bash
npm run build
npm run cap:sync
# lalu archive / bundleRelease
```
