# RoxAI

RoxAI is a focused engineering assistant built with Next.js and the Vercel AI SDK.

## Configure

Add `AI_GATEWAY_API_KEY` to your Vercel project environment variables. Optionally set `AI_MODEL`; the default is `openai/gpt-4o-mini`.

## Run locally

```bash
pnpm dev
```

## Installable web app

The website includes a web app manifest and can be installed from supported browsers.

## Android APK

The Android app opens the hosted website at `https://roxaii.com` and requires an internet connection.
With Java 17 and the Android SDK installed, build a debug APK with:

```bash
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. A release APK must be signed with your own release key.
