/**
 * Copies Library/server + catalog into src/ for Render deploy.
 * Run: node scripts/sync-api-to-src.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const data = path.join(src, 'data');

fs.mkdirSync(data, { recursive: true });

const copies = [
  [path.join(root, 'Library', 'server', 'index.js'), path.join(src, 'index.js')],
  [path.join(root, 'Library', 'server', 'file-store.js'), path.join(src, 'file-store.js')],
  [path.join(root, 'Library', 'src', 'data', 'catalog.json'), path.join(data, 'catalog.json')],
];

for (const [from, to] of copies) {
  if (!fs.existsSync(from)) {
    console.error('Missing:', from);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
}

let store = fs.readFileSync(path.join(src, 'file-store.js'), 'utf8');
store = store.replace(
  "path.join(__dirname, '..', 'src', 'data', 'catalog.json')",
  "path.join(__dirname, 'data', 'catalog.json')",
);
fs.writeFileSync(path.join(src, 'file-store.js'), store);

console.log('Synced API to src/ for Render');
