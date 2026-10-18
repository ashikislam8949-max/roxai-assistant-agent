# ToDO BoT

ToDO BoT is a separate web app and Android app for personal tasks and customer due dates. `2do.net` is the intended website domain; this repository cannot verify ownership, configure DNS, or publish the site.

## Current features

- Tasks and customer due records are stored locally in the current browser or Android app. Edit, complete, delete, and due-date views work offline.
- Bangla, Arabic, and English dictation is available where the browser or Android device has a compatible speech recognizer and language data. Recognized text must be reviewed and confirmed before use. Spoken task confirmations use the device/browser's available text-to-speech voice. Speech recognition can be processed by the browser or device speech service; check its privacy settings before using it.
- Customer contact actions are prepared only after you affirm permission to contact the customer. Call, SMS, and WhatsApp buttons open the corresponding phone app/site after the user taps them; no message or call is automatically sent.
- The Saudi services page links to the official National Portal, Absher, Nafath, Qiwa, and Najiz. It provides guidance and suggestions only; the app has no government account/API integration.
- A self-declared 18+ date-of-birth check gates the app. Only a local adult-access flag is saved, not the birth date. This is not identity verification or a compliant age-assurance system, and no mature-content library is currently included.
- The PWA works offline after its first successful HTTPS visit. The Android app packages the same web files locally.

## Not connected yet

Tasks and customers **do not sync between the website and Android or between devices**. They are stored separately in each browser/app. Do not store sensitive customer information here until account authentication, server-side authorization, encrypted cloud storage, backups, and retention/deletion policies are implemented.

Automated reminders are not enabled. Production automation needs an authenticated backend scheduler, a Saudi-appropriate approved call/SMS/WhatsApp provider, verified sender setup, customer consent records and opt-out handling. Provider credentials must be stored server-side, never in browser code or an APK.

The age check is a prototype self-declaration only. Before offering mature content, replace it with age assurance appropriate to the applicable law, add an effective content policy and moderation, and protect age state server-side.

## Web

Serve the contents of `web/` from an HTTPS host such as the intended `2do.net`. Configure domain ownership and DNS with your hosting provider. The service worker enables offline use after the first visit.

## Android APK

With Java 17, the Android SDK, and access to Google's Maven repository:

```bash
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Sign a release build with your own release key before distribution. Android microphone permission is requested only when voice input is used; recognition and speech synthesis depend on the device's installed services/languages.
