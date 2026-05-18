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
