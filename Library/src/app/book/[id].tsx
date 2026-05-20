import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

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
import type { ApiBook, ApiIssue } from '@/types/api';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isTeacher, token } = useAuth();
  const { refresh, getBookById: getBookFromStore } = useBooksApi();
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
        backgroundColor: '#fff7ed',
        padding: Spacing.four,
        borderRadius: Radius.lg,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: '#fed7aa',
      },
      issueRow: {
        gap: 4,
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
        borderBottomColor: '#fed7aa',
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
      issueOk: { fontSize: 14, fontWeight: '700', color: '#15803d' },
      issueErr: { fontSize: 13, color: '#b91c1c', lineHeight: 20 },
      loginBtn: {
        padding: Spacing.three,
        alignItems: 'center',
        marginBottom: Spacing.five,
      },
      loginBtnText: { color: c.accent, fontWeight: '700' },
      notFoundTitle: { fontSize: 22, fontWeight: '700', color: c.ink },
    }),
  );

  const [book, setBook] = useState<ApiBook | null>(null);
  const [activeIssues, setActiveIssues] = useState<ApiIssue[]>([]);
  const [studentIdNo, setStudentIdNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentLookupError, setStudentLookupError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getBook(id);
      setBook(data.book);
      setActiveIssues(data.activeIssues);
    } catch {
      const cached = getBookFromStore(id);
      if (cached) {
        setBook(cached);
        setActiveIssues([]);
      } else {
        setBook(null);
      }
    }
  }, [id, getBookFromStore]);

  useEffect(() => {
    load();
  }, [load]);

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
      setStudentLookupError('Student registered nahi — pehle teacher se register karwayein');
    }
  };

  const issueToStudent = async () => {
    if (!token || !id || !studentIdNo.trim()) {
      Alert.alert('Error', 'Student ID No (enrollment) required');
      return;
    }
    if (!studentName.trim()) {
      Alert.alert('Error', 'Student registered nahi. Sahi ID No likhein — User ID se issue nahi hogi.');
      return;
    }
    try {
      const { student } = await api.lookupStudentByIdNo(token, studentIdNo);
      await api.issueBook(token, {
        bookId: id,
        studentId: student.studentId,
        studentName: student.name,
      });
      setStudentIdNo('');
      setStudentName('');
      setStudentLookupError('');
      await load();
      await refresh();
      Alert.alert('Issued', `Book ${student.name} (${student.studentId}) ko di gayi`);
    } catch (e) {
      Alert.alert('Issue failed', e instanceof Error ? e.message : 'Could not issue book');
    }
  };

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
        <ThemedText style={styles.heroId}>Book #{book.serialNo} · ID {book.id}</ThemedText>
        <ThemedText style={styles.title}>{book.title}</ThemedText>
        {book.authors ? <ThemedText style={styles.authors}>by {book.authors}</ThemedText> : null}
        <AvailabilityBadge
          status={book.status}
          availableCount={book.availableCount}
          copies={book.copies}
        />
      </LinearGradient>

      <View style={styles.detailsCard}>
        <ThemedText style={styles.sectionTitle}>Book Information</ThemedText>
        <DetailRow label="Publisher" value={book.publisher || '—'} />
        <DetailRow label="Department" value={`${book.department} — ${getDepartmentLabel(book.department)}`} />
        <DetailRow label="Subject" value={`${book.subject} — ${getDepartmentLabel(book.subject)}`} />
        <DetailRow label="Rack Number" value={book.rackNo} />
        <DetailRow label="Total Copies" value={String(book.copies)} />
        <DetailRow label="In Library Now" value={String(book.availableCount)} />
        <DetailRow label="Currently Issued" value={String(book.issuedCount)} />
      </View>

      {isTeacher && activeIssues.length > 0 ? (
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
      ) : !isTeacher && book.status === 'issued_out' ? (
        <View style={styles.publicNote}>
          <ThemedText style={styles.publicNoteText}>
            Ye book abhi library mein nahi hai — kisi student ne issue karayi hai. (Student ID sirf
            teacher dekh sakte hain.)
          </ThemedText>
        </View>
      ) : null}

      {isTeacher && book.availableCount > 0 ? (
        <View style={styles.issueForm}>
          <ThemedText style={styles.sectionTitle}>Issue to Student</ThemedText>
          <ThemedText style={styles.issueHint}>
            Sirf registered students — ID No (enrollment) likhein, User ID nahi.
          </ThemedText>
          <TextInput
            placeholder="Student ID No *"
            value={studentIdNo}
            onChangeText={(v) => {
              setStudentIdNo(v);
              setStudentName('');
              setStudentLookupError('');
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
          <Pressable style={styles.issueBtn} onPress={issueToStudent}>
            <ThemedText style={styles.issueBtnText}>Issue Book</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {!isTeacher ? (
        <Pressable style={styles.loginBtn} onPress={() => router.push('/welcome')}>
          <ThemedText style={styles.loginBtnText}>Sign in (Teacher)</ThemedText>
        </Pressable>
      ) : null}
    </ScreenShell>
  );
}
