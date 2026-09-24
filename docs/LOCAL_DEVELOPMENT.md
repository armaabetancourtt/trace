<p align="center"><img src="../brand/trace-banner.svg" alt="TRACE official wordmark" width="680" /></p>

# Local development

TRACE mobile uses **Expo SDK 57 + a custom development build**.

It cannot run in Expo Go because Mapbox and React Native Firebase require custom native code.

## Prerequisites

- Node.js LTS
- Xcode for iOS and/or Android Studio for Android
- Firebase project
- Mapbox account + public access token

## 1. Install dependencies

From the repository root:

```bash
npm install
```

## 2. Configure Mapbox

```bash
cp .env.example .env
```

Set:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_public_token
```

Never commit a Mapbox secret/download token.

## 3. Register the Firebase apps

Create iOS and Android apps in your Firebase project using the bundle identifiers defined in:

`apps/mobile/app.config.ts`

Place the native Firebase configuration files locally:

```text
apps/mobile/GoogleService-Info.plist
apps/mobile/google-services.json
```

These are ignored by this portfolio repository until a dedicated public Firebase project is intentionally configured.

## 4. Generate native projects

```bash
cd apps/mobile
npx expo prebuild --clean
```

## 5. Build a development client

iOS:

```bash
npx expo run:ios
```

Android:

```bash
npx expo run:android
```

After the first native build:

```bash
npm run start
```

## What works in the current milestone

- fullscreen Mapbox home;
- RUN / WALK / RIDE mode selection;
- real location permission flow;
- background GPS task;
- local SQLite persistence;
- activity state machine;
- distance / pace / time computation;
- live route rendering;
- server-owned JOIN RUN flow;
- privacy-separated coarse vs. precise live location.

No demo users, fake activity totals or fabricated analytics are included.
