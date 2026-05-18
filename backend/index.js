import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import * as fileStore from './file-store.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/** true = Excel catalog.json + JSON issues (Mongo optional) */
let USE_FILE_MODE = false;

app.use(cors());
app.use(express.json());

const bookSchema = new mongoose.Schema(
  {
    catalogId: { type: String, required: true, unique: true },
    serialNo: Number,
    rackNo: String,
    title: { type: String, required: true },
    authors: String,
    publisher: String,
    department: String,
    subject: String,
    copies: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, unique: true, uppercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

const issueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    studentId: { type: String, required: true, uppercase: true, trim: true },
    studentName: { type: String, default: '' },
    teacherId: { type: String, required: true },
    teacherName: { type: String, default: '' },
    issuedAt: { type: Date, default: Date.now },
    returnedAt: { type: Date, default: null },
    status: { type: String, enum: ['issued', 'returned'], default: 'issued' },
  },
  { timestamps: true },
);

const Book = mongoose.model('Book', bookSchema);
const Teacher = mongoose.model('Teacher', teacherSchema);
const Issue = mongoose.model('Issue', issueSchema);

function authTeacher(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.teacher = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

async function getActiveIssueCount(bookId) {
  return Issue.countDocuments({ book: bookId, status: 'issued' });
}

async function enrichBook(book) {
  const issued = await getActiveIssueCount(book._id);
  const available = Math.max(0, book.copies - issued);
  return {
    id: book.catalogId,
    mongoId: book._id.toString(),
    serialNo: book.serialNo,
    rackNo: book.rackNo,
    title: book.title,
    authors: book.authors,
    publisher: book.publisher,
    department: book.department,
    subject: book.subject,
    copies: book.copies,
    issuedCount: issued,
    availableCount: available,
    status: available > 0 ? 'available' : 'issued_out',
  };
}

async function seedFromCatalog() {
  const count = await Book.countDocuments();
  if (count > 0) {
    return;
  }
  const catalogPath = path.join(__dirname, 'data', 'catalog.json');
  if (!fs.existsSync(catalogPath)) {
    console.log('No catalog.json to seed');
    return;
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const docs = catalog.books.map((b) => ({
    catalogId: String(b.id),
    serialNo: b.serialNo,
    rackNo: b.rackNo,
    title: b.title,
    authors: b.authors || '',
    publisher: b.publisher || '',
    department: b.department || '',
    subject: b.subject || '',
    copies: b.copies || 1,
  }));
  await Book.insertMany(docs);
  console.log(`Seeded ${docs.length} books from catalog.json`);
}

async function seedTeacher() {
  const teacherId = (process.env.DEFAULT_TEACHER_ID || 'T001').toUpperCase();
  const exists = await Teacher.findOne({ teacherId });
  if (exists) {
    return;
  }
  const password = process.env.DEFAULT_TEACHER_PASSWORD || 'teacher123';
  const hash = await bcrypt.hash(password, 10);
  await Teacher.create({
    teacherId,
    passwordHash: hash,
    name: process.env.DEFAULT_TEACHER_NAME || 'Library Teacher',
  });
  console.log(`Default teacher created: ${teacherId} / ${password}`);
}

// ——— Auth ———
app.post('/api/auth/teacher/login', async (req, res) => {
  try {
    const { teacherId, password } = req.body;
    if (!teacherId || !password) {
      return res.status(400).json({ error: 'Teacher ID and password required' });
    }
    let teacherRow = null;
    if (USE_FILE_MODE) {
      teacherRow = await fileStore.verifyFileTeacher(teacherId, password, process.env);
    } else {
      const teacher = await Teacher.findOne({ teacherId: String(teacherId).toUpperCase() });
      if (teacher && (await bcrypt.compare(password, teacher.passwordHash))) {
        teacherRow = { teacherId: teacher.teacherId, name: teacher.name };
      }
    }
    if (!teacherRow) {
      return res.status(401).json({ error: 'Invalid teacher ID or password' });
    }
    const token = jwt.sign(
      { teacherId: teacherRow.teacherId, name: teacherRow.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    res.json({
      token,
      teacher: { teacherId: teacherRow.teacherId, name: teacherRow.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authTeacher, (req, res) => {
  res.json({ teacher: req.teacher });
});

// ——— Books ———
app.get('/api/books', async (_req, res) => {
  try {
    if (USE_FILE_MODE) {
      const books = fileStore.fileGetBooks();
      return res.json({ books, total: books.length });
    }
    const books = await Book.find().sort({ serialNo: 1 });
    const enriched = await Promise.all(books.map(enrichBook));
    res.json({ books: enriched, total: enriched.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load books' });
  }
});

app.get('/api/books/:catalogId', async (req, res) => {
  try {
    if (USE_FILE_MODE) {
      const data = fileStore.fileGetBook(req.params.catalogId);
      if (!data) {
        return res.status(404).json({ error: 'Book not found' });
      }
      return res.json(data);
    }
    const book = await Book.findOne({ catalogId: req.params.catalogId });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const enriched = await enrichBook(book);
    const activeIssues = await Issue.find({ book: book._id, status: 'issued' })
      .sort({ issuedAt: -1 })
      .lean();
    res.json({
      book: enriched,
      activeIssues: activeIssues.map((i) => ({
        id: i._id.toString(),
        studentId: i.studentId,
        studentName: i.studentName,
        issuedAt: i.issuedAt,
        teacherId: i.teacherId,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load book' });
  }
});

app.post('/api/books', authTeacher, async (req, res) => {
  try {
    const { title, authors, publisher, department, subject, rackNo, copies, serialNo } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (USE_FILE_MODE) {
      const book = fileStore.fileAddBook({
        title,
        authors,
        publisher,
        department,
        subject,
        rackNo,
        copies,
        serialNo,
      });
      return res.status(201).json({ book });
    }
    const maxSerial = await Book.findOne().sort({ serialNo: -1 }).select('serialNo');
    const nextSerial = serialNo || (maxSerial?.serialNo || 0) + 1;
    const catalogId = String(Date.now());
    const book = await Book.create({
      catalogId,
      serialNo: nextSerial,
      title: title.trim(),
      authors: authors?.trim() || '',
      publisher: publisher?.trim() || '',
      department: department?.trim() || 'MISC',
      subject: subject?.trim() || 'MISC',
      rackNo: String(rackNo ?? ''),
      copies: Math.max(1, Number(copies) || 1),
    });
    res.status(201).json({ book: await enrichBook(book) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to add book' });
  }
});

app.delete('/api/books/:catalogId', authTeacher, async (req, res) => {
  try {
    if (USE_FILE_MODE) {
      fileStore.fileDeleteBook(req.params.catalogId);
      return res.json({ ok: true });
    }
    const book = await Book.findOne({ catalogId: req.params.catalogId });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const active = await getActiveIssueCount(book._id);
    if (active > 0) {
      return res.status(400).json({ error: 'Cannot delete: book has active issues. Return all copies first.' });
    }
    await Book.deleteOne({ _id: book._id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to delete book' });
  }
});

// ——— Issues ———
app.get('/api/issues/active', authTeacher, async (_req, res) => {
  try {
    if (USE_FILE_MODE) {
      return res.json({ issues: fileStore.fileGetActiveIssues() });
    }
    const issues = await Issue.find({ status: 'issued' })
      .populate('book')
      .sort({ issuedAt: -1 })
      .lean();
    res.json({
      issues: issues.map((i) => ({
        id: i._id.toString(),
        studentId: i.studentId,
        studentName: i.studentName,
        teacherId: i.teacherId,
        teacherName: i.teacherName,
        issuedAt: i.issuedAt,
        book: i.book
          ? {
              id: i.book.catalogId,
              title: i.book.title,
              rackNo: i.book.rackNo,
              department: i.book.department,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load issues' });
  }
});

app.post('/api/issues', authTeacher, async (req, res) => {
  try {
    const { bookId, studentId, studentName } = req.body;
    if (!bookId || !studentId?.trim()) {
      return res.status(400).json({ error: 'Book ID and Student ID required' });
    }
    if (USE_FILE_MODE) {
      const { id, book, issuedAt } = fileStore.filePostIssue({
        bookId: String(bookId),
        studentId,
        studentName,
        teacherId: req.teacher.teacherId,
        teacherName: req.teacher.name,
      });
      return res.status(201).json({
        issue: {
          id,
          studentId: String(studentId).toUpperCase().trim(),
          studentName,
          issuedAt,
        },
        book,
      });
    }
    const book = await Book.findOne({ catalogId: String(bookId) });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const issued = await getActiveIssueCount(book._id);
    if (issued >= book.copies) {
      return res.status(400).json({ error: 'No copies available in library' });
    }
    const issue = await Issue.create({
      book: book._id,
      studentId: String(studentId).toUpperCase().trim(),
      studentName: studentName?.trim() || '',
      teacherId: req.teacher.teacherId,
      teacherName: req.teacher.name,
      status: 'issued',
    });
    res.status(201).json({
      issue: {
        id: issue._id.toString(),
        studentId: issue.studentId,
        studentName: issue.studentName,
        issuedAt: issue.issuedAt,
      },
      book: await enrichBook(book),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to issue book' });
  }
});

app.post('/api/issues/:issueId/return', authTeacher, async (req, res) => {
  try {
    if (USE_FILE_MODE) {
      const { book } = fileStore.fileReturnIssue(req.params.issueId);
      return res.json({ ok: true, book });
    }
    const issue = await Issue.findById(req.params.issueId).populate('book');
    if (!issue || issue.status !== 'issued') {
      return res.status(404).json({ error: 'Active issue not found' });
    }
    issue.status = 'returned';
    issue.returnedAt = new Date();
    await issue.save();
    res.json({
      ok: true,
      book: issue.book ? await enrichBook(issue.book) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to return book' });
  }
});

app.get('/api/stats', async (_req, res) => {
  try {
    if (USE_FILE_MODE) {
      return res.json(fileStore.fileStats());
    }
    const totalBooks = await Book.countDocuments();
    const books = await Book.find();
    let totalCopies = 0;
    let availableCopies = 0;
    for (const b of books) {
      totalCopies += b.copies;
      const issued = await getActiveIssueCount(b._id);
      availableCopies += Math.max(0, b.copies - issued);
    }
    const activeIssues = await Issue.countDocuments({ status: 'issued' });
    res.json({ totalBooks, totalCopies, availableCopies, activeIssues });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: USE_FILE_MODE ? 'file' : 'mongodb' });
});

app.post('/api/sync-catalog', authTeacher, async (_req, res) => {
  try {
    if (USE_FILE_MODE) {
      return res.json({
        ok: true,
        message: 'FILE mode: list from data/catalog.json on disk.',
      });
    }
    const catalogPath = path.join(__dirname, 'data', 'catalog.json');
    if (!fs.existsSync(catalogPath)) {
      return res.status(404).json({ error: 'catalog.json not found. Run npm run import-books' });
    }
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    let upserted = 0;
    for (const b of catalog.books) {
      await Book.findOneAndUpdate(
        { catalogId: String(b.id) },
        {
          catalogId: String(b.id),
          serialNo: b.serialNo,
          rackNo: b.rackNo,
          title: b.title,
          authors: b.authors || '',
          publisher: b.publisher || '',
          department: b.department || '',
          subject: b.subject || '',
          copies: b.copies || 1,
        },
        { upsert: true, new: true },
      );
      upserted += 1;
    }
    res.json({ ok: true, upserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

async function start() {
  const uri = process.env.MONGODB_URI;
  const forceFile =
    process.env.USE_FILE_STORE === 'true' ||
    process.env.USE_FILE_STORE === '1' ||
    !uri?.trim();

  if (forceFile) {
    USE_FILE_MODE = true;
    await fileStore.initFileTeacher(process.env);
    console.log('FILE mode: data/catalog.json | issues → data/issues.json');
  } else {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
      USE_FILE_MODE = false;
      console.log('MongoDB connected');
      await seedTeacher();
      await seedFromCatalog();
    } catch (e) {
      console.warn('MongoDB connect failed → FILE mode:', e.message);
      USE_FILE_MODE = true;
      await fileStore.initFileTeacher(process.env);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API http://localhost:${PORT} | mode=${USE_FILE_MODE ? 'FILE' : 'MongoDB'}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
