import { resolveIssueBookRack } from '@/lib/book-catalog-fields';
import type { ApiIssue } from '@/types/api';

/** Build searchable text for an issue row (student ID, book title, rack, etc.) */
export function issueSearchText(issue: ApiIssue): string {
  return [
    issue.id,
    issue.studentId,
    issue.studentName,
    issue.teacherId,
    issue.teacherName,
    issue.book?.id,
    issue.book?.title,
    issue.book?.department,
    resolveIssueBookRack(issue.book),
    issue.status,
  ]
    .filter((v) => v != null && String(v).trim() !== '')
    .join(' ')
    .toLowerCase();
}

/** Filter issues by query — all words must match somewhere in the row */
export function filterIssuesByQuery(issues: ApiIssue[], query: string): ApiIssue[] {
  const q = query.trim().toLowerCase();
  if (!q) return issues;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return issues;
  return issues.filter((issue) => {
    const haystack = issueSearchText(issue);
    return tokens.every((t) => haystack.includes(t));
  });
}
