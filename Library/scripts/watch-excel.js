/**
 * Watches assets/sheets.xlsx and re-syncs catalog when Excel is saved.
 * Run alongside Expo: npm run watch-books
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const excelPath = path.join(root, 'assets', 'sheets.xlsx');

if (!fs.existsSync(excelPath)) {
  console.error('Excel file not found:', excelPath);
  process.exit(1);
}

let debounce;

function sync() {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    try {
      console.log('\n📗 Excel updated — syncing catalog...');
      execSync('node ./scripts/import-books.js', { cwd: root, stdio: 'inherit' });
      console.log('↻ Reload the app (or wait for hot reload)\n');
    } catch (error) {
      console.error('Sync failed:', error.message);
    }
  }, 400);
}

console.log('👀 Watching', excelPath);
console.log('   Edit & save the Excel file to auto-update the app data.\n');

sync();

fs.watch(excelPath, { persistent: true }, sync);
