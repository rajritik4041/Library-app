# Desktop app (Windows / macOS / Linux)

Same Expo app as Android — runs via **React Native Web** inside **Electron**.

| Platform | How |
|----------|-----|
| Android / iPhone | `npm start` → Expo / EAS |
| Web browser | `npm run web` |
| Windows / macOS / Linux | `npm run desktop` |

**Theme:** In the app navbar, tap **🌙 Dark** / **☀️ Light** to switch modes (saved on device). Works on Android, Windows `.exe`, and Mac `.dmg`.

**Physical library hours (IST):** Mon–Fri 9:00 AM–5:00 PM · Sat 9:00 AM–1:00 PM · Sun closed.

## Prerequisites

1. Install dependencies:

   ```bash
   cd Library
   npm install
   ```

2. API (optional for dev): backend on port 3001, or use Render URL in production builds.

## Development (live reload)

```bash
cd Library
npm run desktop
```

This starts Expo web on `http://127.0.0.1:8081` and opens the Electron window. UI, login, books, teacher panel — same as web.

## Production installer (.exe / .dmg / .AppImage)

**Windows — ek click (recommended):**

```bat
cd Library
build-desktop.bat
```

**Ya npm:**

```bash
cd Library
npm run desktop:pack
```

Output: `Library/release/EJ MCAET Library Setup x.x.x.exe`

End users: [DESKTOP-USER-HINDI.md](DESKTOP-USER-HINDI.md) — sirf .exe install, **local backend ki zaroorat nahi** (Render API use hoti hai).

- **Windows:** `EJ MCAET Library Setup x.x.x.exe`
- **macOS:** `.dmg` (build on Mac when possible)
- **Linux:** `.AppImage`

API URL is baked in at export time (`EXPO_PUBLIC_API_URL` in `export-web` script).

## Test production build without installer

```bash
npm run desktop:prod
```

## Architecture

```
Expo (React Native) → Web export (dist/) → Electron window
                     ↑ dev: Metro :8081
```

Android/iPhone builds are unchanged (`eas build`, etc.).
