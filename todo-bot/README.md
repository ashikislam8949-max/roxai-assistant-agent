# ToDO BoT

ToDO BoT is a small, standalone task manager for the web and Android. Tasks are saved on the device in browser storage; the app does not require an account or a server.

## Web app

Serve the contents of `web/` from any static HTTPS host. The service worker enables offline use after the first visit, and supported browsers can install the app from the browser menu.

## Android app

The Android app packages the same web files locally and works offline. With Java 17, the Android SDK, and access to Google's Maven repository, build a debug APK:

```bash
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Sign a release build with your own release key before distribution.
