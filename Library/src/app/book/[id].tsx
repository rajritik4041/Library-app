import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AvailabilityBadge } from '@/components/library/availability-badge';
import { DetailRow } from '@/components/library/detail-row';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useBooksApi } from '@/context/books-api-context';
import { Radius, Spacing } from '@/constants/theme';
import { getDepartmentLabel } from '@/constants/departments';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api } from '@/services/api';
import { resolveBookCatalogId } from '@/lib/book-id';
import {
  enrichApiBook,
  resolveBookAuthors,
  resolveBookPublisher,
  resolveBookRackNo,
} from '@/lib/book-catalog-fields';
import {
  MAX_STUDENT_ACTIVE_ISSUES,
  studentAlreadyHasBookOnPage,
  validateStudentCanIssue,
} from '@/lib/issue-limits';
import { showAlert } from '@/lib/show-alert';
import type { ApiBook, ApiIssue } from '@/types/api';

export default function BookDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const { isStaff, token } = useAuth();
  const { refresh, getBookById: getBookFromStore, books } = useBooksApi();
  const colors = useLibraryColors();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      backLinkText: { color: c.accent, fontWeight: '600', fontSize: 15 },
      hero: {
        borderRadius: Radius.xl,
        padding: Spacing.four,
        gap: Spacing.two,
      },
      heroId: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
      title: { fontSize: 24, fontWeight: '800', color: '#fff', lineHeight: 32 },
      authors: { fontSize: 16, color: 'rgba(255,255,255,0.85)' },
      publisher: { fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
      detailsCard: {
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        borderWidth: 1,
        borderColor: c.border,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.ink,
        marginBottom: Spacing.two,
      },
      issuesCard: {
        backgroundColor: c.warningBg,
        padding: Spacing.four,
        borderRadius: Radius.lg,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
      },
      issueRow: {
        gap: 4,
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
      },
      issueStudent: { fontWeight: '800', color: c.ink, fontSize: 15 },
      issueMeta: { fontSize: 13, color: c.inkMuted },
      publicNote: {
        backgroundColor: c.accentSoft,
        padding: Spacing.four,
        borderRadius: Radius.lg,
      },
      publicNoteText: { color: c.ink, lineHeight: 22 },
      issueForm: {
        backgroundColor: c.card,
        padding: Spacing.four,
        borderRadius: Radius.lg,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: Spacing.five,
      },
      input: {
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: Radius.md,
        padding: Spacing.three,
        fontSize: 15,
        color: c.inputText,
        backgroundColor: c.inputBg,
        outlineStyle: 'none',
      } as object,
      issueBtn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
      },
      issueBtnText: { color: '#fff', fontWeight: '800' },
      issueHint: { fontSize: 13, color: c.inkMuted, lineHeight: 20 },
      issueOk: { fontSize: 14, fontWeight: '700', color: c.success },
      issueErr: { fontSize: 13, color: c.danger, lineHeight: 20 },
      loginBtn: {
        padding: Spacing.three,
        alignItems: 'center',
        marginBottom: Spacing.five,
      },
      loginBtnText: { color: c.accent, fontWeight: '700' },
      notFoundTitle: { fontSize: 22, fontWeight: '700', color: c.ink },
      editCard: {
        backgroundColor: c.card,
        padding: Spacing.four,
        borderRadius: Radius.lg,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: Spacing.four,
      },
      editToggle: {
        alignSelf: 'flex-start',
        paddingVertical: Spacing.two,
      },
      editToggleText: { color: c.accent, fontWeight: '700', fontSize: 15 },
      saveBtn: {
        backgroundColor: c.accent,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
      },
      saveBtnText: { color: '#fff', fontWeight: '800' },
    }),
  );

  const [book, setBook] = useState<ApiBook | null>(null);
  const [activeIssues, setActiveIssues] = useState<ApiIssue[]>([]);
  const [studentIdNo, setStudentIdNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentLookupError, setStudentLookupError] = useState('');
  const [issueError, setIssueError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthors, setEditAuthors] = useState('');
  const [editPublisher, setEditPublisher] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editRack, setEditRack] = useState('');
  const [editCopies, setEditCopies] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getBook(id);
      setBook(enrichApiBook(data.book));
      setActiveIssues(data.activeIssues);
    } catch {
      const cached = getBookFromStore(id);
      if (cached) {
        setBook(enrichApiBook(cached));
        setActiveIssues([]);
      } else {
        setBook(null);
      }
    }
  }, [id, getBookFromStore]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    if (!book) return;
    setEditTitle(book.title);
    setEditAuthors(resolveBookAuthors(book));
    setEditPublisher(resolveBookPublisher(book));
    setEditDepartment(book.department || '');
    setEditSubject(book.subject || '');
    setEditRack(resolveBookRackNo(book));
    setEditCopies(String(book.copies));
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!token || !book || !editTitle.trim()) {
      showAlert('Error', 'Title is required');
      return;
    }
    setSavingEdit(true);
    try {
      const catalogId = resolveBookCatalogId(book.id, books.length ? books : [book]);
      const { book: updated, sheetWarning } = await api.updateBook(token, catalogId, {
        title: editTitle.trim(),
        authors: editAuthors.trim(),
        publisher: editPublisher.trim(),
        department: editDepartment.trim(),
        subject: editSubject.trim(),
        rackNo: editRack.trim(),
        copies: Number(editCopies) || book.copies,
      });
      setBook(enrichApiBook(updated));
      setEditing(false);
      await refresh();
      showAlert(
        sheetWarning ? 'Saved (Excel pending)' : 'Saved',
        sheetWarning || 'Book updated — Google Sheet & MongoDB synced',
      );
    } catch (e) {
      showAlert('Update failed', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSavingEdit(false);
    }
  };

  const lookupStudent = async () => {
    const idNo = studentIdNo.trim();
    if (!token || !idNo) {
      setStudentName('');
      setStudentLookupError('');
      return;
    }
    try {
      const { student } = await api.lookupStudentByIdNo(token, idNo);
      setStudentName(student.name);
      setStudentIdNo(student.studentId);
      setStudentLookupError('');
    } catch {
      setStudentName('');
      setStudentLookupError('Student not registered — please ask a professor to register the student first.');
    }
  };

  const issueToStudent = async () => {
    setIssueError(null);
    const idNo = studentIdNo.trim();
    if (!token || !id || !idNo) {
      const msg = 'Student ID Number (Enrollment Number) is required.';
      setIssueError(msg);
      showAlert('Error', msg);
      return;
    }
    try {
      const { student } = await api.lookupStudentByIdNo(token, idNo);
      setStudentName(student.name);
      setStudentIdNo(student.studentId);
      setStudentLookupError('');
      if (studentAlreadyHasBookOnPage(activeIssues, student.studentId)) {
        const msg =
          'This book has already been issued to this student. The same book cannot be issued again.';
        setIssueError(msg);
        showAlert('Issue not allowed', msg);
        return;
      }
      const { issues: allActive } = await api.getActiveIssues(token);
      const limitErr = validateStudentCanIssue(allActive, student.studentId, id);
      if (limitErr) {
        setIssueError(limitErr);
        showAlert('Issue not allowed', limitErr);
        return;
      }
      await api.issueBook(token, {
        bookId: id,
        studentId: student.studentId,
        studentName: student.name,
      });
      setStudentIdNo('');
      setStudentName('');
      setStudentLookupError('');
      setIssueError(null);
      await load();
      await refresh();
      showAlert('Issued', `Book ${student.name} (${student.studentId}) ko di gayi`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not issue book';
      setIssueError(msg);
      showAlert('Issue failed', msg);
    }
  };

  const publisherText = book ? resolveBookPublisher(book) : '';
  const authorsText = book ? resolveBookAuthors(book) : '';
  const rackText = book ? resolveBookRackNo(book) : '';

  if (!book) {
    return (
      <ScreenShell>
        <ThemedText style={styles.notFoundTitle}>Book not found</ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={styles.backLinkText}>← Go back</ThemedText>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <Pressable onPress={() => router.back()}>
        <ThemedText style={styles.backLinkText}>← Back to catalog</ThemedText>
      </Pressable>

      <LinearGradient
        colors={[colors.navy, colors.navyMid]}
        style={styles.hero}>
        <ThemedText style={styles.heroId}>
          Book #{book.serialNo} · ID {book.id}
          {rackText ? ` · Rack ${rackText}` : ''}
        </ThemedText>
        <ThemedText style={styles.title}>{book.title}</ThemedText>
        {authorsText ? (
          <ThemedText style={styles.authors}>by {authorsText}</ThemedText>
        ) : null}
        {publisherText ? (
          <ThemedText style={styles.publisher}>{publisherText}</ThemedText>
        ) : null}
        <AvailabilityBadge
          status={book.status}
          availableCount={book.availableCount}
          copies={book.copies}
        />
      </LinearGradient>

      {isStaff ? (
        <View style={styles.editCard}>
          <Pressable style={styles.editToggle} onPress={() => (editing ? setEditing(false) : startEdit())}>
            <ThemedText style={styles.editToggleText}>
              {editing ? '✕ Cancel edit' : '✎ Edit book (teacher only)'}
            </ThemedText>
          </Pressable>
          {editing ? (
            <>
              <TextInput
                placeholder="Title *"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
              <TextInput
                placeholder="Authors"
                value={editAuthors}
                onChangeText={setEditAuthors}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
              <TextInput
                placeholder="Publisher"
                value={editPublisher}
                onChangeText={setEditPublisher}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
              <TextInput
                placeholder="Department"
                value={editDepartment}
                onChangeText={setEditDepartment}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
              <TextInput
                placeholder="Subject"
                value={editSubject}
                onChangeText={setEditSubject}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
              <TextInput
                placeholder="Rack no."
                value={editRack}
                onChangeText={setEditRack}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
              <TextInput
                placeholder="Copies"
                value={editCopies}
                onChangeText={setEditCopies}
                keyboardType="number-pad"
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
              <Pressable style={styles.saveBtn} onPress={saveEdit} disabled={savingEdit}>
                <ThemedText style={styles.saveBtnText}>
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </ThemedText>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.detailsCard}>
        <ThemedText style={styles.sectionTitle}>Book Information</ThemedText>
        <DetailRow label="Title" value={book.title || '—'} />
        <DetailRow label="Author(s)" value={authorsText || '—'} />
        <DetailRow label="Publisher" value={publisherText || '—'} />
        <DetailRow label="Department" value={`${book.department} — ${getDepartmentLabel(book.department)}`} />
        <DetailRow label="Subject" value={`${book.subject} — ${getDepartmentLabel(book.subject)}`} />
        <DetailRow label="Rack Number" value={rackText || '—'} />
        <DetailRow label="Total Copies" value={String(book.copies)} />
        <DetailRow label="In Library Now" value={String(book.availableCount)} />
        <DetailRow label="Currently Issued" value={String(book.issuedCount)} />
      </View>

      {isStaff && activeIssues.length > 0 ? (
        <View style={styles.issuesCard}>
          <ThemedText style={styles.sectionTitle}>Students with this book</ThemedText>
          {activeIssues.map((issue) => (
            <View key={issue.id} style={styles.issueRow}>
              <ThemedText style={styles.issueStudent}>Student ID: {issue.studentId}</ThemedText>
              {issue.studentName ? (
                <ThemedText style={styles.issueMeta}>{issue.studentName}</ThemedText>
              ) : null}
              <ThemedText style={styles.issueMeta}>
                Since {new Date(issue.issuedAt).toLocaleDateString('en-IN')}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : !isStaff && book.status === 'issued_out' ? (
        <View style={styles.publicNote}>
          <ThemedText style={styles.publicNoteText}>
            This book is currently not available in the library — it has been issued by another student.
            Only teachers can view the Student ID.
          </ThemedText>
        </View>
      ) : null}

      {isStaff && book.availableCount > 0 ? (
        <View style={styles.issueForm}>
          <ThemedText style={styles.sectionTitle}>Issue to Student</ThemedText>
          <ThemedText style={styles.issueHint}>
            Only registered students are allowed — enter the ID No (Enrollment No.), not the User ID.
            Maximum {MAX_STUDENT_ACTIVE_ISSUES} books can be issued per student; the same book can only be issued once.
          </ThemedText>
          <TextInput
            placeholder="Student ID No *"
            value={studentIdNo}
            onChangeText={(v) => {
              setStudentIdNo(v);
              setStudentName('');
              setStudentLookupError('');
              setIssueError(null);
            }}
            onBlur={lookupStudent}
            autoCapitalize="characters"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
          />
          {studentName ? (
            <ThemedText style={styles.issueOk}>✓ {studentName}</ThemedText>
          ) : studentLookupError ? (
            <ThemedText style={styles.issueErr}>{studentLookupError}</ThemedText>
          ) : null}
          {/* {issueError ? <ThemedText style={styles.issueErr}>{issueError}</ThemedText> : null} */}
          <Pressable style={styles.issueBtn} onPress={issueToStudent}>
            <ThemedText style={styles.issueBtnText}>Issue Book</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {!isStaff ? (
        <Pressable style={styles.loginBtn} onPress={() => router.push('/welcome')}>
          <ThemedText style={styles.loginBtnText}>Sign in (Professor)</ThemedText>
        </Pressable>
      ) : null}
    </ScreenShell>
  );
}
