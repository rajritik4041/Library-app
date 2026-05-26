export type FieldKind =
  | 'username'
  | 'password'
  | 'passwordOptional'
  | 'name'
  | 'mobile'
  | 'mobileOptional'
  | 'studentId'
  | 'teacherId'
  | 'deanId'
  | 'course'
  | 'year'
  | 'department'
  | 'title'
  | 'text';

export type FieldValidation = {
  valid: boolean;
  message: string;
};

type ValidateOptions = {
  required?: boolean;
};

function fail(message: string): FieldValidation {
  return { valid: false, message };
}

function ok(message: string): FieldValidation {
  return { valid: true, message };
}

function empty(kind: FieldKind, required?: boolean): FieldValidation | null {
  if (required) {
    const labels: Partial<Record<FieldKind, string>> = {
      username: 'User ID',
      password: 'Password',
      name: 'Name',
      mobile: 'Mobile number',
      studentId: 'Student ID',
      teacherId: 'Professor ID',
      deanId: 'Dean ID',
      course: 'Course',
      year: 'Grade / year',
      department: 'Department',
      title: 'Title',
      text: 'This field',
    };
    const label = labels[kind] ?? 'This field';
    return fail(`${label} is required`);
  }
  return null;
}

const USERNAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const ID_RE = /^[A-Za-z0-9_-]{2,24}$/;
const NAME_RE = /^[\p{L}\s.'-]{2,60}$/u;
const MOBILE_RE = /^[6-9]\d{9}$/;
const PASSWORD_RE = /^.{6,64}$/;

export function validateField(
  kind: FieldKind,
  raw: string,
  options: ValidateOptions = {},
): FieldValidation {
  const value = raw.trim();
  const required =
    options.required ?? (!kind.endsWith('Optional') && kind !== 'passwordOptional');

  if (!value) {
    if (kind === 'passwordOptional' || kind === 'mobileOptional') {
      return { valid: true, message: '' };
    }
    const emptyResult = empty(kind, required);
    if (emptyResult) return emptyResult;
    return { valid: true, message: '' };
  }

  switch (kind) {
    case 'username':
      if (!USERNAME_RE.test(value)) {
        return fail('User ID: 3–20 characters, letters, numbers, _ or - only');
      }
      return ok('User ID looks good');

    case 'password':
      if (value.length < 6) {
        return fail('Password must be at least 6 characters');
      }
      if (value.length > 64) {
        return fail('Password is too long (max 64 characters)');
      }
      if (!PASSWORD_RE.test(value)) {
        return fail('Use a password between 6 and 64 characters');
      }
      return ok('Password length is OK');

    case 'passwordOptional':
      if (value.length < 6) {
        return fail('New password must be at least 6 characters');
      }
      if (value.length > 64) {
        return fail('Password is too long (max 64 characters)');
      }
      return ok('New password looks good');

    case 'name':
      if (!NAME_RE.test(value)) {
        return fail('Name: 2–60 letters (spaces, . \' - allowed)');
      }
      return ok('Name looks good');

    case 'mobile':
      if (!MOBILE_RE.test(value.replace(/\s/g, ''))) {
        return fail('Enter a valid 10-digit Indian mobile (starts with 6–9)');
      }
      return ok('Mobile number is valid');

    case 'mobileOptional':
      if (!MOBILE_RE.test(value.replace(/\s/g, ''))) {
        return fail('Enter a valid 10-digit mobile or leave empty');
      }
      return ok('Mobile number is valid');

    case 'studentId':
      if (!ID_RE.test(value)) {
        return fail('Student ID: 2–24 characters, letters, numbers, _ or -');
      }
      return ok('Student ID looks good');

    case 'teacherId':
      if (!ID_RE.test(value)) {
        return fail('Professor ID: 2–24 characters, letters, numbers, _ or -');
      }
      return ok('Professor ID looks good');

    case 'deanId':
      if (!ID_RE.test(value)) {
        return fail('Dean ID: 2–24 characters, letters, numbers, _ or -');
      }
      return ok('Dean ID looks good');

    case 'course':
      if (value.length < 2 || value.length > 40) {
        return fail('Course: 2–40 characters');
      }
      return ok('Course looks good');

    case 'year':
      if (value.length < 1 || value.length > 12) {
        return fail('Grade/year: 1–12 characters (e.g. 1, 2, 3)');
      }
      return ok('Grade / year looks good');

    case 'department':
      if (value.length < 2 || value.length > 30) {
        return fail('Department: 2–30 characters');
      }
      return ok('Department looks good');

    case 'title':
      if (value.length < 2 || value.length > 120) {
        return fail('Title: 2–120 characters');
      }
      return ok('Title looks good');

    case 'text':
    default:
      if (value.length > 200) {
        return fail('Maximum 200 characters');
      }
      return ok('Looks good');
  }
}
