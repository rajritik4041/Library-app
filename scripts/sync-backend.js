/**
 * Excel → catalog.json → backend/data (Render deploy)
 * Run from repo root: npm run sync-backend
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const library = path.join(root, 'Library');
const backend = path.join(root, 'backend');
const data = path.join(backend, 'data');

console.log('1) Import Excel → Library/src/data/catalog.json');
execSync('node ./scripts/import-books.js', { cwd: library, stdio: 'inherit' });

fs.mkdirSync(data, { recursive: true });

const copies = [
  [path.join(library, 'src', 'data', 'catalog.json'), path.join(data, 'catalog.json')],
  [path.join(library, 'server', 'index.js'), path.join(backend, 'index.js')],
  [path.join(library, 'server', 'file-store.js'), path.join(backend, 'file-store.js')],
];

for (const [from, to] of copies) {
  if (!fs.existsSync(from)) {
    console.error('Missing:', from);
    process.exit(1);
  }
  fs.copyFileSync(from, to);
}

let store = fs.readFileSync(path.join(backend, 'file-store.js'), 'utf8');
store = store.replace(
  /path\.join\(__dirname,\s*'(\.\.',\s*)?'src',\s*'data',\s*'catalog\.json'\)/g,
  "path.join(__dirname, 'data', 'catalog.json')",
);
store = store.replace(
  "path.join(__dirname, '..', 'src', 'data', 'catalog.json')",
  "path.join(__dirname, 'data', 'catalog.json')",
);
fs.writeFileSync(path.join(backend, 'file-store.js'), store);

const catalog = JSON.parse(fs.readFileSync(path.join(data, 'catalog.json'), 'utf8'));
console.log(`✓ backend ready: ${catalog.books?.length ?? 0} books`);
