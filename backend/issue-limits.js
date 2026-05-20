/** Max active (not returned) books per student at one time */
export const MAX_STUDENT_ACTIVE_ISSUES = 5;

export const ISSUE_LIMIT_MSG = {
  maxBooks: (n = MAX_STUDENT_ACTIVE_ISSUES) =>
    `Student ke paas pehle se ${n} books issued hain. Pehle kuch books return karwayein.`,
  duplicateBook:
    'Ye book is student ke paas pehle se issued hai. Ek hi book dobara issue nahi ho sakti.',
};

export function issueLimitError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

/** @param {Array<{ studentId: string, catalogId: string, status: string }>} issues */
export function assertStudentCanIssueInFile(issues, studentId, catalogId) {
  const sid = String(studentId).toUpperCase().trim();
  const cid = String(catalogId);
  const active = issues.filter((i) => i.studentId === sid && i.status === 'issued');
  if (active.length >= MAX_STUDENT_ACTIVE_ISSUES) {
    throw issueLimitError(ISSUE_LIMIT_MSG.maxBooks());
  }
  if (active.some((i) => String(i.catalogId) === cid)) {
    throw issueLimitError(ISSUE_LIMIT_MSG.duplicateBook);
  }
}

export async function assertStudentCanIssueInMongo(Issue, Book, studentId, catalogId) {
  const sid = String(studentId).toUpperCase().trim();
  const book = await Book.findOne({ catalogId: String(catalogId) });
  if (!book) {
    throw issueLimitError('Book not found');
  }
  const activeCount = await Issue.countDocuments({ studentId: sid, status: 'issued' });
  if (activeCount >= MAX_STUDENT_ACTIVE_ISSUES) {
    throw issueLimitError(ISSUE_LIMIT_MSG.maxBooks());
  }
  const duplicate = await Issue.findOne({
    studentId: sid,
    book: book._id,
    status: 'issued',
  });
  if (duplicate) {
    throw issueLimitError(ISSUE_LIMIT_MSG.duplicateBook);
  }
  return book;
}

export function httpStatusFromIssueError(err) {
  return err?.statusCode === 400 ? 400 : 500;
}
