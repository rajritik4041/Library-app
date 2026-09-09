import { API_URL } from '@/config/api';
import type {
  ApiBook,
  ApiIssue,
  ApiStudent,
  DeanSession,
  StudentSession,
  TeacherSession,
} from '@/types/api';

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error('Network error — is the API server running? (npm run server)');
  }
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    if (/Cannot PUT \/api\/books/i.test(text)) {
      throw new Error(
        'Book edit is not enabled on this server — deploy the latest backend (Render redeploy).',
      );
    }
    if (/Cannot POST \/api\/books.*\/delete/i.test(text)) {
      throw new Error(
        'Book delete is not enabled on this server — deploy the latest backend (Render redeploy), then rebuild the desktop app.',
      );
    }
  }
  if (!response.ok) {
    throw new Error(
      (typeof data.error === 'string' && data.error) || `Request failed (${response.status})`,
    );
  }
  return data as T;
}

export const api = {
  health: () =>
    request<{
      ok: boolean;
      mode?: 'mongodb' | 'file';
      storage?: string;
      hint?: string;
      warning?: string;
      mongo?: {
        configured?: boolean;
        connected?: boolean;
        readyState?: number;
        error?: string;
      };
      counts?: {
        books: number;
        students: number;
        teachers: number;
        activeIssues: number;
      };
      sync?: {
        sheetCount: number;
        mongoCount: number;
        inSync: boolean;
        sheetWriteOk?: boolean;
        sheetWriteError?: string;
        enabled?: boolean;
        hint?: string;
        error?: string;
      };
    }>('/api/health'),

  loginTeacher: (teacherId: string, password: string) =>
    request<{ token: string; teacher: TeacherSession }>('/api/auth/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ teacherId, password }),
    }),

  loginDean: (deanId: string, password: string) =>
    request<{ token: string; dean: DeanSession }>('/api/auth/dean/login', {
      method: 'POST',
      body: JSON.stringify({ deanId, password }),
    }),

  getDeanTeachers: (token: string) =>
    request<{ teachers: TeacherSession[] }>('/api/dean/teachers', { token }),

  createDeanTeacher: (
    token: string,
    body: {
      teacherId: string;
      password: string;
      name: string;
      mobile?: string;
      department?: string;
      inCharge?: string;
    },
  ) =>
    request<{ teacher: TeacherSession }>('/api/dean/teachers', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  updateDeanTeacher: (
    token: string,
    teacherId: string,
    body: {
      password?: string;
      name?: string;
      mobile?: string;
      department?: string;
      inCharge?: string;
    },
  ) =>
    request<{ teacher: TeacherSession }>(
      `/api/dean/teachers/${encodeURIComponent(teacherId.trim().toUpperCase())}`,
      { method: 'PUT', token, body: JSON.stringify(body) },
    ),

  deleteDeanTeacher: (token: string, teacherId: string) =>
    request<{ ok: boolean }>(
      `/api/dean/teachers/${encodeURIComponent(teacherId.trim().toUpperCase())}`,
      { method: 'DELETE', token },
    ),

  loginStudent: (userId: string, password: string) =>
    request<{ token: string; student: StudentSession }>('/api/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
    }),

  signupStudent: (body: {
    name: string;
    username: string;
    id: string;
    email: string;
    password: string;
    mobile?: string;
    course?: string;
    branch?: string;
    year?: string;
    department?: string;
    dob?: string;
    gender?: string;
  }) =>
    request<{ success: boolean; message: string; token: string; student: StudentSession }>(
      '/api/auth/student/signup',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    ),

  sendOtp: (email: string) =>
    request<{ success: boolean; message: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ success: boolean; message: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  getStudents: (token: string, search?: string) => {
    const q = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return request<{ students: ApiStudent[] }>(`/api/students${q}`, { token });
  },

  getStudent: (token: string, studentKey: string) =>
    request<{ student: ApiStudent }>(`/api/students/${encodeURIComponent(studentKey)}`, { token }),

  /** Lookup by Student ID No only (enrollment / roll) — safe for IDs with slashes */
  lookupStudentByIdNo: (token: string, studentIdNo: string) =>
    request<{ student: ApiStudent }>(
      `/api/students/lookup?${new URLSearchParams({ key: studentIdNo.trim(), by: 'idNo' })}`,
      { token },
    ),

  createStudent: (
    token: string,
    body: {
      studentId: string;
      userId: string;
      studentUserId?: string;
      password: string;
      name: string;
      mobile: string;
      course: string;
      year: string;
      department: string;
    },
  ) =>
    request<{ student: ApiStudent }>('/api/students', {
      method: 'POST',
      token,
      body: JSON.stringify({
        ...body,
        studentUserId: body.studentUserId || body.userId,
      }),
    }),

  updateStudent: (
    token: string,
    studentKey: string,
    body: {
      userId?: string;
      studentUserId?: string;
      password?: string;
      name?: string;
      mobile?: string;
      course?: string;
      year?: string;
      department?: string;
    },
  ) =>
    request<{ student: ApiStudent }>(`/api/students/${encodeURIComponent(studentKey)}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(body),
    }),

  deleteStudent: (token: string, studentKey: string) => {
    const key = encodeURIComponent(String(studentKey).trim().toUpperCase());
    return request<{ ok: boolean }>(`/api/students/${key}`, {
      method: 'DELETE',
      token,
    });
  },

  updateMyProfile: (
    token: string,
    body: { name?: string; mobile?: string; password?: string },
  ) =>
    request<{ student: StudentSession }>('/api/students/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),

  getMyIssues: (token: string) =>
    request<{ issues: ApiIssue[] }>('/api/issues/mine', { token }),

  getBooks: () => request<{ books: ApiBook[]; total: number }>('/api/books'),

  getBook: (id: string) =>
    request<{ book: ApiBook; activeIssues: ApiIssue[] }>(
      `/api/books/${encodeURIComponent(String(id).trim())}`,
    ),

  getStats: () =>
    request<{
      totalBooks: number;
      totalCopies: number;
      availableCopies: number;
      activeIssues: number;
    }>('/api/stats'),

  getActiveIssues: (token: string) =>
    request<{ issues: ApiIssue[] }>('/api/issues/active', { token }),

  getIssueHistory: (token: string) =>
    request<{ issues: ApiIssue[] }>('/api/issues/history', { token }),

  issueBook: (
    token: string,
    body: { bookId: string; studentId: string; studentName?: string },
  ) =>
    request('/api/issues', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  returnBook: (token: string, issueId: string, password: string) =>
    request(`/api/issues/${issueId}/return`, {
      method: 'POST',
      token,
      body: JSON.stringify({ password }),
    }),

  addBook: (
    token: string,
    body: {
      title: string;
      authors?: string;
      publisher?: string;
      department?: string;
      subject?: string;
      rackNo?: string;
      copies?: number;
    },
  ) =>
    request<{ book: ApiBook; sheetWarning?: string }>('/api/books', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  updateBook: (
    token: string,
    catalogId: string,
    body: {
      title?: string;
      authors?: string;
      publisher?: string;
      department?: string;
      subject?: string;
      rackNo?: string;
      copies?: number;
      serialNo?: number;
    },
  ) =>
    request<{ book: ApiBook; sheetWarning?: string }>(
      `/api/books/${encodeURIComponent(String(catalogId).trim())}`,
      {
        method: 'PUT',
        token,
        body: JSON.stringify(body),
      },
    ),

  /** POST (not DELETE): desktop/Electron fetch often strips DELETE bodies — password never reaches API */
  deleteBook: (token: string, catalogId: string, password: string) =>
    request<{ ok: boolean; sheetWarning?: string }>(
      `/api/books/${encodeURIComponent(String(catalogId).trim())}/delete`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ password }),
      },
    ),
};
