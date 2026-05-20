/**
 * Bidirectional sync: Google Sheet ↔ MongoDB (same rows, same count).
 * - Sheet edit (admin) → mirror into MongoDB (upsert + remove extras).
 * - App/DB edit (teacher) → mirror into Sheet (full rewrite).
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
const DATA_START_ROW = Number(process.env.GOOGLE_SHEET_DATA_START_ROW || 3);
const HEADER_ROW = 1;

let sheetsApi = null;
let sheetId = null;
let lastSheetHash = '';
let lastMongoHash = '';
let pushLockUntil = 0;
let lastMongoMutationAt = 0;
let pendingMongoToSheet = false;
let lastWriteCheckAt = 0;
let syncTimer = null;
let lastReconcile = null;
let sheetWriteOk = true;
let sheetWriteError = '';

/** App CRUD ke baad kitni der tak sheet→mongo band (revert rokne ke liye) */
const RECENT_MONGO_MS = Number(process.env.SHEET_RECENT_MONGO_MS || 120000);
const SHEET_WRITE_HINT =
  'Google Sheet → Share → service account email ko Editor banaein (Viewer se kaam nahi chalega).';

/** Call after teacher add/edit/delete in MongoDB so reconcile prefers mongo→sheet */
export function noteMongoChanged() {
  lastMongoMutationAt = Date.now();
  pendingMongoToSheet = true;
}

/** Server start par — khali hash se sheetChanged=true hone se bachne ke liye */
export async function bootstrapSyncHashes(Book) {
  if (!Book || !isSheetsSyncEnabled()) return;
  try {
    const sheetBooks = await readBooksFromSheet();
    lastSheetHash = hashSheetBooks(sheetBooks);
    lastMongoHash = await hashMongoBooks(Book);
  } catch (e) {
    console.warn('Sync hash bootstrap:', e.message);
  }
}

function envPrivateKey() {
  const raw = process.env.GOOGLE_PRIVATE_KEY || '';
  return raw.replace(/\\n/g, '\n').trim();
}

/** Accept raw ID or full Google Sheets URL from .env */
export function parseGoogleSheetId(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const fromUrl = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromUrl) return fromUrl[1];
  const beforeEdit = s.split('/edit')[0].split('?')[0].trim();
  if (/^[a-zA-Z0-9-_]{20,}$/.test(beforeEdit)) return beforeEdit;
  return s;
}

export function isSheetsSyncEnabled() {
  return Boolean(
    parseGoogleSheetId(process.env.GOOGLE_SHEET_ID) &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
      envPrivateKey(),
  );
}

async function getClient() {
  if (sheetsApi) return sheetsApi;
  if (!isSheetsSyncEnabled()) return null;

  const { google } = await import('googleapis');
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim(),
    key: envPrivateKey(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  await auth.authorize();
  sheetsApi = google.sheets({ version: 'v4', auth });
  sheetId = parseGoogleSheetId(process.env.GOOGLE_SHEET_ID);
  return sheetsApi;
}

function rowToBook(cells) {
  const serial = Number(cells[0]);
  const title = String(cells[2] ?? '').trim();
  if (!title || !serial || Number.isNaN(serial)) return null;
  return {
    serialNo: serial,
    rackNo: String(cells[1] ?? '').trim(),
    title,
    authors: String(cells[3] ?? '').trim(),
    publisher: String(cells[4] ?? '').trim(),
    department: String(cells[5] ?? '').trim() || 'MISC',
    subject: String(cells[6] ?? '').trim() || 'MISC',
    copies: Math.max(1, Number(cells[7]) || 1),
  };
}

function bookToRow(book) {
  return [
    book.serialNo,
    book.rackNo ?? '',
    book.title ?? '',
    book.authors ?? '',
    book.publisher ?? '',
    book.department ?? 'MISC',
    book.subject ?? 'MISC',
    book.copies ?? 1,
  ];
}

function hashBookRows(books) {
  const rows = books
    .slice()
    .sort((a, b) => a.serialNo - b.serialNo)
    .map((b) => bookToRow(b));
  return crypto.createHash('md5').update(JSON.stringify(rows)).digest('hex');
}

function hashSheetBooks(sheetBooks) {
  return hashBookRows(sheetBooks);
}

async function hashMongoBooks(Book) {
  const docs = await Book.find().sort({ serialNo: 1 }).lean();
  const books = docs.map((d) => ({
    serialNo: d.serialNo,
    rackNo: d.rackNo,
    title: d.title,
    authors: d.authors,
    publisher: d.publisher,
    department: d.department,
    subject: d.subject,
    copies: d.copies,
  }));
  return hashBookRows(books);
}

export async function readBooksFromSheet() {
  const client = await getClient();
  if (!client) return [];

  const range = `${SHEET_TAB}!A${DATA_START_ROW}:H2000`;
  const res = await client.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const values = res.data.values || [];
  const books = [];
  for (const row of values) {
    const book = rowToBook(row);
    if (book) books.push(book);
  }
  return books;
}

async function writeSheetRows(books) {
  const client = await getClient();
  if (!client) return 0;

  pushLockUntil = Date.now() + 15000;

  try {
    return await writeSheetRowsInner(client, books);
  } catch (e) {
    const msg = e?.message || String(e);
    if (/permission|403|denied/i.test(msg)) {
      sheetWriteOk = false;
      sheetWriteError =
        `Google Sheet par likhne ki permission nahi. Sheet ko "${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}" ko Editor access dein.`;
      console.error('❌', sheetWriteError);
    }
    throw e;
  }
}

async function writeSheetRowsInner(client, books) {
  const header = [
    'S. No.',
    'Rack No.',
    'Book Title',
    "Author's",
    'Publisher',
    'Department (FMPE , PFE, SWCE ,IDE, REE, BEAS)',
    'Subject (FMPE, PFE, SWCE, IDE, REE, ME, CSE, CE, CHEM, MISC)',
    'No. of copies',
  ];

  const dataRows = books
    .slice()
    .sort((a, b) => a.serialNo - b.serialNo)
    .map((b) => bookToRow(b));

  const clearRange = `${SHEET_TAB}!A${DATA_START_ROW}:H2000`;
  await client.spreadsheets.values.clear({ spreadsheetId: sheetId, range: clearRange });
  await client.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEET_TAB}!A${HEADER_ROW}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [header] },
  });
  if (dataRows.length > 0) {
    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_TAB}!A${DATA_START_ROW}:H${DATA_START_ROW + dataRows.length - 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: dataRows },
    });
  }

  lastSheetHash = hashSheetBooks(books);
  sheetWriteOk = true;
  sheetWriteError = '';
  console.log(`MongoDB → Sheet: ${dataRows.length} rows written`);
  return dataRows.length;
}

/** Remove duplicate MongoDB rows for the same serial number */
async function dedupeBySerial(Book) {
  const all = await Book.find().sort({ updatedAt: -1, serialNo: 1 });
  const seen = new Map();
  let removed = 0;
  for (const doc of all) {
    const key = doc.serialNo;
    if (seen.has(key)) {
      await Book.deleteOne({ _id: doc._id });
      removed += 1;
    } else {
      seen.set(key, doc);
    }
  }
  return removed;
}

/**
 * Sheet is source of truth: MongoDB becomes exact copy (same serials, delete orphans).
 */
export async function mirrorSheetToMongo(Book, countActiveIssues, options = {}) {
  if (!Book || !isSheetsSyncEnabled()) {
    return { upserted: 0, removed: 0, skipped: true };
  }
  if (Date.now() < pushLockUntil) {
    return { upserted: 0, removed: 0, skipped: true, reason: 'push-lock' };
  }

  /** When sheet is read-only, never delete Mongo rows the app added (Excel write blocked). */
  const allowMongoDeletes = options.allowDeletes ?? sheetWriteOk;

  const sheetBooks = await readBooksFromSheet();
  const sheetHash = hashSheetBooks(sheetBooks);
  const sheetSerials = new Set(sheetBooks.map((b) => b.serialNo));

  let upserted = 0;
  for (const sb of sheetBooks) {
    const catalogId = String(sb.serialNo);
    const existing = await Book.find({ serialNo: sb.serialNo });
    if (existing.length > 1) {
      const keep = existing.find((d) => d.catalogId === catalogId) || existing[0];
      for (const d of existing) {
        if (d._id.toString() !== keep._id.toString()) {
          await Book.deleteOne({ _id: d._id });
        }
      }
    }
    await Book.findOneAndUpdate(
      { serialNo: sb.serialNo },
      {
        catalogId,
        serialNo: sb.serialNo,
        rackNo: sb.rackNo,
        title: sb.title,
        authors: sb.authors,
        publisher: sb.publisher,
        department: sb.department,
        subject: sb.subject,
        copies: sb.copies,
      },
      { upsert: true, new: true },
    );
    upserted += 1;
  }

  let removed = 0;
  const mongoBooks = await Book.find();
  for (const doc of mongoBooks) {
    if (sheetSerials.has(doc.serialNo)) continue;
    if (!allowMongoDeletes) {
      console.warn(
        `Sync: kept mongo-only book #${doc.serialNo} (sheet write blocked — app changes safe)`,
      );
      continue;
    }
    const active = countActiveIssues ? await countActiveIssues(doc._id) : 0;
    if (active > 0) {
      console.warn(`Sync: kept book #${doc.serialNo} in Mongo — ${active} active issue(s)`);
      continue;
    }
    await Book.deleteOne({ _id: doc._id });
    removed += 1;
  }

  await dedupeBySerial(Book);
  lastSheetHash = sheetHash;
  lastMongoHash = await hashMongoBooks(Book);
  await writeCatalogJsonFromMongo(Book);

  const mongoCount = await Book.countDocuments();
  console.log(
    `Sheet → MongoDB: ${upserted} upserted, ${removed} removed | sheet=${sheetBooks.length} mongo=${mongoCount}`,
  );
  return { upserted, removed, sheetCount: sheetBooks.length, mongoCount, skipped: false };
}

/** MongoDB is source of truth: Sheet becomes exact copy */
export async function mirrorMongoToSheet(Book) {
  if (!Book || !isSheetsSyncEnabled()) {
    return { pushed: 0, skipped: true };
  }

  const docs = await Book.find().sort({ serialNo: 1 }).lean();
  const books = docs.map((d) => ({
    serialNo: d.serialNo,
    rackNo: d.rackNo,
    title: d.title,
    authors: d.authors,
    publisher: d.publisher,
    department: d.department,
    subject: d.subject,
    copies: d.copies,
  }));

  const pushed = await writeSheetRows(books);
  await writeCatalogJsonFromMongo(Book);
  const mongoCount = docs.length;
  lastMongoHash = hashBookRows(books);
  lastSheetHash = lastMongoHash;
  console.log(`Sync OK: sheet=${pushed} mongo=${mongoCount}`);
  return { pushed, mongoCount, sheetCount: pushed, skipped: false };
}

async function maybeRecheckSheetWrite() {
  if (Date.now() - lastWriteCheckAt < 5 * 60 * 1000) return;
  lastWriteCheckAt = Date.now();
  await verifySheetWriteAccess();
}

/** Smart two-way reconcile — app/Mongo edits ko sheet se overwrite nahi hone deta */
export async function reconcile(Book, countActiveIssues) {
  if (!Book || !isSheetsSyncEnabled()) {
    return { inSync: false, skipped: true };
  }

  await maybeRecheckSheetWrite();

  const sheetBooks = await readBooksFromSheet();
  const sheetHash = hashSheetBooks(sheetBooks);
  const mongoHash = await hashMongoBooks(Book);
  const sheetCount = sheetBooks.length;
  const mongoCount = await Book.countDocuments();
  /** Khali lastSheetHash = restart — isko "sheet changed" mat samjho */
  const sheetChanged = Boolean(lastSheetHash) && sheetHash !== lastSheetHash;
  const mongoChanged = Boolean(lastMongoHash) && mongoHash !== lastMongoHash;
  const countMismatch = sheetCount !== mongoCount;
  const contentMismatch = sheetHash !== mongoHash;
  const recentMongoEdit = Date.now() - lastMongoMutationAt < RECENT_MONGO_MS;
  const protectMongo = recentMongoEdit || pendingMongoToSheet;
  const mongoAhead = mongoCount > sheetCount;

  let result;
  if (protectMongo) {
    if (sheetWriteOk) {
      try {
        result = await mirrorMongoToSheet(Book);
        pendingMongoToSheet = false;
        result.direction = 'mongo→sheet (app change)';
      } catch (e) {
        result = {
          direction: 'mongo→sheet-failed',
          error: e.message,
          sheetCount,
          mongoCount,
          inSync: false,
          skipped: false,
        };
      }
    } else {
      result = {
        direction: 'mongo→sheet-blocked (app change protected)',
        sheetCount,
        mongoCount,
        inSync: false,
        skipped: false,
        error: sheetWriteError || SHEET_WRITE_HINT,
      };
      await writeCatalogJsonFromMongo(Book);
      lastMongoHash = mongoHash;
    }
  } else if (sheetChanged) {
    result = await mirrorSheetToMongo(Book, countActiveIssues, {
      allowDeletes: sheetWriteOk,
    });
    result.direction = sheetWriteOk ? 'sheet→mongo' : 'sheet→mongo (read-only sheet)';
  } else if ((countMismatch || contentMismatch) && sheetWriteOk) {
    /** Sheet edit nahi hui — app/Mongo edit ko purani sheet se revert mat karo */
    try {
      result = await mirrorMongoToSheet(Book);
      pendingMongoToSheet = false;
      result.direction = 'mongo→sheet (content drift)';
    } catch (e) {
      result = {
        direction: 'mongo→sheet-failed',
        error: e.message,
        sheetCount,
        mongoCount,
        inSync: false,
        skipped: false,
      };
    }
  } else if ((countMismatch || contentMismatch) && !sheetWriteOk) {
    result = {
      direction: 'mongo→sheet-blocked',
      sheetCount,
      mongoCount,
      inSync: false,
      skipped: false,
      error: sheetWriteError || SHEET_WRITE_HINT,
    };
    console.warn(result.error);
    await writeCatalogJsonFromMongo(Book);
    lastMongoHash = mongoHash;
  } else if (countMismatch || contentMismatch) {
    result = await mirrorSheetToMongo(Book, countActiveIssues, {
      allowDeletes: false,
    });
    result.direction = 'sheet→mongo (read-only sheet drift)';
  } else {
    result = {
      direction: 'none',
      sheetCount,
      mongoCount,
      inSync: true,
      skipped: false,
    };
    lastMongoHash = mongoHash;
    lastSheetHash = sheetHash;
  }

  const finalMongo = await Book.countDocuments();
  const finalSheet = (await readBooksFromSheet()).length;
  const finalMongoHash = await hashMongoBooks(Book);
  const finalSheetBooks = await readBooksFromSheet();
  result.inSync =
    finalMongo === finalSheet && hashSheetBooks(finalSheetBooks) === finalMongoHash;
  result.contentInSync = hashSheetBooks(finalSheetBooks) === finalMongoHash;
  result.sheetCount = finalSheet;
  result.mongoCount = finalMongo;
  result.sheetWriteOk = sheetWriteOk;
  lastReconcile = { at: new Date().toISOString(), ...result };
  return result;
}

export async function getSyncStatus(Book) {
  const sheetBooks = isSheetsSyncEnabled() ? await readBooksFromSheet() : [];
  const mongoCount = Book ? await Book.countDocuments() : 0;
  const sheetCount = sheetBooks.length;
  const sheetHash = hashSheetBooks(sheetBooks);
  const mongoHash = Book ? await hashMongoBooks(Book) : '';
  return {
    enabled: isSheetsSyncEnabled(),
    sheetCount,
    mongoCount,
    inSync: sheetCount === mongoCount && sheetHash === mongoHash,
    contentInSync: sheetHash === mongoHash,
    sheetWriteOk,
    sheetWriteError: sheetWriteError || undefined,
    sheetHash,
    mongoHash,
    lastSheetHash,
    sheetChanged: Boolean(lastSheetHash) && sheetHash !== lastSheetHash,
    pendingMongoToSheet,
    lastReconcile,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(),
  };
}

/** Verify service account can write to the spreadsheet */
export async function verifySheetWriteAccess() {
  if (!isSheetsSyncEnabled()) return { ok: false, error: 'Not configured' };
  try {
    const client = await getClient();
    await client.spreadsheets.get({ spreadsheetId: sheetId, fields: 'properties.title' });
    const testRange = `${SHEET_TAB}!Z1`;
    await client.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: testRange,
      valueInputOption: 'RAW',
      requestBody: { values: [['sync-ok']] },
    });
    sheetWriteOk = true;
    sheetWriteError = '';
    return { ok: true };
  } catch (e) {
    sheetWriteOk = false;
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || 'service account';
    sheetWriteError =
      e?.message ||
      `Permission denied — open Google Sheet → Share → add ${email} as Editor (not Viewer).`;
    return { ok: false, error: sheetWriteError, serviceAccountEmail: email };
  }
}

/** After app CRUD: push Mongo → Sheet when allowed; always refresh catalog.json */
export async function pushAfterMongoCrud(Book) {
  noteMongoChanged();
  await writeCatalogJsonFromMongo(Book);
  if (Book) {
    lastMongoHash = await hashMongoBooks(Book);
  }
  if (!isSheetsSyncEnabled()) {
    return { ok: true, skipped: true };
  }
  if (!sheetWriteOk) {
    await maybeRecheckSheetWrite();
  }
  if (!sheetWriteOk) {
    return {
      ok: false,
      error: sheetWriteError || SHEET_WRITE_HINT,
      hint: SHEET_WRITE_HINT,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(),
    };
  }
  try {
    const r = await mirrorMongoToSheet(Book);
    pendingMongoToSheet = false;
    return { ok: true, ...r };
  } catch (e) {
    return {
      ok: false,
      error: e.message,
      hint: SHEET_WRITE_HINT,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(),
    };
  }
}

/** @deprecated use pushAfterMongoCrud */
export async function pushSingleBookToSheet(Book) {
  return pushAfterMongoCrud(Book);
}

/** @deprecated use mirrorSheetToMongo */
export async function syncSheetToMongo(Book, countActiveIssues) {
  return mirrorSheetToMongo(Book, countActiveIssues);
}

/** @deprecated use mirrorMongoToSheet */
export async function syncMongoToSheet(Book) {
  return mirrorMongoToSheet(Book);
}

async function writeCatalogJsonFromMongo(Book) {
  const docs = await Book.find().sort({ serialNo: 1 }).lean();
  const catalog = {
    meta: {
      sourceFile: 'google-sheet-sync',
      sheetName: SHEET_TAB,
      updatedAt: new Date().toISOString(),
      totalBooks: docs.length,
      totalCopies: docs.reduce((s, b) => s + (b.copies || 1), 0),
    },
    books: docs.map((b) => ({
      id: String(b.serialNo),
      serialNo: b.serialNo,
      rackNo: b.rackNo,
      title: b.title,
      authors: b.authors || '',
      publisher: b.publisher || '',
      department: b.department || '',
      subject: b.subject || '',
      copies: b.copies || 1,
    })),
  };

  const targets = [
    path.join(__dirname, '..', 'src', 'data', 'catalog.json'),
    path.join(__dirname, '..', 'public', 'catalog.json'),
  ];
  for (const p of targets) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, JSON.stringify(catalog, null, 2));
    } catch (e) {
      console.warn('catalog.json write failed:', p, e.message);
    }
  }
}

export function startSheetSyncLoop(Book, countActiveIssues, intervalMs = 30000) {
  if (!isSheetsSyncEnabled() || !Book) {
    console.log('Google Sheets sync: disabled');
    return;
  }

  const tick = async () => {
    try {
      const { withMongoRetry } = await import('./mongo-connection.js');
      const uri = process.env.MONGODB_URI;
      await withMongoRetry(() => reconcile(Book, countActiveIssues), { uri, retries: 2 });
    } catch (e) {
      console.warn('Sheet sync error:', e.message);
    }
  };

  void tick();
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(tick, intervalMs);
  console.log(`Google Sheets sync: reconcile every ${intervalMs / 1000}s`);
}

export function stopSheetSyncLoop() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}
