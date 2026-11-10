# Lapak Absensi - Android APK & AAB Project (TWA)

Proyek Android Trusted Web Activity (TWA) resmi untuk **Absensi & Payroll** (`lapakabsensi.github.io/lapakabsensi/`).

## Format Hasil Build
1. **.apk (Android Package)**: Untuk pengujian langsung dan instalasi offline di smartphone Android (Sideloading).
2. **.aab (Android App Bundle)**: Format standar terbaru untuk publikasi ke **Google Play Console / Play Store**.

---

## ⚡ Cara Build Cepat via GitHub Actions (Tanpa Install Apapun!)
1. Buat repository baru di GitHub (misal: `lapakabsensi-android`).
2. Upload semua file dalam zip ini ke repository tersebut.
3. Buka tab **Actions** di GitHub repository Anda.
4. Workflow **Build Android APK and AAB** akan berjalan otomatis dalam 2 menit.
5. Unduh file **.apk** dan **.aab** langsung dari section **Artifacts**!

---

## 💻 Cara Build di Laptop / Komputer Lokal

### Prasyarat
- Java JDK 17 atau lebih baru
- Android Studio / Android SDK (API 34)

### 1. Buat Keystore Penandatanganan (Signing Key)
```bash
keytool -genkeypair -v -keystore release.keystore -alias lapakabsensi -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=LapakAbsensi, OU=App, O=LapakAbsensi, C=ID"
```

### 2. Build APK (Instalasi HP Langsung)
```bash
# Linux / macOS:
./gradlew assembleRelease

# Windows:
gradlew.bat assembleRelease
```
File APK akan berada di: `app/build/outputs/apk/release/app-release.apk`

### 3. Build AAB (Google Play Store)
```bash
# Linux / macOS:
./gradlew bundleRelease

# Windows:
gradlew.bat bundleRelease
```
File AAB akan berada di: `app/build/outputs/bundle/release/app-release.aab`

---

## 🔑 Menghilangkan URL Bar Browser (Digital Asset Links)
Agar aplikasi berjalan **Full Screen murni tanpa bilah URL Google Chrome**:
1. Buat folder bernama `.well-known` di root repository web Anda (`https://lapakabsensi.github.io/.well-known/`).
2. Masukkan file `assetlinks.json` yang sudah kami sertakan ke dalam folder tersebut:
   `https://lapakabsensi.github.io/.well-known/assetlinks.json`
3. Verifikasi SHA-256 fingerprint sertifikat Anda sudah sesuai dengan isi file tersebut.
