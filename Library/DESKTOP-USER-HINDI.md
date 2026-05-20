# EJ MCAET Library — Desktop App (Windows)

## Download

| Platform | File | Kaise milega |
|----------|------|----------------|
| **Windows** | `EJ MCAET Library Setup 1.0.0.exe` | `Library/release/` folder (build ke baad) |
| **macOS** | `EJ MCAET Library-x.x.x.dmg` | GitHub → Actions → **Build Desktop App** → **EJ-MCAET-Library-macOS** artifact |

Windows par Mac `.dmg` build nahi hota — Mac ke liye GitHub Actions se download karein (neeche).

## Install (kisi bhi user ke liye)

### Windows
1. **`EJ MCAET Library Setup 1.0.0.exe`** file par double-click karein.

### macOS
1. `.dmg` file open karein → app ko **Applications** folder mein drag karein.
2. Pehli baar: System Settings → Privacy → "Open Anyway" (agar blocked ho).
2. Install location choose karein → Install.
3. Desktop ya Start Menu se **EJ MCAET Library** open karein.

**Internet zaroori hai** — books aur login cloud server se aate hain.

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
npm run desktop:pack
```

**Ya GitHub se (Windows se bhi):**
1. Code GitHub par push karein
2. **Actions** tab → **Build Desktop App** → **Run workflow**
3. Complete hone par **EJ-MCAET-Library-macOS** artifact se `.dmg` download karein

Output: `Library/release/`
