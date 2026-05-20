import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api } from '@/services/api';
import type { ApiIssue } from '@/types/api';

export default function IssuedScreen() {
  const { isTeacher, isStudent, token, student, logout } = useAuth();
  const router = useRouter();
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      scroll: { flex: 1, backgroundColor: c.surface },
      content: {
        padding: Spacing.four,
        gap: Spacing.three,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
        paddingBottom: 100,
      },
      centered: {
        flexGrow: 1,
        padding: Spacing.four,
        justifyContent: 'center',
        gap: Spacing.three,
        maxWidth: 480,
        alignSelf: 'center',
      },
      title: { fontSize: 24, fontWeight: '800', color: c.ink },
      sub: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
      btn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
      },
      btnOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: c.navy,
      },
      btnText: { color: '#fff', fontWeight: '800' },
      btnOutlineText: { color: c.ink, fontWeight: '800' },
      link: {
        color: c.accent,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.two,
      },
      profileCard: {
        backgroundColor: c.accentSoft,
        padding: Spacing.three,
        borderRadius: Radius.md,
        gap: 4,
      },
      profileBtn: { marginVertical: Spacing.one },
      profileBtnText: { color: c.accent, fontWeight: '700', fontSize: 14 },
      profileLine: { fontSize: 14, color: c.ink },
      profileLabel: { fontWeight: '800', color: c.accent },
      card: {
        backgroundColor: c.card,
        padding: Spacing.four,
        borderRadius: Radius.lg,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
      },
      bookTitle: { fontSize: 17, fontWeight: '700', color: c.ink },
      row: { fontSize: 15, color: c.ink },
      label: { fontWeight: '800', color: c.accent },
      meta: { fontSize: 13, color: c.inkMuted },
      studentNote: {
        fontSize: 13,
        color: c.success,
        fontWeight: '600',
        marginTop: Spacing.one,
      },
      returnBtn: {
        marginTop: Spacing.two,
        backgroundColor: c.success,
        padding: Spacing.two,
        borderRadius: Radius.md,
        alignItems: 'center',
      },
      returnText: { color: '#fff', fontWeight: '800' },
      logout: { alignItems: 'center', padding: Spacing.three, marginTop: Spacing.two },
      logoutText: { color: c.inkMuted, fontWeight: '600' },
    }),
  );

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = isStudent
        ? await api.getMyIssues(token)
        : await api.getActiveIssues(token);
      setIssues(data.issues);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token, isStudent]);

  React.useEffect(() => {
    load();
    if (!token) {
      return;
    }
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load, token]);

  const onReturn = async (issueId: string) => {
    if (!token) return;
    try {
      await api.returnBook(token, issueId);
      await load();
      Alert.alert('Success', 'Book returned to library');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Return failed');
    }
  };

  if (!isTeacher && !isStudent) {
    return (
      <ScrollView contentContainerStyle={styles.centered}>
        <ThemedText style={styles.title}>My Books / Issued</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sub}>
          Students: sign in to see books issued to you. Teachers: sign in to manage returns.
        </ThemedText>
        <Pressable style={styles.btn} onPress={() => router.push('/login-student')}>
          <ThemedText style={styles.btnText}>Student Login</ThemedText>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => router.push('/login-teacher')}>
          <ThemedText style={styles.btnOutlineText}>Teacher Login</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.replace('/welcome')}>
          <ThemedText style={styles.link}>← Library sign in</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const title = isStudent ? 'My Issued Books' : 'Issued Books';
  const subtitle = isStudent
    ? student
      ? `${student.name} (${student.studentId}) · ${issues.length} book(s) with you`
      : 'Books currently issued to you'
    : `${issues.length} books with students`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader badge={isStudent ? 'Student' : 'Teacher'} title={title} subtitle={subtitle} />

      {isStudent && student ? (
        <View style={styles.profileCard}>
          <ThemedText style={styles.profileLine}>
            <ThemedText style={styles.profileLabel}>User ID: </ThemedText>
            {student.userId}
          </ThemedText>
          <ThemedText style={styles.profileLine}>
            <ThemedText style={styles.profileLabel}>ID No: </ThemedText>
            {student.studentId}
          </ThemedText>
          <Pressable style={styles.profileBtn} onPress={() => router.push('/student-profile')}>
            <ThemedText style={styles.profileBtnText}>Update my profile →</ThemedText>
          </Pressable>
          <ThemedText style={styles.profileLine}>
            <ThemedText style={styles.profileLabel}>Course: </ThemedText>
            {student.course}
          </ThemedText>
          <ThemedText style={styles.profileLine}>
            <ThemedText style={styles.profileLabel}>Year: </ThemedText>
            {student.year}
          </ThemedText>
          <ThemedText style={styles.profileLine}>
            <ThemedText style={styles.profileLabel}>Department: </ThemedText>
            {student.department}
          </ThemedText>
        </View>
      ) : null}

      {issues.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          {isStudent ? 'No books issued to you right now ✓' : 'All books are in the library ✓'}
        </ThemedText>
      ) : (
        issues.map((issue) => (
          <View key={issue.id} style={styles.card}>
            <ThemedText style={styles.bookTitle}>{issue.book?.title ?? 'Book'}</ThemedText>
            {!isStudent ? (
              <>
                <ThemedText style={styles.row}>
                  <ThemedText style={styles.label}>Student ID: </ThemedText>
                  {issue.studentId}
                </ThemedText>
                {issue.studentName ? (
                  <ThemedText style={styles.meta}>Name: {issue.studentName}</ThemedText>
                ) : null}
              </>
            ) : null}
            <ThemedText style={styles.meta}>
              Rack {issue.book?.rackNo} · {issue.book?.department}
            </ThemedText>
            <ThemedText style={styles.meta}>
              Issued: {new Date(issue.issuedAt).toLocaleString('en-IN')}
            </ThemedText>
            {isTeacher ? (
              <Pressable style={styles.returnBtn} onPress={() => onReturn(issue.id)}>
                <ThemedText style={styles.returnText}>Mark Returned</ThemedText>
              </Pressable>
            ) : (
              <ThemedText style={styles.studentNote}>
                Return this book at the library desk
              </ThemedText>
            )}
          </View>
        ))
      )}

      <Pressable style={styles.logout} onPress={logout}>
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
