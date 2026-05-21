import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { TeacherReturnPasswordModal } from '@/components/library/teacher-return-password-modal';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useBooksApi } from '@/context/books-api-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api } from '@/services/api';
import { resolveBookCatalogId } from '@/lib/book-id';
import { MAX_STUDENT_ACTIVE_ISSUES, validateStudentCanIssue } from '@/lib/issue-limits';
import { confirmAsync } from '@/lib/confirm';
import { showAlert } from '@/lib/show-alert';
import type { ApiStudent } from '@/types/api';

export default function TeacherScreen() {
  const { isStaff, token, teacher, logout } = useAuth();
  const { books, refresh } = useBooksApi();
  const router = useRouter();
  const { styles: FormStyles, colors: FormColors } = useFormStyles();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      historyBtn: {
        width: '100%',
        backgroundColor: c.goldMuted,
        padding: Spacing.three,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: c.goldLight,
        alignItems: 'center',
      },
      historyBtnText: {
        color: c.ink,
        fontWeight: '800',
        fontSize: 15,
      },
      searchRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', width: '100%' },
      searchInput: { flex: 1 },
      searchBtn: {
        backgroundColor: c.accent,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: Radius.md,
      },
      studentRow: {
        flexDirection: 'row',
        gap: Spacing.two,
        paddingVertical: Spacing.two,
        borderTopWidth: 1,
        borderTopColor: c.border,
        width: '100%',
      },
      studentInfo: { flex: 1, gap: 2 },
      studentIdText: { fontWeight: '800', color: c.ink, fontSize: 14 },
      studentActions: { gap: Spacing.one, justifyContent: 'center' },
      smallBtn: {
        backgroundColor: c.accent,
        paddingHorizontal: Spacing.two,
        paddingVertical: 8,
        borderRadius: Radius.sm,
        minWidth: 52,
        alignItems: 'center',
      },
      smallBtnDanger: {
        backgroundColor: '#b91c1c',
        paddingHorizontal: Spacing.two,
        paddingVertical: 8,
        borderRadius: Radius.sm,
        minWidth: 52,
        alignItems: 'center',
        zIndex: 2,
        ...Platform.select({ web: { cursor: 'pointer' as const } }),
      },
      smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
      btn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        width: '100%',
      },
      btnDanger: {
        backgroundColor: '#b91c1c',
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        width: '100%',
      },
      btnText: { color: '#fff', fontWeight: '800' },
      logout: { alignItems: 'center', padding: Spacing.three, width: '100%' },
      logoutText: { color: c.inkMuted, fontWeight: '600' },
      syncBanner: {
        backgroundColor: '#fef3c7',
        padding: Spacing.three,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: '#fcd34d',
      },
      syncBannerText: { color: '#92400e', fontSize: 13, fontWeight: '600', lineHeight: 20 },
      issueErrorBanner: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: Radius.md,
        padding: Spacing.three,
        width: '100%',
      },
      issueErrorText: { color: '#b91c1c', fontWeight: '700', fontSize: 14, lineHeight: 20 },
      profileBox: {
        backgroundColor: c.surfaceAlt,
        borderRadius: Radius.md,
        padding: Spacing.three,
        gap: Spacing.one,
        borderWidth: 1,
        borderColor: c.border,
      },
      profileHint: { fontSize: 12, color: c.inkMuted, fontStyle: 'italic' },
    }),
  );

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [publisher, setPublisher] = useState('');
  const [subject, setSubject] = useState('');
  const [rackNo, setRackNo] = useState('');
  const [copies, setCopies] = useState('1');
  const [department, setDepartment] = useState('MISC');

  const [issueBookId, setIssueBookId] = useState('');
  const [issueStudentIdNo, setIssueStudentIdNo] = useState('');
  const [issueStudentName, setIssueStudentName] = useState('');

  const [deleteBookId, setDeleteBookId] = useState('');

  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const loadStudents = useCallback(
    async (search?: string) => {
      if (!token) return;
      setLoadingStudents(true);
      try {
        const data = await api.getStudents(token, search);
        setStudents(data.students);
      } catch (e) {
        showAlert('Error', e instanceof Error ? e.message : 'Failed to load students');
      } finally {
        setLoadingStudents(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (isStaff && token) loadStudents();
  }, [isStaff, token, loadStudents]);

  useEffect(() => {
    if (!isStaff) return;
    void api.health().then((h) => {
      const s = h.sync;
      if (!s) return;
      if (s.sheetWriteOk === false) {
        const email =
          (s as { serviceAccountEmail?: string }).serviceAccountEmail ||
          'sheets@sheet-manage-496912.iam.gserviceaccount.com';
        setSyncBanner(
          `Excel sync BLOCKED: App se add/edit Excel tak nahi jayega. Google Sheet → Share → ${email} ko Editor banaein (Viewer se kaam nahi hota). Excel se MongoDB abhi chal sakta hai.`,
        );
      } else if (!s.inSync) {
        setSyncBanner(
          `Excel/Mongo alag hai (Sheet ${s.sheetCount}, DB ${s.mongoCount}). Auto-sync chal rahi hai…`,
        );
      } else {
        setSyncBanner(null);
      }
    });
  }, [isStaff]);

  const openEdit = (s: ApiStudent) => {
    const key = (s.userId || s.studentUserId || '').trim();
    if (!key) {
      showAlert('Error', 'Student User ID missing — cannot edit');
      return;
    }
    router.push({
      pathname: '/edit-student',
      params: { key },
    });
  };

  const handleDeleteStudent = async (s: ApiStudent) => {
    if (!token) return;
    const key = String(s.userId || s.studentUserId || s.studentId || '')
      .trim()
      .toUpperCase();
    if (!key) {
      showAlert('Error', 'Cannot identify student');
      return;
    }
    const ok = await confirmAsync(
      'Delete student?',
      `Remove ${s.name}?\nID No: ${s.studentId}\nUser ID: ${s.userId || s.studentUserId || '—'}`,
      { confirmLabel: 'Delete', destructive: true },
    );
    if (!ok) return;

    try {
      await api.deleteStudent(token, key);
      await loadStudents(studentSearch.trim() || undefined);
      showAlert('Deleted', `${s.name} removed from library`);
    } catch (e) {
      showAlert('Delete failed', e instanceof Error ? e.message : 'Could not delete student');
    }
  };

  const lookupStudentForIssue = async () => {
    const idNo = issueStudentIdNo.trim();
    if (!idNo || !token) {
      setIssueStudentName('');
      return;
    }
    try {
      const { student } = await api.lookupStudentByIdNo(token, idNo);
      setIssueStudentName(student.name);
      setIssueStudentIdNo(student.studentId);
    } catch {
      setIssueStudentName('');
    }
  };

  if (!isStaff || !token) {
    return (
      <ScrollView contentContainerStyle={FormStyles.pageCentered}>
        <PageHeader title="Teacher Panel" subtitle="Sign in to manage books and students" />
        <Pressable style={styles.btn} onPress={() => router.push('/login-teacher')}>
          <ThemedText style={styles.btnText}>Teacher Login</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const addBook = async () => {
    if (!title.trim()) {
      showAlert('Error', 'Book title is required');
      return;
    }
    if (!authors.trim()) {
      showAlert('Error', 'Author name is required');
      return;
    }
    if (!subject.trim()) {
      showAlert('Error', 'Subject name is required');
      return;
    }
    try {
      const res = await api.addBook(token, {
        title: title.trim(),
        authors: authors.trim(),
        publisher: publisher.trim(),
        subject: subject.trim(),
        rackNo,
        department,
        copies: Number(copies) || 1,
      });
      setTitle('');
      setAuthors('');
      setPublisher('');
      setSubject('');
      await refresh();
      showAlert(
        res.sheetWarning ? 'Added (Excel sync pending)' : 'Success',
        res.sheetWarning
          ? `MongoDB mein save ho gaya.\n\n${res.sheetWarning}`
          : 'Book added — MongoDB & Excel synced',
      );
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  // const issueBook = async () => {
  //   if (!token) return;
  //   const catalogId = resolveBookCatalogId(issueBookId, books);
  //   const idNo = issueStudentIdNo.trim();
  //   if (!catalogId || !idNo) {
  //     showAlert('Error', 'Book Catalog ID (or book #) and Student ID No are required');
  //     return;
  //   }
  //   if (students.length === 0) {
  //     showAlert('Error', 'Pehle kam se kam ek student register karein — bina registration book issue nahi hogi');
  //     return;
  //   }

  //   try {
  //     const { student } = await api.lookupStudentByIdNo(token, idNo);
  //     if (!issueStudentName.trim()) {
  //       setIssueStudentName(student.name);
  //     }
  //     await api.getBook(catalogId);
  //     const { issues: activeIssues } = await api.getActiveIssues(token);
  //     const limitErr = validateStudentCanIssue(activeIssues, student.studentId, catalogId);
  //     if (limitErr) {
  //       showAlert('Issue not allowed', limitErr);
  //       return;
  //     }
  //     await api.issueBook(token, {
  //       bookId: catalogId,
  //       studentId: student.studentId,
  //       studentName: student.name,
  //     });
  //     setIssueBookId('');
  //     setIssueStudentIdNo('');
  //     setIssueStudentName('');
  //     await refresh();
  //     showAlert('Success', `Book issued to ${student.name} (${student.studentId})`);
  //   } catch (e) {
  //     showAlert('Issue failed', e instanceof Error ? e.message : 'Could not issue book');
  //   }
  // };


  const issueBook = async () => {
    if (!token) return;
    setIssueError(null);

    const catalogId = resolveBookCatalogId(issueBookId, books);
    const idNo = issueStudentIdNo.trim();

    if (!catalogId || !idNo) {
      const msg = 'Book Catalog ID (or book #) aur Student ID No dono zaroori hain';
      setIssueError(msg);
      showAlert('Error', msg);
      return;
    }

    if (students.length === 0) {
      const msg = 'Pehle kam se kam ek student register karein — bina registration book issue nahi hogi';
      setIssueError(msg);
      showAlert('Error', msg);
      return;
    }

    try {
      const { student } = await api.lookupStudentByIdNo(token, idNo);
      if (!issueStudentName.trim()) {
        setIssueStudentName(student.name);
      }
      await api.getBook(catalogId);
      const { issues: activeIssues } = await api.getActiveIssues(token);

      const limitErr = validateStudentCanIssue(activeIssues, student.studentId, catalogId);
      if (limitErr) {
        setIssueError(limitErr);
        showAlert('Issue not allowed', limitErr);
        return;
      }

      await api.issueBook(token, {
        bookId: catalogId,
        studentId: student.studentId,
        studentName: student.name,
      });

      setIssueBookId('');
      setIssueStudentIdNo('');
      setIssueStudentName('');
      setIssueError(null);
      await refresh();
      showAlert('Success', `Book issued to ${student.name} (${student.studentId})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not issue book';
      setIssueError(msg);
      showAlert('Issue failed', msg);
    }
  };

  const startDeleteBook = async () => {
    if (!token) return;
    const catalogId = resolveBookCatalogId(deleteBookId, books);
    if (!catalogId) {
      showAlert('Error', 'Enter Book Catalog ID or book # to delete');
      return;
    }
    try {
      const { book } = await api.getBook(catalogId);
      const ok = await confirmAsync(
        'Delete book?',
        `"${book.title}" (ID ${book.id})\n\nPehle saari copies return karein. Sirf teacher-added books delete ho sakti hain.`,
        { confirmLabel: 'Continue', destructive: true },
      );
      if (!ok) return;
      setDeleteTarget({ id: catalogId, title: book.title });
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Book not found');
    }
  };

  const confirmDeleteBook = async (password: string) => {
    if (!token || !deleteTarget) return;
    try {
      const del = await api.deleteBook(token, deleteTarget.id, password);
      setDeleteTarget(null);
      setDeleteBookId('');
      await refresh();
      showAlert(
        del.sheetWarning ? 'Deleted (Excel pending)' : 'Deleted',
        del.sheetWarning || 'Book remove ho gayi',
      );
    } catch (e) {
      showAlert('Delete failed', e instanceof Error ? e.message : 'Could not delete book');
    }
  };

  const inputProps = {
    placeholderTextColor: FormColors.inputPlaceholder,
    style: FormStyles.input,
  };

  return (
    <ScrollView
      contentContainerStyle={FormStyles.page}
      refreshControl={<RefreshControl refreshing={loadingStudents} onRefresh={() => loadStudents()} />}>
      <PageHeader
        badge="Teacher"
        title={`Welcome, ${teacher?.name ?? 'Staff'}`}
        subtitle={`ID: ${teacher?.teacherId ?? '—'}`}
      />

      {teacher ? (
        <View style={styles.profileBox}>
          <ThemedText style={FormStyles.bodyText}>
            Mobile: {teacher.mobile || '—'} · Dept: {teacher.department || '—'}
          </ThemedText>
          <ThemedText style={FormStyles.bodyText}>Incharge: {teacher.inCharge || '—'}</ThemedText>
          <ThemedText style={styles.profileHint}>
            Profile sirf Dean edit kar sakta hai — teacher khud change nahi kar sakta
          </ThemedText>
        </View>
      ) : null}

      {syncBanner ? (
        <View style={styles.syncBanner}>
          <ThemedText style={styles.syncBannerText}>⚠ {syncBanner}</ThemedText>
        </View>
      ) : null}

      <Pressable style={styles.historyBtn} onPress={() => router.push('/(tabs)/history')}>
        <ThemedText style={styles.historyBtnText}>📋 View Book History (issue & return)</ThemedText>
      </Pressable>

      <View style={FormStyles.card}>
        <ThemedText style={FormStyles.cardTitle}>👤 Students</ThemedText>
        <View style={styles.searchRow}>
          <TextInput
            value={studentSearch}
            onChangeText={setStudentSearch}
            placeholder="Search User ID, ID No, name…"
            {...inputProps}
            style={[FormStyles.input, styles.searchInput]}
            onSubmitEditing={() => loadStudents(studentSearch.trim() || undefined)}
          />
          <Pressable style={styles.searchBtn} onPress={() => loadStudents(studentSearch.trim() || undefined)}>
            <ThemedText style={styles.btnText}>Search</ThemedText>
          </Pressable>
        </View>
        <Pressable style={styles.btn} onPress={() => router.push('/student/register')}>
          <ThemedText style={styles.btnText}>+ Register New Student</ThemedText>
        </Pressable>
        {students.length === 0 ? (
          <ThemedText style={FormStyles.hint}>No students yet</ThemedText>
        ) : (
          students.map((s) => (
            <View key={`${s.studentId}-${s.userId}`} style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <ThemedText style={styles.studentIdText}>ID No: {s.studentId}</ThemedText>
                <ThemedText style={FormStyles.metaText}>
                  User ID: {s.userId || s.studentUserId}
                </ThemedText>
                <ThemedText style={FormStyles.bodyText}>Name: {s.name}</ThemedText>
                <ThemedText style={FormStyles.metaText}>
                  Grade {s.year} · {s.course} · {s.department}
                </ThemedText>
              </View>
              <View style={styles.studentActions}>
                <Pressable style={styles.smallBtn} onPress={() => openEdit(s)}>
                  <ThemedText style={styles.smallBtnText}>Edit</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.smallBtnDanger}
                  onPress={() => handleDeleteStudent(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${s.name}`}>
                  <ThemedText style={styles.smallBtnText}>Del</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={FormStyles.card}>
        <ThemedText style={FormStyles.cardTitle}>➕ Add New Book</ThemedText>
        <ThemedText style={FormStyles.label}>Book title *</ThemedText>
        <TextInput placeholder="Title" value={title} onChangeText={setTitle} {...inputProps} />
        <ThemedText style={FormStyles.label}>Author name *</ThemedText>
        <TextInput placeholder="Authors" value={authors} onChangeText={setAuthors} {...inputProps} />
        <ThemedText style={FormStyles.label}>Publisher</ThemedText>
        <TextInput placeholder="Publisher name" value={publisher} onChangeText={setPublisher} {...inputProps} />
        <ThemedText style={FormStyles.label}>Subject name *</ThemedText>
        <TextInput placeholder="Subject" value={subject} onChangeText={setSubject} {...inputProps} />
        <TextInput placeholder="Rack no." value={rackNo} onChangeText={setRackNo} {...inputProps} />
        <TextInput
          placeholder="Department"
          value={department}
          onChangeText={setDepartment}
          {...inputProps}
        />
        <TextInput
          placeholder="Copies"
          value={copies}
          onChangeText={setCopies}
          keyboardType="number-pad"
          {...inputProps}
        />
        <Pressable style={styles.btn} onPress={addBook}>
          <ThemedText style={styles.btnText}>Add Book</ThemedText>
        </Pressable>
      </View>

      <View style={FormStyles.card}>
        <ThemedText style={FormStyles.cardTitle}>📤 Issue Book</ThemedText>
        <ThemedText style={FormStyles.label}>Book Catalog ID or book # *</ThemedText>
        <TextInput
          placeholder="Catalog ID (e.g. 6) or serial #"
          value={issueBookId}
          onChangeText={setIssueBookId}
          {...inputProps}
        />
        <ThemedText style={FormStyles.hint}>
          Books cannot be issued without student registration. Enter the ID No. (not the User ID).
          A student can issue a maximum of {MAX_STUDENT_ACTIVE_ISSUES} books, and the same book cannot be issued again.
        </ThemedText>
        <ThemedText style={FormStyles.label}>Student ID No * (enrollment / roll)</ThemedText>
        <TextInput
          placeholder="Enrollment / roll number"
          value={issueStudentIdNo}
          onChangeText={setIssueStudentIdNo}
          onBlur={lookupStudentForIssue}
          autoCapitalize="characters"
          {...inputProps}
        />
        {issueStudentName ? (
          <ThemedText style={FormStyles.bodyText}>✓ Registered: {issueStudentName}</ThemedText>
        ) : issueStudentIdNo.trim() ? (
          <ThemedText style={[FormStyles.hint, { color: '#b91c1c' }]}>
            Student not found — register karein ya sahi ID No likhein
          </ThemedText>
        ) : null}
        {issueError ? (
          <View style={styles.issueErrorBanner}>
            <ThemedText style={styles.issueErrorText}>{issueError}</ThemedText>
          </View>
        ) : null}
        <Pressable style={styles.btn} onPress={issueBook}>
          <ThemedText style={styles.btnText}>Issue Book to Student</ThemedText>
        </Pressable>
      </View>

      <View style={FormStyles.card}>
        <ThemedText style={FormStyles.cardTitle}>🗑️ Manage / Delete Book</ThemedText>
        <ThemedText style={FormStyles.hint}>
          Delete ke liye apna password zaroori hai. Pehle saari copies return karein.
        </ThemedText>
        <ThemedText style={FormStyles.label}>Book Catalog ID to delete *</ThemedText>
        <TextInput
          placeholder="Catalog ID of book to remove"
          value={deleteBookId}
          onChangeText={setDeleteBookId}
          {...inputProps}
        />
        <Pressable style={styles.btnDanger} onPress={startDeleteBook}>
          <ThemedText style={styles.btnText}>Delete Book</ThemedText>
        </Pressable>
      </View>

      <TeacherReturnPasswordModal
        visible={Boolean(deleteTarget)}
        bookTitle={deleteTarget?.title}
        title="Book delete — password"
        subtitle="Book hataane ke liye apna teacher/dean password daalein."
        confirmLabel="Delete book"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteBook}
      />

      <Pressable style={styles.logout} onPress={logout}>
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
