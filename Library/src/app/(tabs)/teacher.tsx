import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useBooksApi } from '@/context/books-api-context';
import { FormColors, FormStyles } from '@/constants/form-styles';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { api } from '@/services/api';
import { resolveBookCatalogId } from '@/lib/book-id';
import { confirmAsync } from '@/lib/confirm';
import type { ApiStudent } from '@/types/api';

export default function TeacherScreen() {
  const { isTeacher, token, teacher, logout } = useAuth();
  const { books, refresh } = useBooksApi();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
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

  const loadStudents = useCallback(
    async (search?: string) => {
      if (!token) return;
      setLoadingStudents(true);
      try {
        const data = await api.getStudents(token, search);
        setStudents(data.students);
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load students');
      } finally {
        setLoadingStudents(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (isTeacher && token) loadStudents();
  }, [isTeacher, token, loadStudents]);

  const openEdit = (s: ApiStudent) => {
    const key = (s.userId || s.studentUserId || '').trim();
    if (!key) {
      Alert.alert('Error', 'Student User ID missing — cannot edit');
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
      Alert.alert('Error', 'Cannot identify student');
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
      Alert.alert('Deleted', `${s.name} removed from library`);
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete student');
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

  if (!isTeacher || !token) {
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
      Alert.alert('Error', 'Book title is required');
      return;
    }
    if (!authors.trim()) {
      Alert.alert('Error', 'Author name is required');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Error', 'Subject name is required');
      return;
    }
    try {
      await api.addBook(token, {
        title: title.trim(),
        authors: authors.trim(),
        subject: subject.trim(),
        rackNo,
        department,
        copies: Number(copies) || 1,
      });
      setTitle('');
      setAuthors('');
      setSubject('');
      await refresh();
      Alert.alert('Success', 'Book added');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const issueBook = async () => {
    if (!token) return;
    const catalogId = resolveBookCatalogId(issueBookId, books);
    const idNo = issueStudentIdNo.trim();
    if (!catalogId || !idNo) {
      Alert.alert('Error', 'Book Catalog ID (or book #) and Student ID No are required');
      return;
    }
    if (students.length === 0) {
      Alert.alert('Error', 'Pehle kam se kam ek student register karein — bina registration book issue nahi hogi');
      return;
    }
    try {
      const { student } = await api.lookupStudentByIdNo(token, idNo);
      if (!issueStudentName.trim()) {
        setIssueStudentName(student.name);
      }
      await api.getBook(catalogId);
      await api.issueBook(token, {
        bookId: catalogId,
        studentId: student.studentId,
        studentName: student.name,
      });
      setIssueBookId('');
      setIssueStudentIdNo('');
      setIssueStudentName('');
      await refresh();
      Alert.alert('Success', `Book issued to ${student.name} (${student.studentId})`);
    } catch (e) {
      Alert.alert('Issue failed', e instanceof Error ? e.message : 'Could not issue book');
    }
  };

  const deleteBook = async () => {
    if (!token) return;
    const catalogId = resolveBookCatalogId(deleteBookId, books);
    if (!catalogId) {
      Alert.alert('Error', 'Enter Book Catalog ID or book # to delete');
      return;
    }
    try {
      const { book } = await api.getBook(catalogId);
      const ok = await confirmAsync(
        'Delete book?',
        `"${book.title}" (ID ${book.id})\n\nReturn all issued copies first. Excel/catalog books usually cannot be deleted — only teacher-added books.`,
        { confirmLabel: 'Delete', destructive: true },
      );
      if (!ok) return;
      await api.deleteBook(token, catalogId);
      await refresh();
      setDeleteBookId('');
      Alert.alert('Deleted', 'Book removed');
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Could not delete book');
    }
  };

  const inputProps = {
    placeholderTextColor: FormColors.placeholder,
    style: FormStyles.input,
  };

  return (
    <ScrollView
      contentContainerStyle={FormStyles.page}
      refreshControl={<RefreshControl refreshing={loadingStudents} onRefresh={() => loadStudents()} />}>
      <PageHeader
        badge="Teacher"
        title={`Welcome, ${teacher?.name}`}
        subtitle={`ID: ${teacher?.teacherId}`}
      />

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
          Bina student registration ke issue nahi hogi. ID No likhein (User ID nahi).
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
        <Pressable style={styles.btn} onPress={issueBook}>
          <ThemedText style={styles.btnText}>Issue Book to Student</ThemedText>
        </Pressable>
      </View>

      <View style={FormStyles.card}>
        <ThemedText style={FormStyles.cardTitle}>🗑️ Manage / Delete Book</ThemedText>
        <ThemedText style={FormStyles.hint}>
          Delete uses its own Catalog ID. Return all issued copies before delete.
        </ThemedText>
        <ThemedText style={FormStyles.label}>Book Catalog ID to delete *</ThemedText>
        <TextInput
          placeholder="Catalog ID of book to remove"
          value={deleteBookId}
          onChangeText={setDeleteBookId}
          {...inputProps}
        />
        <Pressable style={styles.btnDanger} onPress={deleteBook}>
          <ThemedText style={styles.btnText}>Delete Book</ThemedText>
        </Pressable>
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  historyBtn: {
    width: '100%',
    backgroundColor: LibraryColors.goldMuted,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: LibraryColors.goldLight,
    alignItems: 'center',
  },
  historyBtnText: {
    color: FormColors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  searchRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', width: '100%' },
  searchInput: { flex: 1 },
  searchBtn: {
    backgroundColor: LibraryColors.accent,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  studentRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: LibraryColors.border,
    width: '100%',
  },
  studentInfo: { flex: 1, gap: 2 },
  studentIdText: { fontWeight: '800', color: FormColors.text, fontSize: 14 },
  studentActions: { gap: Spacing.one, justifyContent: 'center' },
  smallBtn: {
    backgroundColor: LibraryColors.accent,
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
    backgroundColor: LibraryColors.navy,
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
  logoutText: { color: FormColors.textMuted, fontWeight: '600' },
});
