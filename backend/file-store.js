/**
 * MongoDB ke bina: Excel catalog.json + JSON issues + bcrypt teacher login
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { assertStudentCanIssueInFile } from './issue-limits.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, 'data', 'catalog.json');
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

const TEACHERS_PATH = path.join(DATA_DIR, 'teachers.json');
const DEANS_PATH = path.join(DATA_DIR, 'deans.json');

function readTeachers() {
  ensureDataDir();
  if (!fs.existsSync(TEACHERS_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(TEACHERS_PATH, 'utf8'));
}

function writeTeachers(teachers) {
  ensureDataDir();
  fs.writeFileSync(TEACHERS_PATH, JSON.stringify(teachers, null, 2));
}

function readDeans() {
  ensureDataDir();
  if (!fs.existsSync(DEANS_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(DEANS_PATH, 'utf8'));
}

function writeDeans(deans) {
  ensureDataDir();
  fs.writeFileSync(DEANS_PATH, JSON.stringify(deans, null, 2));
}

export function teacherPublicRow(t) {
  return {
    teacherId: t.teacherId,
    name: t.name,
    mobile: t.mobile || '',
    department: t.department || '',
    inCharge: t.inCharge || '',
    createdAt: t.createdAt,
  };
}

export async function initFileStaff(env) {
  let teachers = readTeachers();
  if (teachers.length === 0) {
    const password = env.DEFAULT_TEACHER_PASSWORD || 'teacher123';
    const hash = await bcrypt.hash(password, 10);
    const teacherId = (env.DEFAULT_TEACHER_ID || 'T001').toUpperCase();
    teachers = [
      {
        teacherId,
        passwordHash: hash,
        name: env.DEFAULT_TEACHER_NAME || 'Library Teacher',
        mobile: '',
        department: '',
        inCharge: '',
        createdAt: new Date().toISOString(),
      },
    ];
    writeTeachers(teachers);
    console.log(`File mode teacher: ${teacherId} / ${password}`);
  }

  let deans = readDeans();
  if (deans.length === 0) {
    const password = env.DEFAULT_DEAN_PASSWORD || 'dean123';
    const hash = await bcrypt.hash(password, 10);
    const deanId = (env.DEFAULT_DEAN_ID || 'DEAN01').toUpperCase();
    deans = [
      {
        deanId,
        passwordHash: hash,
        name: env.DEFAULT_DEAN_NAME || 'Dean Sir',
        createdAt: new Date().toISOString(),
      },
    ];
    writeDeans(deans);
    console.log(`File mode dean: ${deanId} / ${password}`);
  }
}

/** @deprecated use initFileStaff */
export async function initFileTeacher(env) {
  return initFileStaff(env);
}

export async function verifyFileTeacher(teacherId, password) {
  const id = String(teacherId).toUpperCase().trim();
  const t = readTeachers().find((row) => row.teacherId === id);
  if (!t) return null;
  const ok = await bcrypt.compare(password, t.passwordHash);
  if (!ok) return null;
  return teacherPublicRow(t);
}

export async function verifyFileDean(deanId, password) {
  const id = String(deanId).toUpperCase().trim();
  const d = readDeans().find((row) => row.deanId === id);
  if (!d) return null;
  const ok = await bcrypt.compare(password, d.passwordHash);
  if (!ok) return null;
  return { deanId: d.deanId, name: d.name };
}

export function fileListTeachers() {
  return readTeachers().map(teacherPublicRow);
}

export async function fileCreateTeacher({
  teacherId,
  password,
  name,
  mobile,
  department,
  inCharge,
}) {
  const teachers = readTeachers();
  const id = String(teacherId).toUpperCase().trim();
  if (teachers.some((t) => t.teacherId === id)) {
    throw new Error('Teacher ID already exists');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const row = {
    teacherId: id,
    passwordHash,
    name: String(name).trim(),
    mobile: String(mobile || '').trim(),
    department: String(department || '').trim(),
    inCharge: String(inCharge || '').trim(),
    createdAt: new Date().toISOString(),
  };
  teachers.push(row);
  writeTeachers(teachers);
  return teacherPublicRow(row);
}

export async function fileUpdateTeacher(teacherId, updates) {
  const teachers = readTeachers();
  const id = String(teacherId).toUpperCase().trim();
  const idx = teachers.findIndex((t) => t.teacherId === id);
  if (idx < 0) throw new Error('Teacher not found');
  const row = teachers[idx];
  if (updates.name !== undefined) row.name = String(updates.name).trim();
  if (updates.mobile !== undefined) row.mobile = String(updates.mobile).trim();
  if (updates.department !== undefined) row.department = String(updates.department).trim();
  if (updates.inCharge !== undefined) row.inCharge = String(updates.inCharge).trim();
  if (updates.password) {
    row.passwordHash = await bcrypt.hash(updates.password, 10);
  }
  teachers[idx] = row;
  writeTeachers(teachers);
  return teacherPublicRow(row);
}

export function fileDeleteTeacher(teacherId) {
  const id = String(teacherId).toUpperCase().trim();
  const teachers = readTeachers().filter((t) => t.teacherId !== id);
  if (teachers.length === readTeachers().length) {
    throw new Error('Teacher not found');
  }
  writeTeachers(teachers);
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
  assertStudentCanIssueInFile(issues, sid, bookId);

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

function applyFileBookFields(book, fields) {
  if (fields.title?.trim()) book.title = fields.title.trim();
  if (fields.authors !== undefined) book.authors = String(fields.authors).trim();
  if (fields.publisher !== undefined) book.publisher = String(fields.publisher).trim();
  if (fields.department !== undefined) {
    book.department = String(fields.department).trim() || 'MISC';
  }
  if (fields.subject !== undefined) {
    book.subject = String(fields.subject).trim() || 'MISC';
  }
  if (fields.rackNo !== undefined) book.rackNo = String(fields.rackNo);
  if (fields.copies !== undefined) book.copies = Math.max(1, Number(fields.copies) || 1);
  if (fields.serialNo !== undefined && Number(fields.serialNo) > 0) {
    book.serialNo = Number(fields.serialNo);
  }
}

export function fileUpdateBook(catalogId, fields) {
  ensureDataDir();
  const key = String(catalogId);
  const custom = JSON.parse(fs.readFileSync(CUSTOM_BOOKS_PATH, 'utf8'));
  const customIdx = custom.findIndex((b) => String(b.id) === key);
  if (customIdx !== -1) {
    const book = custom[customIdx];
    applyFileBookFields(book, fields);
    custom[customIdx] = book;
    fs.writeFileSync(CUSTOM_BOOKS_PATH, JSON.stringify(custom, null, 2));
    return enrichFileBook(book, readIssues());
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const books = catalog.books || [];
  const catIdx = books.findIndex((b) => String(b.id) === key);
  if (catIdx === -1) {
    throw new Error('Book not found');
  }
  const book = books[catIdx];
  applyFileBookFields(book, fields);
  books[catIdx] = book;
  catalog.books = books;
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
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
