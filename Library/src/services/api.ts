import { API_URL } from '@/config/api';
import type { ApiBook, ApiIssue, TeacherSession } from '@/types/api';

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

  getBooks: () => request<{ books: ApiBook[]; total: number }>('/api/books'),

  getBook: (id: string) =>
    request<{ book: ApiBook; activeIssues: ApiIssue[] }>(`/api/books/${id}`),

  getStats: () =>
    request<{
      totalBooks: number;
      totalCopies: number;
      availableCopies: number;
      activeIssues: number;
    }>('/api/stats'),

  getActiveIssues: (token: string) =>
    request<{ issues: ApiIssue[] }>('/api/issues/active', { token }),

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
    request(`/api/books/${catalogId}`, { method: 'DELETE', token }),
};
