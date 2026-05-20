/**
 * Minimal folder for electron-builder — only dist + electron (no Expo node_modules).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'desktop-app');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('Missing dist/index.html — run: npm run export-web');
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

fs.cpSync(DIST, path.join(OUT, 'dist'), { recursive: true });
fs.cpSync(path.join(ROOT, 'electron'), path.join(OUT, 'electron'), { recursive: true });
fs.copyFileSync(
  path.join(__dirname, 'electron-builder.desktop.json'),
  path.join(OUT, 'electron-builder.json'),
);

const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

fs.writeFileSync(
  path.join(OUT, 'package.json'),
  JSON.stringify(
    {
      name: 'ej-mcaet-library-desktop',
      version: rootPkg.version || '1.0.0',
      description: 'EJ MCAET College Library — Windows / macOS / Linux',
      main: 'electron/main.js',
      author: 'MCAET',
      private: true,
    },
    null,
    2,
  ),
);

console.log('desktop-app/ ready for electron-builder');
