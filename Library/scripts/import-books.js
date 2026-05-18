/**
 * Syncs src/data/catalog.json from assets/sheets.xlsx
 * Run automatically before start, or: npm run import-books
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');

const root = path.join(__dirname, '..');
const excelPath = path.join(root, 'assets', 'sheets.xlsx');
const outputPath = path.join(root, 'src', 'data', 'catalog.json');

function normalizeRack(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const raw = String(value).trim();
  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && raw !== '') {
    return String(numeric);
  }
  return raw;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return '';
}

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

const books = rows
  .filter((row) => row['Book Title'] && String(row['Book Title']).trim())
  .map((row) => {
    const rackNo = normalizeRack(pick(row, ['Rack No.', 'Rack No', 'Rack']));
    return {
      id: String(row['S. No.']),
      serialNo: Number(row['S. No.']) || 0,
      rackNo,
      title: String(row['Book Title']).trim(),
      authors: String(pick(row, ["Author's", 'Author', 'Authors']) ?? '').trim(),
      publisher: String(pick(row, ['Publisher']) ?? '').trim(),
      department: String(
        pick(row, [
          'Department (FMPE , PFE, SWCE ,IDE, REE, BEAS)',
          'Department',
        ]),
      ).trim(),
      subject: String(
        pick(row, [
          'Subject (FMPE, PFE, SWCE, IDE, REE, ME, CSE, CE, CHEM, MISC)',
          'Subject',
        ]),
      ).trim(),
      copies: Number(row['No. of copies']) || 1,
    };
  });

const excelBuffer = fs.readFileSync(excelPath);
const checksum = crypto.createHash('md5').update(excelBuffer).digest('hex');

const catalog = {
  meta: {
    sourceFile: 'assets/sheets.xlsx',
    sheetName,
    updatedAt: new Date().toISOString(),
    totalBooks: books.length,
    totalCopies: books.reduce((sum, book) => sum + book.copies, 0),
    checksum,
  },
  books,
};

fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));

// Web app loads this at runtime (no restart needed after Excel save + import)
const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'catalog.json'), JSON.stringify(catalog, null, 2));

// Keep legacy file in sync for any external tooling
fs.writeFileSync(path.join(root, 'src', 'data', 'books.json'), JSON.stringify(books, null, 2));

console.log(`✓ Catalog synced: ${books.length} books`);
console.log(`  → src/data/catalog.json`);
console.log(`  → public/catalog.json (web live reload)`);
