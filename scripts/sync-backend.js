/**
 * Library/server → backend/ (Render deploy source)
 * Run from repo root: npm run sync-backend
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const library = path.join(root, 'Library');
const server = path.join(library, 'server');
const backend = path.join(root, 'backend');
const data = path.join(backend, 'data');

const skipImport =
  process.argv.includes('--no-import') || process.env.SKIP_CATALOG_IMPORT === '1';
const excelPath = path.join(library, 'assets', 'sheets.xlsx');

if (!skipImport && fs.existsSync(excelPath)) {
  console.log('1) Import Excel → Library/src/data/catalog.json');
  execSync('node ./scripts/import-books.js', { cwd: library, stdio: 'inherit' });
} else {
  console.log('1) Skip Excel import (use existing catalog.json)');
}

fs.mkdirSync(data, { recursive: true });

const copies = [
  [path.join(library, 'src', 'data', 'catalog.json'), path.join(data, 'catalog.json')],
  [path.join(server, 'index.js'), path.join(backend, 'index.js')],
  [path.join(server, 'file-store.js'), path.join(backend, 'file-store.js')],
  [path.join(server, 'google-sheets-sync.js'), path.join(backend, 'google-sheets-sync.js')],
  [path.join(server, 'mongo-connection.js'), path.join(backend, 'mongo-connection.js')],
  [path.join(server, 'issue-limits.js'), path.join(backend, 'issue-limits.js')],
  [path.join(server, 'package.json'), path.join(backend, 'package.json')],
  [path.join(server, '.env.example'), path.join(backend, '.env.example')],
  [path.join(server, 'scripts', 'ensure-env.js'), path.join(backend, 'scripts', 'ensure-env.js')],
];

fs.mkdirSync(path.join(backend, 'scripts'), { recursive: true });

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
store = store.replace(
  "path.join(__dirname, '..', 'public', 'catalog.json')",
  "path.join(__dirname, 'data', 'catalog.json')",
);
fs.writeFileSync(path.join(backend, 'file-store.js'), store);

let sync = fs.readFileSync(path.join(backend, 'google-sheets-sync.js'), 'utf8');
sync = sync.replace(
  "path.join(__dirname, '..', 'src', 'data', 'catalog.json')",
  "path.join(__dirname, 'data', 'catalog.json')",
);
sync = sync.replace(
  "path.join(__dirname, '..', 'public', 'catalog.json')",
  "path.join(__dirname, 'data', 'catalog.json')",
);
fs.writeFileSync(path.join(backend, 'google-sheets-sync.js'), sync);

const catalog = JSON.parse(fs.readFileSync(path.join(data, 'catalog.json'), 'utf8'));
console.log(`✓ backend synced: ${catalog.books?.length ?? 0} books (Render deploy ready)`);
