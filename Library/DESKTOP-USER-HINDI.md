# EJ MCAET Library — Desktop App

> **Mac laptop par step-by-step:** [MAC-LAPTOP-GUIDE-HINDI.md](MAC-LAPTOP-GUIDE-HINDI.md)

## Download

| Platform | File | Kaise milega |
|----------|------|----------------|
| **Windows** | `EJ MCAET Library Setup 1.0.0.exe` | `Library/release/` folder (build ke baad) |
| **macOS** | `EJ MCAET Library-1.0.0.dmg` (ya similar) | Neeche **macOS download** dekhein |

### macOS .dmg abhi download kaise karein

Code GitHub par push ho chuka hai — **Build Desktop App** workflow chal chuki hogi.

1. Browser mein kholo:  
   **https://github.com/rajritik4041/Library-app/actions/workflows/build-desktop.yml**
2. Sabse upar wali **green** run (commit: macOS dmg CI…) par click karein.
3. Neeche scroll → **Artifacts** → **EJ-MCAET-Library-macOS** → Download (zip).
4. Zip kholo — andar `.dmg` Mac par double-click / Applications mein drag karein.

**PowerShell (login ke baad auto-download):**
```powershell
cd Library\scripts
.\download-mac-dmg.ps1
```
(Pehli baar: `gh auth login` — GitHub username/password ya browser se login)

Windows par Mac `.dmg` build nahi hota — Mac ke liye GitHub Actions se download karein (neeche).

## Dark / Light mode

Navbar mein **🌙 Dark** ya **☀️ Light** dabayein — choice save rehti hai. Android, Windows `.exe`, aur Mac `.dmg` teeno par kaam karti hai.

**Library timing (IST):** Som–Shukr 9:00–17:00 · Shanivar 9:00–13:00 · Ravivar band.

## Install (kisi bhi user ke liye)

### Windows
1. **`EJ MCAET Library Setup 1.0.0.exe`** file par double-click karein.

### macOS
1. `.dmg` file open karein → app ko **Applications** folder mein drag karein.
2. Pehli baar: System Settings → Privacy → "Open Anyway" (agar blocked ho).
2. Install location choose karein → Install.
3. Desktop ya Start Menu se **EJ MCAET Library** open karein.

**Internet zaroori hai** — Android, Windows aur Mac **teeno same MongoDB** (Render) se books leta hain. Teacher add/delete ~12 sec mein sab par dikhega. About page par **API server** check karein: `library-app-2-e5ly.onrender.com`

## Kya kar sakte hain (bina extra setup)

| Feature | Kaise |
|---------|--------|
| College info | Home |
| Books browse | Books tab (login optional) |
| Teacher login | Welcome → Teacher |
| Student login | Welcome → Student |
| Issue / Return | Teacher panel |
| Student register | Teacher panel |
| Apni issued books | Student login → Issued |
| History | Teacher → History |

## Default login (teacher — agar server par set ho)

- Teacher ID: `T001`
- Password: server admin ne jo set kiya ho (README / college IT)

Students ka login teacher banata hai (User ID + password).

## Problem?

| Problem | Solution |
|---------|----------|
| Blank screen | Internet check karein, app dubara open karein |
| Login fail | Teacher ID / password sahi? Server slow ho to 1 min wait |
| Books nahi dikhte | Internet + dubara Books tab |
| Purana version | Naya installer dubara install karein |

## Developer — naya installer banana

**Windows (.exe):**
```bat
cd Library
build-desktop.bat
```

**macOS (.dmg)** — Mac machine par:
```bash
cd Library
npm install
npm run desktop:pack:mac
```

**Ya GitHub se (Windows se bhi):**
1. Code GitHub par push karein
2. **Actions** tab → **Build Desktop App** → **Run workflow**
3. Complete hone par **EJ-MCAET-Library-macOS** artifact se `.dmg` download karein

Output: `Library/release/`
