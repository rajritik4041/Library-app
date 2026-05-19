# EJ MCAET Library — Desktop App (Windows)

## Install (kisi bhi user ke liye)

1. **`EJ MCAET Library Setup 1.0.0.exe`** file par double-click karein.
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

## Developer — naya .exe banana

```bat
cd Library
build-desktop.bat
```

Output: `Library\release\EJ MCAET Library Setup x.x.x.exe`
