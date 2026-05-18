/**
 * MongoDB ke bina: Excel catalog.json + JSON issues + bcrypt teacher login
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
const DATA_DIR = path.join(__dirname, 'data');
const ISSUES_PATH = path.join(DATA_DIR, 'issues.json');
const CUSTOM_BOOKS_PATH = path.join(DATA_DIR, 'custom-books.json');
const STUDENTS_PATH = path.join(DATA_DIR, 'students.json');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ISSUES_PATH)) {
    fs.writeFileSync(ISSUES_PATH, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(CUSTOM_BOOKS_PATH)) {
    fs.writeFileSync(CUSTOM_BOOKS_PATH, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(STUDENTS_PATH)) {
    fs.writeFileSync(STUDENTS_PATH, JSON.stringify([], null, 2));
  }
}

function readStudents() {
  ensureDataDir();
  return JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
}

function writeStudents(students) {
  ensureDataDir();
  fs.writeFileSync(STUDENTS_PATH, JSON.stringify(students, null, 2));
}

function studentPublicRow(s) {
  const loginId = s.studentUserId || s.userId || '';
  return {
    studentId: s.studentId,
    userId: loginId,
    studentUserId: loginId,
    name: s.name,
    mobile: s.mobile,
    course: s.course,
    year: s.year,
    department: s.department,
    createdAt: s.createdAt,
  };
}

export function fileListStudents(search = '') {
  const q = String(search).trim().toUpperCase();
  let list = readStudents();
  if (q) {
    list = list.filter((s) => {
      const loginId = (s.studentUserId || s.userId || '').toUpperCase();
      return (
        s.studentId.toUpperCase().includes(q) ||
        loginId.includes(q) ||
        s.name.toUpperCase().includes(q) ||
        s.mobile.includes(q) ||
        s.course.toUpperCase().includes(q) ||
        s.department.toUpperCase().includes(q)
      );
    });
  }
  return list.map(studentPublicRow);
}

export function fileFindStudent(studentId) {
  return readStudents().find((s) => s.studentId === String(studentId).toUpperCase().trim()) || null;
}

export function fileFindStudentByLogin(loginId) {
  const id = String(loginId).toUpperCase().trim();
  return (
    readStudents().find((s) => (s.studentUserId || s.userId || '') === id) || null
  );
}

export function fileFindStudentByKey(key) {
  const id = String(key).toUpperCase().trim();
  return (
    readStudents().find(
      (s) =>
        (s.studentUserId || s.userId || '') === id || s.studentId === id,
    ) || null
  );
}

export async function fileCreateStudent({
  studentId,
  studentUserId,
  userId,
  password,
  name,
  mobile,
  course,
  year,
  department,
}) {
  const students = readStudents();
  const idNo = String(studentId).toUpperCase().trim();
  const loginId = String(studentUserId || userId).toUpperCase().trim();
  const mobileNorm = String(mobile).trim();
  if (students.some((s) => s.studentId === idNo)) {
    throw new Error('Student ID No already exists');
  }
  if (students.some((s) => (s.studentUserId || s.userId) === loginId)) {
    throw new Error('Student User ID already exists');
  }
  if (students.some((s) => s.mobile === mobileNorm)) {
    throw new Error('Mobile number already registered');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const row = {
    studentId: idNo,
    studentUserId: loginId,
    passwordHash,
    name,
    mobile: mobileNorm,
    course,
    year,
    department,
    createdAt: new Date().toISOString(),
  };
  students.push(row);
  writeStudents(students);
  return studentPublicRow(row);
}

export async function fileUpdateStudent(idNo, fields) {
  const students = readStudents();
  const id = String(idNo).toUpperCase().trim();
  const idx = students.findIndex((s) => s.studentId === id);
  if (idx === -1) {
    throw new Error('Student not found');
  }
  const row = students[idx];
  const loginInput = fields.studentUserId || fields.userId;
  if (loginInput?.trim()) {
    const loginId = String(loginInput).toUpperCase().trim();
    if (students.some((s, i) => i !== idx && (s.studentUserId || s.userId) === loginId)) {
      throw new Error('Student User ID already in use');
    }
    row.studentUserId = loginId;
  }
  if (fields.mobile?.trim()) {
    const mobileNorm = fields.mobile.trim();
    if (students.some((s, i) => i !== idx && s.mobile === mobileNorm)) {
      throw new Error('Mobile number already in use');
    }
    row.mobile = mobileNorm;
  }
  if (fields.name?.trim()) row.name = fields.name.trim();
  if (fields.mobile?.trim()) row.mobile = fields.mobile.trim();
  if (fields.course?.trim()) row.course = fields.course.trim();
  if (fields.year?.trim()) row.year = fields.year.trim();
  if (fields.department?.trim()) row.department = fields.department.trim();
  if (fields.password) {
    row.passwordHash = await bcrypt.hash(fields.password, 10);
  }
  students[idx] = row;
  writeStudents(students);
  return studentPublicRow(row);
}

export function fileDeleteStudent(idNo) {
  const students = readStudents();
  const id = String(idNo).toUpperCase().trim();
  const issues = readIssues();
  const active = issues.filter((i) => i.studentId === id && i.status === 'issued');
  if (active.length > 0) {
    throw new Error('Cannot delete: student has books issued. Return all books first.');
  }
  const next = students.filter((s) => s.studentId !== id);
  if (next.length === students.length) {
    throw new Error('Student not found');
  }
  writeStudents(next);
}

export async function verifyFileStudent(loginId, password) {
  const s = fileFindStudentByLogin(loginId);
  if (!s) {
    return null;
  }
  const ok = await bcrypt.compare(password, s.passwordHash);
  if (!ok) {
    return null;
  }
  return studentPublicRow(s);
}

export function fileGetStudentIssues(studentId) {
  const issues = readIssues();
  const books = readAllBooksRaw();
  const byId = new Map(books.map((b) => [String(b.id), b]));
  const sid = String(studentId).toUpperCase().trim();
  return issues
    .filter((i) => i.studentId === sid && i.status === 'issued')
    .map((i) => {
      const b = byId.get(i.catalogId);
      return {
        id: i.id,
        studentId: i.studentId,
        studentName: i.studentName,
        issuedAt: i.issuedAt,
        book: b
          ? {
              id: String(b.id),
              title: b.title,
              rackNo: b.rackNo,
              department: b.department,
            }
          : null,
      };
    });
}

export function readAllBooksRaw() {
  ensureDataDir();
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const fromExcel = catalog.books || [];
  const custom = JSON.parse(fs.readFileSync(CUSTOM_BOOKS_PATH, 'utf8'));
  return [...fromExcel, ...custom];
}

export function readIssues() {
  ensureDataDir();
  return JSON.parse(fs.readFileSync(ISSUES_PATH, 'utf8'));
}

export function writeIssues(issues) {
  ensureDataDir();
  fs.writeFileSync(ISSUES_PATH, JSON.stringify(issues, null, 2));
}

let teacherPasswordHash = null;

export async function initFileTeacher(env) {
  const password = env.DEFAULT_TEACHER_PASSWORD || 'teacher123';
  teacherPasswordHash = await bcrypt.hash(password, 10);
  console.log(`File mode teacher: ${(env.DEFAULT_TEACHER_ID || 'T001').toUpperCase()} / ${password}`);
}

export async function verifyFileTeacher(teacherId, password, env) {
  const id = (env.DEFAULT_TEACHER_ID || 'T001').toUpperCase();
  if (String(teacherId).toUpperCase() !== id) {
    return null;
  }
  const ok = await bcrypt.compare(password, teacherPasswordHash);
  if (!ok) {
    return null;
  }
  return {
    teacherId: id,
    name: env.DEFAULT_TEACHER_NAME || 'Library Teacher',
  };
}

function issuedCountForCatalogId(catalogId, issues) {
  return issues.filter((i) => i.catalogId === String(catalogId) && i.status === 'issued').length;
}

export function enrichFileBook(b, issues) {
  const issued = issuedCountForCatalogId(b.id, issues);
  const copies = Number(b.copies) || 1;
  const available = Math.max(0, copies - issued);
  return {
    id: String(b.id),
    mongoId: 'file',
    serialNo: b.serialNo,
    rackNo: String(b.rackNo ?? ''),
    title: b.title,
    authors: b.authors || '',
    publisher: b.publisher || '',
    department: b.department || '',
    subject: b.subject || '',
    copies,
    issuedCount: issued,
    availableCount: available,
    status: available > 0 ? 'available' : 'issued_out',
  };
}

export function fileGetBooks() {
  const issues = readIssues();
  const books = readAllBooksRaw();
  return books.sort((a, b) => (a.serialNo || 0) - (b.serialNo || 0)).map((b) => enrichFileBook(b, issues));
}

export function fileGetBook(catalogId) {
  const issues = readIssues();
  const books = readAllBooksRaw();
  const b = books.find((x) => String(x.id) === String(catalogId));
  if (!b) {
    return null;
  }
  const activeIssues = issues
    .filter((i) => i.catalogId === String(catalogId) && i.status === 'issued')
    .map((i) => ({
      id: i.id,
      studentId: i.studentId,
      studentName: i.studentName || '',
      issuedAt: i.issuedAt,
      teacherId: i.teacherId,
    }));
  return { book: enrichFileBook(b, issues), activeIssues };
}

export function fileGetActiveIssues() {
  const issues = readIssues();
  const books = readAllBooksRaw();
  const byId = new Map(books.map((b) => [String(b.id), b]));
  return issues
    .filter((i) => i.status === 'issued')
    .map((i) => {
      const b = byId.get(i.catalogId);
      return {
        id: i.id,
        studentId: i.studentId,
        studentName: i.studentName,
        teacherId: i.teacherId,
        teacherName: i.teacherName,
        issuedAt: i.issuedAt,
        book: b
          ? {
              id: String(b.id),
              title: b.title,
              rackNo: b.rackNo,
              department: b.department,
            }
          : null,
      };
    });
}

export function fileGetIssueHistory(limit = 300) {
  const issues = readIssues();
  const books = readAllBooksRaw();
  const byId = new Map(books.map((b) => [String(b.id), b]));
  return issues
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    .slice(0, limit)
    .map((i) => {
      const b = byId.get(i.catalogId);
      return {
        id: i.id,
        studentId: i.studentId,
        studentName: i.studentName || '',
        teacherId: i.teacherId,
        teacherName: i.teacherName || '',
        status: i.status,
        issuedAt: i.issuedAt,
        returnedAt: i.returnedAt || null,
        book: b
          ? {
              id: String(b.id),
              title: b.title,
              rackNo: b.rackNo,
              department: b.department,
            }
          : null,
      };
    });
}

export function filePostIssue({ bookId, studentId, studentName, teacherId, teacherName }) {
  const sid = String(studentId).toUpperCase().trim();
  const st = fileFindStudent(sid);
  if (!st) {
    throw new Error(
      'Student not registered. Pehle teacher panel se student register karein (ID No se).',
    );
  }
  const issues = readIssues();
  const books = readAllBooksRaw();
  const b = books.find((x) => String(x.id) === String(bookId));
  if (!b) {
    throw new Error('Book not found');
  }
  const issued = issuedCountForCatalogId(bookId, issues);
  const copies = Number(b.copies) || 1;
  if (issued >= copies) {
    throw new Error('No copies available in library');
  }
  const id = `iss_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  issues.push({
    id,
    catalogId: String(bookId),
    studentId: sid,
    studentName: (studentName || st.name || '').trim(),
    teacherId,
    teacherName,
    issuedAt: new Date().toISOString(),
    status: 'issued',
  });
  writeIssues(issues);
  const last = issues[issues.length - 1];
  return { id: last.id, issuedAt: last.issuedAt, book: enrichFileBook(b, issues) };
}

export function fileReturnIssue(issueId) {
  const issues = readIssues();
  const issue = issues.find((i) => i.id === issueId && i.status === 'issued');
  if (!issue) {
    throw new Error('Active issue not found');
  }
  issue.status = 'returned';
  issue.returnedAt = new Date().toISOString();
  writeIssues(issues);
  const books = readAllBooksRaw();
  const b = books.find((x) => String(x.id) === issue.catalogId);
  return { book: b ? enrichFileBook(b, issues) : null };
}

export function fileStats() {
  const books = readAllBooksRaw();
  const issues = readIssues();
  let totalCopies = 0;
  let availableCopies = 0;
  for (const b of books) {
    const c = Number(b.copies) || 1;
    totalCopies += c;
    const issued = issuedCountForCatalogId(b.id, issues);
    availableCopies += Math.max(0, c - issued);
  }
  const activeIssues = issues.filter((i) => i.status === 'issued').length;
  return { totalBooks: books.length, totalCopies, availableCopies, activeIssues };
}

export function fileAddBook(body) {
  ensureDataDir();
  const custom = JSON.parse(fs.readFileSync(CUSTOM_BOOKS_PATH, 'utf8'));
  const maxSerial = Math.max(0, ...readAllBooksRaw().map((bk) => Number(bk.serialNo) || 0));
  const id = String(Date.now());
  const book = {
    id,
    serialNo: body.serialNo || maxSerial + 1,
    title: body.title.trim(),
    authors: body.authors?.trim() || '',
    publisher: body.publisher?.trim() || '',
    department: body.department?.trim() || 'MISC',
    subject: body.subject?.trim() || 'MISC',
    rackNo: String(body.rackNo ?? ''),
    copies: Math.max(1, Number(body.copies) || 1),
  };
  custom.push(book);
  fs.writeFileSync(CUSTOM_BOOKS_PATH, JSON.stringify(custom, null, 2));
  return enrichFileBook(book, readIssues());
}

export function fileDeleteBook(catalogId) {
  ensureDataDir();
  const custom = JSON.parse(fs.readFileSync(CUSTOM_BOOKS_PATH, 'utf8'));
  const idx = custom.findIndex((b) => String(b.id) === String(catalogId));
  if (idx === -1) {
    throw new Error('Only teacher-added books can be deleted (Excel books: npm run import-books + sync)');
  }
  const issues = readIssues();
  const issued = issuedCountForCatalogId(catalogId, issues);
  if (issued > 0) {
    throw new Error('Return all copies first');
  }
  custom.splice(idx, 1);
  fs.writeFileSync(CUSTOM_BOOKS_PATH, JSON.stringify(custom, null, 2));
}
