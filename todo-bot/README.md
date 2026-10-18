# ToDO BoT

ToDO BoT is a separate web app and Android app for personal tasks and customer due dates. `2do.net` is the intended website domain; this repository cannot verify ownership, configure DNS, or publish the site.

## Current features

- Tasks and customer due records are stored locally in the current browser or Android app. Edit, complete, delete, and due-date views work offline.
- Bangla, Arabic, and English dictation is available where the browser or Android device has a compatible speech recognizer and language data. Recognized text must be reviewed and confirmed before use. Spoken task confirmations use the device/browser's available text-to-speech voice. Speech recognition can be processed by the browser or device speech service; check its privacy settings before using it.
- Customer contact actions are prepared only after you affirm permission to contact the customer. Call, SMS, and WhatsApp buttons open the corresponding phone app/site after the user taps them; no message or call is automatically sent.
- The Saudi services page links to the National Portal, MISA, Invest Saudi, Ministry of Commerce, Balady, Absher for residents, Nafath, Qiwa, and Najiz. It provides guidance only; there is no government account/API integration or automatic identity verification. Users complete government sign-in and Nafath identity approval on the official portal themselves. Any direct integration requires authorization and API access from the relevant government authority.
- GitHub supports both task-to-Issue drafting and linked Issue/PR status checks for public repositories. To draft an Issue, save a default `owner/repository` and use a task’s Draft Issue action; GitHub opens a prefilled form that you must review and submit. To track status, paste an Issue/PR URL into a task. Status refresh uses the unauthenticated public GitHub API, refreshes at most 20 linked tasks per run, and is rate-limited by GitHub. Private repositories and automatic Issue creation/status webhooks are not supported.
- A self-declared 18+ date-of-birth check gates the app. Only a local adult-access flag is saved, not the birth date. This is not identity verification or a compliant age-assurance system, and no mature-content library is currently included.
- The PWA works offline after its first successful HTTPS visit. The Android app packages the same web files locally.

## Not connected yet

Tasks and customers **do not sync between the website and Android or between devices**. They are stored separately in each browser/app. Do not store sensitive customer information here until account authentication, server-side authorization, encrypted cloud storage, backups, and retention/deletion policies are implemented.

Automated reminders are not enabled. Production automation needs an authenticated backend scheduler, a Saudi-appropriate approved call/SMS/WhatsApp provider, verified sender setup, customer consent records and opt-out handling. Provider credentials must be stored server-side, never in browser code or an APK.

GitHub integration does not sign users in, hold a GitHub token, or write to repositories. Issue creation is user-submitted from GitHub’s prefilled form. Linked status is public-only and refreshed on demand/when opening the GitHub view; webhook-based real-time sync and private-repository access require a registered GitHub App and secure backend.

The age check is a prototype self-declaration only. Before offering mature content, replace it with age assurance appropriate to the applicable law, add an effective content policy and moderation, and protect age state server-side.

## Web

Serve the contents of `web/` from an HTTPS host such as the intended `2do.net`. GitHub Pages can host the static web client on a custom domain if you own the domain and configure GitHub Pages plus DNS as described in [GitHub's custom-domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages). This repository does not verify ownership or change DNS. GitHub Pages only hosts static files; it does not provide the secure backend/database needed for cloud sync, government identity checks, or automated reminders. Never commit provider or API credentials. The service worker enables offline use after the first visit.

## Android APK

With Java 17, the Android SDK, and access to Google's Maven repository:

```bash
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Sign a release build with your own release key before distribution. Android microphone permission is requested only when voice input is used; recognition and speech synthesis depend on the device's installed services/languages.
