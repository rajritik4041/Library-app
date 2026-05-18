import { API_URL } from '@/config/api';
import type { ApiBook, ApiIssue, ApiStudent, StudentSession, TeacherSession } from '@/types/api';

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
    throw new Error('Network error — kya server chal raha hai? (npm run server)');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),

  loginTeacher: (teacherId: string, password: string) =>
    request<{ token: string; teacher: TeacherSession }>('/api/auth/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ teacherId, password }),
    }),

  loginStudent: (userId: string, password: string) =>
    request<{ token: string; student: StudentSession }>('/api/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
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

  returnBook: (token: string, issueId: string) =>
    request(`/api/issues/${issueId}/return`, { method: 'POST', token }),

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
    request<{ book: ApiBook }>('/api/books', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  deleteBook: (token: string, catalogId: string) =>
    request(`/api/books/${encodeURIComponent(String(catalogId).trim())}`, {
      method: 'DELETE',
      token,
    }),
};
