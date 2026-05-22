# MCAET Library App

Official college: [Mahamaya College of Agricultural Engineering & Technology](https://mcaet.vercel.app/) (MCAET), Akbarpur, Ambedkar Nagar.

## Folder structure

```
Library-app/
├── backend/          ← API server (Render deploy yahi)
│   ├── package.json
│   ├── index.js
│   ├── file-store.js
│   └── data/
│       └── catalog.json   ← Excel se (npm run sync-backend)
│
├── Library/          ← Frontend (Expo / Android APK)
│   ├── package.json
│   ├── src/
│   └── assets/sheets.xlsx
│
├── package.json      ← Render root: postinstall → backend
└── render.yaml
```

## Render (backend)

| Setting | Value |
|---------|--------|
| **Root Directory** | *(khali / blank)* |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **URL** | https://library-app-x9zn.onrender.com |

**Env (Render dashboard):** `MONGODB_URI`, `JWT_SECRET`, `DEFAULT_TEACHER_*` — **do not** set `USE_FILE_STORE=1` (MongoDB required).

## Local (naya laptop / clone ke baad)

```bash
cd Library
npm install          # server/.env auto banega (.env.example se)
npm run setup        # server deps + Excel → catalog.json
npm run server       # API http://localhost:3001  (alag terminal)
npm start            # Expo app
```

Ya ek saath: `npm run dev` (server + Expo).

**Zaroori:** `Library/server/.env` mein `MONGODB_URI` hona chahiye. `npm install` / `npm run setup` pehli baar `.env.example` se copy karta hai. Render par jo URI hai wahi localhost par bhi — same books/students.

**Health check:** `http://localhost:3001/api/health` → `"ok": true`, `"mode": "mongodb"`.

## Local (sirf backend)

```bash
cd Library && npm run sync-backend
cd backend && npm install && npm start
```

## Excel books update

```bash
npm run sync-backend
git add backend/data/catalog.json
git commit -m "Update books"
git push
```

## Android APK (EAS)

```bash
cd Library
eas build -p android --profile preview
```

API URL: `https://library-app-2-e5ly.onrender.com` (in eas.json)

## Desktop (Windows / macOS / Linux)

Same app via Expo Web + Electron. End users: sirf `.exe` install — [Library/DESKTOP-USER-HINDI.md](Library/DESKTOP-USER-HINDI.md).

**Installer banana (developer):**

```bat
build-desktop.bat
```

Ya:

```bash
cd Library && npm install && npm run desktop:pack
```

Output: `Library/release/EJ MCAET Library Setup x.x.x.exe` (~150 MB, cloud API built-in).
