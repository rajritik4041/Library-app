# Mac laptop par EJ MCAET Library — poora guide

Mac par **`.dmg` sirf Mac par hi banta hai**. Do tareeke hain — **download** (aasaan) ya **khud build** (developer).

---

## Pehle kya chahiye (dono tareeke ke liye)

| Cheez | Kyon |
|--------|------|
| **Internet** | Books + login cloud server se |
| **macOS** | Ventura / Sonoma / Sequoia (koi bhi recent Mac) |
| **GitHub login** | Sirf download wale tareeke ke liye (repo private hai) |

App install ke baad **local backend ki zaroorat nahi** — Mac, Windows aur Android **ek hi MongoDB** se connected hain (`library-app-2-e5ly.onrender.com`). Purani `.dmg` ho to naya build download karein.

---

## Tareeka 1 — GitHub se download (sabse aasaan) ⭐

Windows wale ne code push kar diya hai; Mac par sirf **download** karna hai.

### Step 1: Safari / Chrome kholo

Link (login ke baad khulega):

**https://github.com/rajritik4041/Library-app/actions/workflows/build-desktop.yml**

GitHub par **rajritik4041** account se login karo (jisne repo banayi hai).

### Step 2: Build run kholo

- Sabse upar **green ✓** wali run par click karo  
- Agar koi run na ho: right side **Run workflow** → branch **main** → **Run workflow**  
- 10–15 minute wait (page refresh karte raho)

### Step 3: `.dmg` download

1. Run page ke **neeche** scroll karo  
2. **Artifacts** section  
3. **EJ-MCAET-Library-macOS** par click → zip download hogi  
4. **Downloads** folder mein zip par double-click → zip khulegi  
5. Andar file milegi: **`EJ MCAET Library-1.0.0.dmg`** (naam thoda alag ho sakta hai)

### Step 4: Mac par install

1. `.dmg` par **double-click**  
2. Jo window khule, **EJ MCAET Library** icon ko **Applications** folder par **drag** karo  
3. **Applications** → **EJ MCAET Library** open karo  

**Agar “can’t be opened” / blocked aaye:**

- **System Settings** → **Privacy & Security**  
- Neeche **Open Anyway** dabao  
- Phir dubara app open karo  

### Step 5: Dusre Mac users ko bhejna

- `.dmg` file WhatsApp / Drive / USB se bhej do  
- Unhe bhi Step 4 follow karna hai  
- **Internet on** rakhein

---

## Tareeka 2 — Mac par khud build karna

Jab GitHub Actions kaam na kare ya naya version banana ho.

### Step 1: Software install (ek baar)

**Terminal** kholo (`Cmd + Space` → type `Terminal`).

**Node.js** (agar nahi hai):

```bash
# Homebrew hai to:
brew install node

# Ya browser se: https://nodejs.org — LTS version install
```

Check:

```bash
node -v
npm -v
```

**Git:**

```bash
git --version
# nahi hai to: xcode-select --install
```

### Step 2: Project Mac par lao

**Option A — GitHub se clone (recommended):**

```bash
cd ~/Downloads
git clone https://github.com/rajritik4041/Library-app.git
cd Library-app/Library
```

**Option B — USB / Google Drive se folder copy:**

- Windows se poora `Library-app` folder copy karo  
- Mac par kahi rakho, Terminal mein us folder ke `Library` andar jao:

```bash
cd ~/Downloads/Library-app/Library
```

### Step 3: Build chalao (10–20 minute)

```bash
npm install
npm run desktop:pack:mac
```

### Step 4: `.dmg` kahan milega

```bash
open release
```

Folder khulega — andar:

**`EJ MCAET Library-1.0.0.dmg`**

Isi file ko install karo (Tareeka 1 ka Step 4) ya kisi ko bhejo.

---

## Dark / Light mode

App navbar mein **🌙** / **☀️** se mode badlein — Android, Windows, Mac teeno par save hota hai.

**Library timing (IST):** Som–Shukr 9:00–17:00 · Shanivar 9:00–13:00 · Ravivar band.

## Mac par test (bina install, developer)

Sirf dekhne ke liye:

```bash
cd Library-app/Library
npm install
npm run desktop
```

Expo + window khulegi (internet chahiye).

---

## Short summary

| Kaun | Kya kare |
|------|----------|
| **Mac user (normal)** | GitHub Actions se `.dmg` download → install |
| **Mac par build** | `git clone` → `cd Library` → `npm install` → `npm run desktop:pack:mac` |
| **Windows user** | `.exe` use kare — `Library/release/EJ MCAET Library Setup 1.0.0.exe` |

---

## Problem?

| Problem | Hal |
|---------|-----|
| GitHub par repo nahi dikh rahi | Sahi account se login; repo owner se access mango |
| Artifacts nahi dikh rahe | Build abhi chal rahi ho ya fail — run par click karke error dekho |
| `npm run desktop:pack:mac` error | `npm install` dubara; Node 18+ use karo |
| App blank | Wi‑Fi on; 1 min wait; dubara open |
| Dark mode par text nahi dikhe | Naya build lo (latest code) |

Repo: **https://github.com/rajritik4041/Library-app**
