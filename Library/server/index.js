import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import * as fileStore from './file-store.js';
import * as sheetSync from './google-sheets-sync.js';
import {
  assertStudentCanIssueInMongo,
  httpStatusFromIssueError,
} from './issue-limits.js';
import { connectMongo, ensureMongoConnected, withMongoRetry } from './mongo-connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/** true = Excel catalog.json + JSON issues (Mongo optional) */
let USE_FILE_MODE = false;
/** Why FILE mode started (health / debugging) */
let FILE_MODE_REASON = '';

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
    mobile: { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true },
    inCharge: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

const deanSchema = new mongoose.Schema(
  {
    deanId: { type: String, required: true, unique: true, uppercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

const studentSchema = new mongoose.Schema(
  {
    /** Student ID No — enrollment / roll (unique, used when issuing books) */
    studentId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    /** Student User ID — login username assigned by teacher (unique, stored in MongoDB) */
    studentUserId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    course: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
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
const Dean = mongoose.model('Dean', deanSchema);
const Student = mongoose.model('Student', studentSchema);
const Issue = mongoose.model('Issue', issueSchema);

function verifyToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  try {
    return jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function staffFromPayload(payload) {
  if (payload.role === 'dean') {
    return {
      role: 'dean',
      teacherId: payload.deanId,
      deanId: payload.deanId,
      name: payload.name,
    };
  }
  return {
    role: 'teacher',
    teacherId: payload.teacherId,
    name: payload.name,
    mobile: payload.mobile,
    department: payload.department,
    inCharge: payload.inCharge,
  };
}

function authTeacher(req, res, next) {
  const payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Login required' });
  }
  if (payload.role === 'student') {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  if (payload.role === 'dean' && payload.deanId) {
    req.auth = payload;
    req.teacher = staffFromPayload(payload);
    return next();
  }
  if (payload.role === 'teacher' && payload.teacherId) {
    req.auth = payload;
    req.teacher = staffFromPayload(payload);
    return next();
  }
  return res.status(401).json({ error: 'Invalid session' });
}

function authDean(req, res, next) {
  const payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Login required' });
  }
  if (payload.role !== 'dean' || !payload.deanId) {
    return res.status(403).json({ error: 'Dean access required' });
  }
  req.auth = payload;
  req.dean = { deanId: payload.deanId, name: payload.name };
  next();
}

function teacherPublic(doc) {
  const d = doc?.toObject ? doc.toObject() : doc;
  return {
    teacherId: d.teacherId,
    name: d.name,
    mobile: d.mobile || '',
    department: d.department || '',
    inCharge: d.inCharge || '',
    createdAt: d.createdAt,
  };
}

function authStudent(req, res, next) {
  const payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Login required' });
  }
  if (payload.role !== 'student' || (!payload.studentUserId && !payload.userId && !payload.studentId)) {
    return res.status(403).json({ error: 'Student access required' });
  }
  req.student = payload;
  next();
}

function studentPublic(doc) {
  const d = doc?.toObject ? doc.toObject() : doc;
  const loginId = d.studentUserId || d.userId || '';
  return {
    studentId: d.studentId,
    userId: loginId,
    studentUserId: loginId,
    name: d.name,
    mobile: d.mobile,
    course: d.course,
    year: d.year,
    department: d.department,
    createdAt: d.createdAt,
  };
}

function parseStudentUserId(body) {
  return String(body.studentUserId || body.userId || '')
    .toUpperCase()
    .trim();
}

async function findStudentByLogin(loginId) {
  const id = String(loginId).toUpperCase().trim();
  if (!id) return null;
  if (USE_FILE_MODE) {
    return fileStore.fileFindStudentByLogin(id);
  }
  return Student.findOne({
    $or: [{ studentUserId: id }, { userId: id }],
  });
}

async function findStudentByIdNo(idNo) {
  const id = String(idNo).toUpperCase().trim();
  if (USE_FILE_MODE) {
    return fileStore.fileFindStudent(id);
  }
  return Student.findOne({ studentId: id });
}

/** Lookup by Student User ID, legacy userId, or Student ID No */
async function findStudentByKey(key) {
  const id = String(key).toUpperCase().trim();
  if (!id) return null;
  if (USE_FILE_MODE) {
    return fileStore.fileFindStudentByKey(id);
  }
  return Student.findOne({
    $or: [{ studentUserId: id }, { userId: id }, { studentId: id }],
  });
}

async function getActiveIssueCount(bookId) {
  return Issue.countDocuments({ book: bookId, status: 'issued' });
}

/** One aggregation instead of N countDocuments (fixes slow /api/books & /api/stats). */
async function getIssuedCountByBookId() {
  const rows = await Issue.aggregate([
    { $match: { status: 'issued' } },
    { $group: { _id: '$book', count: { $sum: 1 } } },
  ]);
  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), row.count);
  }
  return map;
}

function formatSheetWarning(sheetPush) {
  const email =
    sheetPush.serviceAccountEmail ||
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ||
    'service account email';
  return (
    sheetPush.hint ||
    `MongoDB mein save ho gaya, par Excel update fail. Google Sheet kholo → Share → ${email} ko Editor banaein.`
  );
}

async function requireRegisteredStudentByIdNo(studentIdInput) {
  const student = await findStudentByIdNo(studentIdInput);
  if (!student) {
    return null;
  }
  const doc = student?.toObject ? student.toObject() : student;
  return {
    studentId: doc.studentId,
    name: (doc.name || '').trim(),
  };
}

async function findBookByCatalogOrSerial(bookIdInput) {
  const raw = String(bookIdInput).trim();
  if (!raw) return null;
  if (USE_FILE_MODE) {
    const data = fileStore.fileGetBook(raw);
    if (data?.book) return { catalogId: String(data.book.id), book: data.book };
    const books = fileStore.fileGetBooks();
    const bySerial = books.find((b) => String(b.serialNo) === raw);
    if (bySerial) {
      return { catalogId: String(bySerial.id), book: bySerial };
    }
    return null;
  }
  let book = await Book.findOne({ catalogId: raw });
  if (!book && /^\d+$/.test(raw)) {
    book = await Book.findOne({ serialNo: Number(raw) });
  }
  if (!book && mongoose.Types.ObjectId.isValid(raw)) {
    book = await Book.findById(raw);
  }
  if (!book) return null;
  return { catalogId: book.catalogId, book };
}

let catalogById;
let catalogBySerial;

function loadCatalogLookup() {
  if (catalogBySerial) return;
  catalogById = new Map();
  catalogBySerial = new Map();
  const candidates = [
    path.join(__dirname, '..', 'src', 'data', 'catalog.json'),
    path.join(__dirname, 'data', 'catalog.json'),
  ];
  const catalogPath = candidates.find((p) => fs.existsSync(p));
  if (!catalogPath) return;
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  for (const b of catalog.books || []) {
    catalogById.set(String(b.id), b);
    catalogBySerial.set(Number(b.serialNo), b);
  }
}

function catalogEntry(doc) {
  loadCatalogLookup();
  if (!catalogBySerial) return null;
  return (
    catalogById.get(String(doc.catalogId)) ||
    catalogBySerial.get(Number(doc.serialNo)) ||
    null
  );
}

function resolveRackNo(doc) {
  const direct = String(doc.rackNo ?? '').trim();
  if (direct) return direct;
  const hit = catalogEntry(doc);
  return String(hit?.rackNo ?? '').trim();
}

function resolvePublisher(doc) {
  const direct = String(doc.publisher ?? '').trim();
  if (direct) return direct;
  const hit = catalogEntry(doc);
  return String(hit?.publisher ?? '').trim();
}

function resolveAuthors(doc) {
  const direct = String(doc.authors ?? '').trim();
  if (direct) return direct;
  const hit = catalogEntry(doc);
  return String(hit?.authors ?? '').trim();
}

async function verifyTeacherPassword(teacherId, password) {
  if (!password) return false;
  if (USE_FILE_MODE) {
    const row = await fileStore.verifyFileTeacher(teacherId, password);
    return Boolean(row);
  }
  const teacher = await Teacher.findOne({ teacherId: String(teacherId).toUpperCase() });
  if (!teacher) return false;
  return bcrypt.compare(password, teacher.passwordHash);
}

async function verifyDeanPassword(deanId, password) {
  if (!password) return false;
  if (USE_FILE_MODE) {
    const row = await fileStore.verifyFileDean(deanId, password);
    return Boolean(row);
  }
  const dean = await Dean.findOne({ deanId: String(deanId).toUpperCase() });
  if (!dean) return false;
  return bcrypt.compare(password, dean.passwordHash);
}

async function verifyStaffPassword(staff, password) {
  if (!staff || !password) return false;
  if (staff.role === 'dean' || staff.deanId) {
    return verifyDeanPassword(staff.deanId || staff.teacherId, password);
  }
  return verifyTeacherPassword(staff.teacherId, password);
}

function formatEnrichedBook(book, issued = 0) {
  const available = Math.max(0, book.copies - issued);
  return {
    id: book.catalogId,
    mongoId: book._id.toString(),
    serialNo: book.serialNo,
    rackNo: resolveRackNo(book),
    title: book.title,
    authors: resolveAuthors(book),
    publisher: resolvePublisher(book),
    department: book.department,
    subject: book.subject,
    copies: book.copies,
    issuedCount: issued,
    availableCount: available,
    status: available > 0 ? 'available' : 'issued_out',
  };
}

async function enrichBook(book, issuedByBookId) {
  const issued =
    issuedByBookId?.get(String(book._id)) ??
    (await getActiveIssueCount(book._id));
  return formatEnrichedBook(book, issued);
}

async function seedFromCatalog() {
  const count = await Book.countDocuments();
  if (count > 0) {
    return;
  }
  const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
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

async function migrateStudentUserIds() {
  const all = await Student.find({});
  let migrated = 0;
  for (const s of all) {
    let changed = false;
    if (!s.studentUserId?.trim()) {
      s.studentUserId = (s.userId || s.studentId || '').toUpperCase().trim();
      changed = true;
    }
    if (s.userId !== undefined) {
      s.set('userId', undefined, { strict: false });
      changed = true;
    }
    if (changed) {
      await s.save();
      migrated += 1;
    }
  }
  if (migrated > 0) {
    console.log(`Migrated studentUserId for ${migrated} student(s)`);
  }
  try {
    await Student.syncIndexes();
  } catch (e) {
    console.warn('Student index sync:', e.message);
  }
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
    mobile: '',
    department: '',
    inCharge: '',
  });
  console.log(`Default teacher created: ${teacherId} / ${password}`);
}

async function seedDean() {
  const deanId = (process.env.DEFAULT_DEAN_ID || 'DEAN01').toUpperCase();
  const exists = await Dean.findOne({ deanId });
  if (exists) {
    return;
  }
  const password = process.env.DEFAULT_DEAN_PASSWORD || 'dean123';
  const hash = await bcrypt.hash(password, 10);
  await Dean.create({
    deanId,
    passwordHash: hash,
    name: process.env.DEFAULT_DEAN_NAME || 'Dean Sir',
  });
  console.log(`Default dean created: ${deanId} / ${password}`);
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
      teacherRow = await fileStore.verifyFileTeacher(teacherId, password);
    } else {
      const teacher = await Teacher.findOne({ teacherId: String(teacherId).toUpperCase() });
      if (teacher && (await bcrypt.compare(password, teacher.passwordHash))) {
        teacherRow = teacherPublic(teacher);
      }
    }
    if (!teacherRow) {
      return res.status(401).json({ error: 'Invalid teacher ID or password' });
    }
    const token = jwt.sign(
      {
        role: 'teacher',
        teacherId: teacherRow.teacherId,
        name: teacherRow.name,
        mobile: teacherRow.mobile,
        department: teacherRow.department,
        inCharge: teacherRow.inCharge,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    res.json({ token, teacher: teacherRow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/student/login', async (req, res) => {
  try {
    const loginId = parseStudentUserId(req.body);
    const { password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Student User ID and password required' });
    }
    let studentRow = null;
    if (USE_FILE_MODE) {
      studentRow = await fileStore.verifyFileStudent(loginId, password);
    } else {
      const student = await findStudentByLogin(loginId);
      if (student && (await bcrypt.compare(password, student.passwordHash))) {
        studentRow = studentPublic(student);
      }
    }
    if (!studentRow) {
      return res.status(401).json({ error: 'Invalid User ID or password' });
    }
    const token = jwt.sign(
      { role: 'student', ...studentRow },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    res.json({ token, student: studentRow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/dean/login', async (req, res) => {
  try {
    const { deanId, password } = req.body;
    if (!deanId || !password) {
      return res.status(400).json({ error: 'Dean ID and password required' });
    }
    let deanRow = null;
    if (USE_FILE_MODE) {
      deanRow = await fileStore.verifyFileDean(deanId, password);
    } else {
      const dean = await Dean.findOne({ deanId: String(deanId).toUpperCase() });
      if (dean && (await bcrypt.compare(password, dean.passwordHash))) {
        deanRow = { deanId: dean.deanId, name: dean.name };
      }
    }
    if (!deanRow) {
      return res.status(401).json({ error: 'Invalid dean ID or password' });
    }
    const token = jwt.sign(
      { role: 'dean', deanId: deanRow.deanId, name: deanRow.name },
      JWT_SECRET,
      { expiresIn: '7d' },
    );
    res.json({ token, dean: deanRow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  if (payload.role === 'student') {
    return res.json({
      role: 'student',
      student: {
        studentId: payload.studentId,
        userId: payload.studentUserId || payload.userId || '',
        studentUserId: payload.studentUserId || payload.userId || '',
        name: payload.name,
        mobile: payload.mobile,
        course: payload.course,
        year: payload.year,
        department: payload.department,
      },
    });
  }
  if (payload.role === 'dean') {
    return res.json({
      role: 'dean',
      dean: { deanId: payload.deanId, name: payload.name },
    });
  }
  res.json({
    role: 'teacher',
    teacher: {
      teacherId: payload.teacherId,
      name: payload.name,
      mobile: payload.mobile || '',
      department: payload.department || '',
      inCharge: payload.inCharge || '',
    },
  });
});

// ——— Dean: manage teachers (only dean can create/edit/delete teacher accounts) ———
app.get('/api/dean/teachers', authDean, async (_req, res) => {
  try {
    if (USE_FILE_MODE) {
      return res.json({ teachers: fileStore.fileListTeachers() });
    }
    const teachers = await Teacher.find().sort({ teacherId: 1 });
    res.json({ teachers: teachers.map(teacherPublic) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load teachers' });
  }
});

app.post('/api/dean/teachers', authDean, async (req, res) => {
  try {
    const { teacherId, password, name, mobile, department, inCharge } = req.body;
    if (!teacherId?.trim() || !password || !name?.trim()) {
      return res.status(400).json({ error: 'Teacher ID, password, and name required' });
    }
    if (USE_FILE_MODE) {
      const teacher = await fileStore.fileCreateTeacher({
        teacherId,
        password,
        name,
        mobile,
        department,
        inCharge,
      });
      return res.status(201).json({ teacher });
    }
    const id = String(teacherId).toUpperCase().trim();
    const exists = await Teacher.findOne({ teacherId: id });
    if (exists) {
      return res.status(409).json({ error: 'Teacher ID already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const doc = await Teacher.create({
      teacherId: id,
      passwordHash: hash,
      name: String(name).trim(),
      mobile: String(mobile || '').trim(),
      department: String(department || '').trim(),
      inCharge: String(inCharge || '').trim(),
    });
    res.status(201).json({ teacher: teacherPublic(doc) });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to create teacher' });
  }
});

app.put('/api/dean/teachers/:teacherId', authDean, async (req, res) => {
  try {
    const key = String(req.params.teacherId).toUpperCase().trim();
    const { password, name, mobile, department, inCharge } = req.body;
    if (USE_FILE_MODE) {
      const teacher = await fileStore.fileUpdateTeacher(key, {
        password,
        name,
        mobile,
        department,
        inCharge,
      });
      return res.json({ teacher });
    }
    const doc = await Teacher.findOne({ teacherId: key });
    if (!doc) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    if (name !== undefined) doc.name = String(name).trim();
    if (mobile !== undefined) doc.mobile = String(mobile).trim();
    if (department !== undefined) doc.department = String(department).trim();
    if (inCharge !== undefined) doc.inCharge = String(inCharge).trim();
    if (password) {
      doc.passwordHash = await bcrypt.hash(password, 10);
    }
    await doc.save();
    res.json({ teacher: teacherPublic(doc) });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to update teacher' });
  }
});

app.delete('/api/dean/teachers/:teacherId', authDean, async (req, res) => {
  try {
    const key = String(req.params.teacherId).toUpperCase().trim();
    if (USE_FILE_MODE) {
      fileStore.fileDeleteTeacher(key);
      return res.json({ ok: true });
    }
    const result = await Teacher.deleteOne({ teacherId: key });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to delete teacher' });
  }
});

// ——— Students (teacher) ———
app.get('/api/students', authTeacher, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    if (USE_FILE_MODE) {
      return res.json({ students: fileStore.fileListStudents(search) });
    }
    const filter = search
      ? {
          $or: [
            { studentId: { $regex: search, $options: 'i' } },
            { studentUserId: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { mobile: { $regex: search, $options: 'i' } },
            { course: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    const students = await Student.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ students: students.map(studentPublic) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load students' });
  }
});

app.get('/api/students/lookup', authTeacher, async (req, res) => {
  try {
    const key = String(req.query.key || '').trim();
    const by = String(req.query.by || 'any');
    if (!key) {
      return res.status(400).json({ error: 'Student key required' });
    }
    const student = by === 'idNo' ? await findStudentByIdNo(key) : await findStudentByKey(key);
    if (!student) {
      return res.status(404).json({ error: 'Student not registered' });
    }
    res.json({ student: studentPublic(student) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

app.get('/api/students/:studentKey', authTeacher, async (req, res) => {
  try {
    const student = await findStudentByKey(decodeURIComponent(String(req.params.studentKey || '')));
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ student: studentPublic(student) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load student' });
  }
});

app.post('/api/students', authTeacher, async (req, res) => {
  try {
    const { studentId, password, name, mobile, course, year, department } = req.body;
    const loginId = parseStudentUserId(req.body);
    if (!studentId?.trim() || !loginId || !password || !name?.trim() || !mobile?.trim()) {
      return res.status(400).json({
        error: 'Student ID No, Student User ID, password, name, and mobile are required',
      });
    }
    if (!course?.trim() || !year?.trim() || !department?.trim()) {
      return res.status(400).json({ error: 'Course, year, and department are required' });
    }
    const idNo = String(studentId).toUpperCase().trim();
    const mobileNorm = String(mobile).trim();
    if (USE_FILE_MODE) {
      const student = await fileStore.fileCreateStudent({
        studentId: idNo,
        studentUserId: loginId,
        password,
        name: name.trim(),
        mobile: mobileNorm,
        course: course.trim(),
        year: year.trim(),
        department: department.trim(),
      });
      return res.status(201).json({ student });
    }
    const existsId = await Student.findOne({ studentId: idNo });
    if (existsId) {
      return res.status(409).json({ error: 'Student ID No already exists' });
    }
    const existsUser = await Student.findOne({ studentUserId: loginId });
    if (existsUser) {
      return res.status(409).json({ error: 'Student User ID already exists' });
    }
    const existsMobile = await Student.findOne({ mobile: mobileNorm });
    if (existsMobile) {
      return res.status(409).json({ error: 'Mobile number already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const student = await Student.create({
      studentId: idNo,
      studentUserId: loginId,
      passwordHash,
      name: name.trim(),
      mobile: mobileNorm,
      course: course.trim(),
      year: year.trim(),
      department: department.trim(),
    });
    res.status(201).json({ student: studentPublic(student) });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const key = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).json({ error: `Duplicate ${key} — must be unique` });
    }
    res.status(500).json({ error: err.message || 'Failed to create student' });
  }
});

app.put('/api/students/:studentKey', authTeacher, async (req, res) => {
  try {
    const existing = await findStudentByKey(req.params.studentKey);
    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const idNo = existing.studentId;
    const loginIdInput = parseStudentUserId(req.body);
    const { password, name, mobile, course, year, department } = req.body;
    if (USE_FILE_MODE) {
      const student = await fileStore.fileUpdateStudent(idNo, {
        studentUserId: loginIdInput || undefined,
        password,
        name,
        mobile,
        course,
        year,
        department,
      });
      return res.json({ student });
    }
    const student = await Student.findOne({ studentId: idNo });
    if (loginIdInput) {
      const clash = await Student.findOne({
        studentUserId: loginIdInput,
        studentId: { $ne: idNo },
      });
      if (clash) {
        return res.status(409).json({ error: 'Student User ID already in use' });
      }
      student.studentUserId = loginIdInput;
    }
    if (name?.trim()) student.name = name.trim();
    if (mobile?.trim()) {
      const mobileNorm = mobile.trim();
      const clashMobile = await Student.findOne({ mobile: mobileNorm, studentId: { $ne: idNo } });
      if (clashMobile) {
        return res.status(409).json({ error: 'Mobile number already in use' });
      }
      student.mobile = mobileNorm;
    }
    if (course?.trim()) student.course = course.trim();
    if (year?.trim()) student.year = year.trim();
    if (department?.trim()) student.department = department.trim();
    if (password) {
      student.passwordHash = await bcrypt.hash(password, 10);
    }
    await student.save();
    res.json({ student: studentPublic(student) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to update student' });
  }
});

app.delete('/api/students/:studentKey', authTeacher, async (req, res) => {
  try {
    const rawKey = decodeURIComponent(String(req.params.studentKey || ''));
    const existing = await findStudentByKey(rawKey);
    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const idNo = existing.studentId;
    if (USE_FILE_MODE) {
      fileStore.fileDeleteStudent(idNo);
      return res.json({ ok: true });
    }
    const student = await Student.findOne({ studentId: idNo });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const activeIssues = await Issue.countDocuments({ studentId: idNo, status: 'issued' });
    if (activeIssues > 0) {
      return res.status(400).json({
        error: 'Cannot delete: student has books issued. Return all books first.',
      });
    }
    await Student.deleteOne({ _id: student._id });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to delete student' });
  }
});

/** Student updates own profile (mobile / password) */
app.patch('/api/students/me', authStudent, async (req, res) => {
  try {
    const { mobile, password, name } = req.body;
    const idNo = req.student.studentId;
    if (USE_FILE_MODE) {
      const student = await fileStore.fileUpdateStudent(idNo, {
        mobile,
        password,
        name,
      });
      return res.json({ student });
    }
    const student = await Student.findOne({ studentId: idNo });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    if (name?.trim()) student.name = name.trim();
    if (mobile?.trim()) student.mobile = mobile.trim();
    if (password) {
      student.passwordHash = await bcrypt.hash(password, 10);
    }
    await student.save();
    res.json({ student: studentPublic(student) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Update failed' });
  }
});

// ——— Books ———
app.get('/api/books', async (_req, res) => {
  try {
    if (USE_FILE_MODE) {
      const books = fileStore.fileGetBooks();
      return res.json({ books, total: books.length });
    }
    const books = await Book.find().sort({ serialNo: 1 });
    const issuedByBookId = await getIssuedCountByBookId();
    const enriched = books.map((b) =>
      formatEnrichedBook(b, issuedByBookId.get(String(b._id)) || 0),
    );
    res.json({ books: enriched, total: enriched.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load books' });
  }
});

app.get('/api/books/:catalogId', async (req, res) => {
  try {
    const catalogKey = decodeURIComponent(String(req.params.catalogId || ''));
    if (USE_FILE_MODE) {
      const data = fileStore.fileGetBook(catalogKey);
      if (!data) {
        return res.status(404).json({ error: 'Book not found' });
      }
      return res.json(data);
    }
    const found = await findBookByCatalogOrSerial(catalogKey);
    if (!found) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const book = await Book.findOne({ catalogId: found.catalogId });
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
    const catalogId = String(nextSerial);
    sheetSync.noteMongoChanged();
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
    const sheetPush = await sheetSync.pushAfterMongoCrud(Book);
    const sheetWarning = sheetPush.ok
      ? undefined
      : formatSheetWarning(sheetPush);
    if (sheetWarning) console.warn('Sheet push after add:', sheetPush.error);
    res.status(201).json({ book: await enrichBook(book), sheetWarning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to add book' });
  }
});

app.put('/api/books/:catalogId', authTeacher, async (req, res) => {
  try {
    const catalogKey = decodeURIComponent(String(req.params.catalogId || ''));
    const { title, authors, publisher, department, subject, rackNo, copies, serialNo } = req.body;
    if (USE_FILE_MODE) {
      const found = await findBookByCatalogOrSerial(catalogKey);
      if (!found) {
        return res.status(404).json({ error: 'Book not found' });
      }
      const book = fileStore.fileUpdateBook(found.catalogId, {
        title,
        authors,
        publisher,
        department,
        subject,
        rackNo,
        copies,
        serialNo,
      });
      return res.json({ book });
    }
    const found = await findBookByCatalogOrSerial(catalogKey);
    if (!found) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const book = await Book.findOne({ catalogId: found.catalogId });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (title?.trim()) book.title = title.trim();
    if (authors !== undefined) book.authors = String(authors).trim();
    if (publisher !== undefined) book.publisher = String(publisher).trim();
    if (department !== undefined) book.department = String(department).trim() || 'MISC';
    if (subject !== undefined) book.subject = String(subject).trim() || 'MISC';
    if (rackNo !== undefined) book.rackNo = String(rackNo);
    if (copies !== undefined) book.copies = Math.max(1, Number(copies) || 1);
    if (serialNo !== undefined && Number(serialNo) > 0) {
      const nextSerial = Number(serialNo);
      const clash = await Book.findOne({
        serialNo: nextSerial,
        catalogId: { $ne: book.catalogId },
      });
      if (clash) {
        return res.status(409).json({ error: `Serial ${nextSerial} already used by another book` });
      }
      book.serialNo = nextSerial;
      book.catalogId = String(nextSerial);
    }
    sheetSync.noteMongoChanged();
    await book.save();
    const sheetPush = await sheetSync.pushAfterMongoCrud(Book);
    const sheetWarning = sheetPush.ok ? undefined : formatSheetWarning(sheetPush);
    if (sheetWarning) console.warn('Sheet push after edit:', sheetPush.error);
    res.json({ book: await enrichBook(book), sheetWarning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to update book' });
  }
});

app.delete('/api/books/:catalogId', authTeacher, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Apna password daalein — book delete ke liye zaroori hai' });
    }
    const passwordOk = await verifyStaffPassword(req.teacher, password);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Galat password — book delete nahi hui' });
    }
    const catalogKey = decodeURIComponent(String(req.params.catalogId || ''));
    if (USE_FILE_MODE) {
      const found = await findBookByCatalogOrSerial(catalogKey);
      if (!found) {
        return res.status(404).json({ error: 'Book not found' });
      }
      fileStore.fileDeleteBook(found.catalogId);
      return res.json({ ok: true });
    }
    const found = await findBookByCatalogOrSerial(catalogKey);
    if (!found) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const book = await Book.findOne({ catalogId: found.catalogId });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const active = await getActiveIssueCount(book._id);
    if (active > 0) {
      return res.status(400).json({ error: 'Cannot delete: book has active issues. Return all copies first.' });
    }
    sheetSync.noteMongoChanged();
    await Book.deleteOne({ _id: book._id });
    const sheetPush = await sheetSync.pushAfterMongoCrud(Book);
    const sheetWarning = sheetPush.ok ? undefined : formatSheetWarning(sheetPush);
    if (sheetWarning) console.warn('Sheet push after delete:', sheetPush.error);
    res.json({ ok: true, sheetWarning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to delete book' });
  }
});

// ——— Issues ———
app.get('/api/issues/mine', authStudent, async (req, res) => {
  try {
    const studentId = req.student.studentId;
    if (USE_FILE_MODE) {
      return res.json({ issues: fileStore.fileGetStudentIssues(studentId) });
    }
    const issues = await Issue.find({ studentId, status: 'issued' })
      .populate('book')
      .sort({ issuedAt: -1 })
      .lean();
    res.json({
      issues: issues.map((i) => ({
        id: i._id.toString(),
        studentId: i.studentId,
        studentName: i.studentName,
        issuedAt: i.issuedAt,
        book: i.book
          ? {
              id: i.book.catalogId,
              title: i.book.title,
              rackNo: resolveRackNo(i.book),
              department: i.book.department,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load your books' });
  }
});

function mapIssueHistoryRow(i, bookDoc) {
  return {
    id: i._id?.toString?.() || i.id,
    studentId: i.studentId,
    studentName: i.studentName || '',
    teacherId: i.teacherId,
    teacherName: i.teacherName || '',
    status: i.status,
    issuedAt: i.issuedAt,
    returnedAt: i.returnedAt || null,
    book: bookDoc
      ? {
          id: bookDoc.catalogId || bookDoc.id,
          title: bookDoc.title,
          rackNo: resolveRackNo(bookDoc),
          department: bookDoc.department,
        }
      : null,
  };
}

app.get('/api/issues/history', authTeacher, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 300, 1), 500);
    if (USE_FILE_MODE) {
      return res.json({ issues: fileStore.fileGetIssueHistory(limit) });
    }
    const issues = await Issue.find()
      .populate('book')
      .sort({ issuedAt: -1 })
      .limit(limit)
      .lean();
    res.json({
      issues: issues.map((i) => mapIssueHistoryRow(i, i.book)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load issue history' });
  }
});

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
              rackNo: resolveRackNo(i.book),
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
      return res.status(400).json({ error: 'Book ID and Student ID No required' });
    }
    const registered = await requireRegisteredStudentByIdNo(studentId);
    if (!registered) {
      return res.status(400).json({
        error: 'Student not registered. Pehle teacher panel se student register karein (ID No se).',
      });
    }
    const sid = registered.studentId;
    const resolvedName = registered.name || studentName?.trim() || '';
    if (!resolvedName) {
      return res.status(400).json({ error: 'Student name missing — update student profile' });
    }
    const bookLookup = await findBookByCatalogOrSerial(bookId);
    if (!bookLookup) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const catalogId = bookLookup.catalogId;
    if (USE_FILE_MODE) {
      const { id, book, issuedAt } = fileStore.filePostIssue({
        bookId: catalogId,
        studentId: sid,
        studentName: resolvedName,
        teacherId: req.teacher.teacherId,
        teacherName: req.teacher.name,
      });
      return res.status(201).json({
        issue: {
          id,
          studentId: sid,
          studentName: resolvedName,
          issuedAt,
        },
        book,
      });
    }
    const book = await assertStudentCanIssueInMongo(Issue, Book, sid, catalogId);
    const issued = await getActiveIssueCount(book._id);
    if (issued >= book.copies) {
      return res.status(400).json({ error: 'No copies available in library' });
    }
    const issue = await Issue.create({
      book: book._id,
      studentId: sid,
      studentName: resolvedName,
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
    res
      .status(httpStatusFromIssueError(err))
      .json({ error: err.message || 'Failed to issue book' });
  }
});

app.post('/api/issues/:issueId/return', authTeacher, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Teacher password required to confirm return' });
    }
    const passwordOk = await verifyStaffPassword(req.teacher, password);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Galat password — return confirm nahi hua' });
    }
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
    const books = await Book.find().lean();
    const issuedByBookId = await getIssuedCountByBookId();
    let totalCopies = 0;
    let availableCopies = 0;
    for (const b of books) {
      totalCopies += b.copies;
      const issued = issuedByBookId.get(String(b._id)) || 0;
      availableCopies += Math.max(0, b.copies - issued);
    }
    const activeIssues = [...issuedByBookId.values()].reduce((s, n) => s + n, 0);
    const totalBooks = books.length;
    res.json({ totalBooks, totalCopies, availableCopies, activeIssues });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
});

app.get('/api/health', async (_req, res) => {
  const mode = USE_FILE_MODE ? 'file' : 'mongodb';
  const readyState = mongoose.connection.readyState;
  const mongoConnected = readyState === 1;

  const payload = {
    ok: mode === 'mongodb' && mongoConnected,
    mode,
    storage:
      mode === 'mongodb'
        ? 'mongodb'
        : 'server/data/*.json + src/data/catalog.json (FILE mode only)',
    mongo: {
      configured: Boolean(process.env.MONGODB_URI?.trim()),
      connected: mongoConnected,
      readyState,
    },
    hint:
      mode === 'mongodb'
        ? 'Live data from MongoDB — same URI on localhost and Render = same books/students'
        : FILE_MODE_REASON ||
          'Set MONGODB_URI in server/.env (copy from Render). USE_FILE_STORE=0. Then: npm run server',
  };

  if (mode === 'file') {
    payload.warning =
      'FILE mode — app MongoDB use nahi karega. Teacher save server/data mein, deploy se alag ho sakta hai.';
    payload.ok = true;
    const stats = fileStore.fileStats();
    payload.counts = {
      books: stats.totalBooks,
      students: fileStore.fileListStudents().length,
      teachers: fileStore.fileListTeachers().length,
      activeIssues: stats.activeIssues,
    };
    return res.json(payload);
  }

  if (!mongoConnected) {
    payload.ok = false;
    payload.mongo.error = 'MongoDB not connected';
    return res.status(503).json(payload);
  }

  try {
    payload.counts = {
      books: await Book.countDocuments(),
      students: await Student.countDocuments(),
      teachers: await Teacher.countDocuments(),
      activeIssues: await Issue.countDocuments({ status: 'issued' }),
    };
  } catch (e) {
    payload.ok = false;
    payload.mongo.error = e.message;
    return res.status(503).json(payload);
  }

  if (sheetSync.isSheetsSyncEnabled()) {
    try {
      payload.sync = await sheetSync.getSyncStatus(Book);
    } catch (e) {
      payload.sync = { enabled: true, error: e.message };
    }
  } else {
    payload.sync = {
      enabled: false,
      sheetWriteOk: false,
      hint:
        'GOOGLE_SHEET_ID + service account in server/.env — tabhi Excel↔Mongo sync chalegi.',
    };
  }

  res.json(payload);
});

app.get('/api/sync/status', async (_req, res) => {
  if (USE_FILE_MODE) {
    return res.json({ enabled: false, mode: 'file' });
  }
  try {
    const status = await sheetSync.getSyncStatus(Book);
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sync/reconcile', authTeacher, async (_req, res) => {
  if (USE_FILE_MODE) {
    return res.status(400).json({ error: 'Sync requires MongoDB mode' });
  }
  if (!sheetSync.isSheetsSyncEnabled()) {
    return res.status(400).json({ error: 'Google Sheets not configured in .env' });
  }
  try {
    const result = await sheetSync.reconcile(Book, getActiveIssueCount);
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Reconcile failed' });
  }
});

app.post('/api/sync-catalog', authTeacher, async (_req, res) => {
  try {
    if (USE_FILE_MODE) {
      return res.json({
        ok: true,
        message: 'FILE mode: Excel se list har request par ../src/data/catalog.json se aati hai. Pehle npm run import-books chalayein.',
      });
    }
    const catalogPath = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
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
  const uri = (process.env.MONGODB_URI || '').trim();
  const explicitFile =
    process.env.USE_FILE_STORE === 'true' || process.env.USE_FILE_STORE === '1';

  if (explicitFile) {
    USE_FILE_MODE = true;
    FILE_MODE_REASON = 'USE_FILE_STORE=1 in server/.env';
    await fileStore.initFileStaff(process.env);
    console.warn('⚠ USE_FILE_STORE=1 — FILE mode (MongoDB disabled)');
    console.log('FILE mode: Excel → ../src/data/catalog.json | issues → server/data/issues.json');
  } else if (!uri) {
    USE_FILE_MODE = true;
    FILE_MODE_REASON = 'MONGODB_URI missing — copy server/.env.example → server/.env';
    await fileStore.initFileStaff(process.env);
    console.warn(
      '⚠ MONGODB_URI khali — FILE mode. App sirf offline catalog dikhayegi.',
    );
    console.warn('   Fix: server/.env mein Render wala MONGODB_URI paste karein → npm run server');
    console.log('FILE mode: Excel → ../src/data/catalog.json | issues → server/data/issues.json');
  } else {
    try {
      await connectMongo(uri);
      USE_FILE_MODE = false;
      FILE_MODE_REASON = '';
      console.log('MongoDB connected');
      await seedDean();
      await seedTeacher();
      await migrateStudentUserIds();
      await seedFromCatalog();
      if (sheetSync.isSheetsSyncEnabled()) {
        try {
          await sheetSync.bootstrapSyncHashes(Book);
          const writeCheck = await sheetSync.verifySheetWriteAccess();
          if (!writeCheck.ok) {
            console.warn(
              '⚠ Sheet WRITE blocked — app→Excel sync nahi chalega jab tak sheet share na ho:',
              process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
              '(Editor)',
              writeCheck.error,
            );
          }
          const result = await withMongoRetry(
            () => sheetSync.reconcile(Book, getActiveIssueCount),
            { uri, retries: 2 },
          );
          console.log(
            `Initial sync: ${result.direction} | sheet=${result.sheetCount} mongo=${result.mongoCount} inSync=${result.inSync}`,
          );
          sheetSync.startSheetSyncLoop(
            Book,
            getActiveIssueCount,
            Number(process.env.SHEET_SYNC_INTERVAL_MS || 30000),
          );
        } catch (e) {
          console.warn('Google Sheets initial sync:', e.message);
        }
      }
    } catch (e) {
      console.error('MongoDB connection failed — server start nahi hoga (FILE fallback band):');
      console.error('  ', e.message);
      console.error('  server/.env → MONGODB_URI = Render deploy wala same URI');
      console.error('  Atlas Network Access → 0.0.0.0/0 ya apna IP allow karein');
      process.exit(1);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API http://localhost:${PORT} | mode=${USE_FILE_MODE ? 'FILE' : 'MongoDB'}`);
    if (!USE_FILE_MODE) {
      console.log('Health: GET /api/health → mode=mongodb, counts.books, sync status');
    }
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
