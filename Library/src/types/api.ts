export type BookStatus = 'available' | 'issued_out';

export type ApiBook = {
  id: string;
  /** Mongo id; "local" = sirf Excel / catalog se */
  mongoId?: string;
  serialNo: number;
  rackNo: string;
  title: string;
  authors: string;
  publisher: string;
  department: string;
  subject: string;
  copies: number;
  issuedCount: number;
  availableCount: number;
  status: BookStatus;
};

export type ApiIssue = {
  id: string;
  studentId: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  issuedAt: string;
  status?: 'issued' | 'returned';
  returnedAt?: string | null;
  book?: {
    id: string;
    title: string;
    rackNo: string;
    department: string;
  } | null;
};

export type TeacherSession = {
  teacherId: string;
  name: string;
};

export type StudentSession = {
  /** Student ID No (roll / enrollment) — unique */
  studentId: string;
  /** Student User ID for login — unique, stored in MongoDB as studentUserId */
  userId: string;
  studentUserId?: string;
  name: string;
  mobile: string;
  course: string;
  year: string;
  department: string;
};

export type AuthRole = 'teacher' | 'student';

export type ApiStudent = StudentSession & {
  createdAt?: string;
};
