# EJ MCAET Library App

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

**Env:** `USE_FILE_STORE=1`, `JWT_SECRET=...`, `DEFAULT_TEACHER_ID=T001`, `DEFAULT_TEACHER_PASSWORD=teacher123`

## Local

```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd Library && npm install && npm start
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

API URL: `https://library-app-x9zn.onrender.com` (in eas.json)
