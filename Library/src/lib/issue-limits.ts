import type { ApiIssue } from '@/types/api';

/** Max active (not returned) books per student — must match server */
export const MAX_STUDENT_ACTIVE_ISSUES = 5;

export function normalizeStudentId(studentId: string): string {
  return studentId.trim().toUpperCase();
}

export function isActiveIssue(issue: ApiIssue): boolean {
  return issue.status === 'issued' || !issue.returnedAt;
}

export function getStudentActiveIssues(issues: ApiIssue[], studentId: string): ApiIssue[] {
  const sid = normalizeStudentId(studentId);
  return issues.filter((i) => isActiveIssue(i) && normalizeStudentId(i.studentId) === sid);
}

/** Returns user-facing error message, or null if issue is allowed */
export function validateStudentCanIssue(
  allActiveIssues: ApiIssue[],
  studentId: string,
  bookCatalogId: string,
): string | null {
  const active = getStudentActiveIssues(allActiveIssues, studentId);
  if (active.length >= MAX_STUDENT_ACTIVE_ISSUES) {
    return `This student already has ${MAX_STUDENT_ACTIVE_ISSUES} books issued. Return some books before issuing more.`;
  }
  const cid = String(bookCatalogId).trim();
  const hasBook = active.some((i) => String(i.book?.id ?? '').trim() === cid);
  if (hasBook) {
    return 'This book is already issued to this student. The same book cannot be issued twice.';
  }
  return null;
}

/** Book detail page: activeIssues are only for this catalog book */
export function studentAlreadyHasBookOnPage(
  bookActiveIssues: ApiIssue[],
  studentId: string,
): boolean {
  const sid = normalizeStudentId(studentId);
  return bookActiveIssues.some(
    (i) => isActiveIssue(i) && normalizeStudentId(i.studentId) === sid,
  );
}
