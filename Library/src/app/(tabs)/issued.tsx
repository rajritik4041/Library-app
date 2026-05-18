import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { api } from '@/services/api';
import type { ApiIssue } from '@/types/api';

export default function IssuedScreen() {
  const { isTeacher, token } = useAuth();
  const router = useRouter();
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getActiveIssues(token);
      setIssues(data.issues);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  const onReturn = async (issueId: string) => {
    if (!token) return;
    try {
      await api.returnBook(token, issueId);
      await load();
      Alert.alert('Success', 'Book library mein wapas aa gayi');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Return failed');
    }
  };

  if (!isTeacher) {
    return (
      <ScrollView contentContainerStyle={styles.centered}>
        <ThemedText style={styles.title}>Issued Books</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sub}>
          Kaun si book library mein nahi hai — ye sirf teacher login ke baad student ID ke saath
          dikhega.
        </ThemedText>
        <Pressable style={styles.btn} onPress={() => router.push('/login')}>
          <ThemedText style={styles.btnText}>Teacher Login</ThemedText>
        </Pressable>
        <ThemedText themeColor="textSecondary" style={styles.hint}>
          Students: Books page par green/red badge se availability dekhein.
        </ThemedText>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader
        badge="Active"
        title="Issued Books"
        subtitle={`${issues.length} books abhi students ke paas`}
      />

      {issues.length === 0 ? (
        <ThemedText themeColor="textSecondary">Sab books library mein hain ✓</ThemedText>
      ) : (
        issues.map((issue) => (
          <View key={issue.id} style={styles.card}>
            <ThemedText style={styles.bookTitle}>{issue.book?.title ?? 'Book'}</ThemedText>
            <ThemedText style={styles.row}>
              <ThemedText style={styles.label}>Student ID: </ThemedText>
              {issue.studentId}
            </ThemedText>
            {issue.studentName ? (
              <ThemedText style={styles.meta}>Name: {issue.studentName}</ThemedText>
            ) : null}
            <ThemedText style={styles.meta}>
              Rack {issue.book?.rackNo} · {issue.book?.department}
            </ThemedText>
            <ThemedText style={styles.meta}>
              Issued: {new Date(issue.issuedAt).toLocaleString('en-IN')}
            </ThemedText>
            <Pressable style={styles.returnBtn} onPress={() => onReturn(issue.id)}>
              <ThemedText style={styles.returnText}>Mark Returned</ThemedText>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: LibraryColors.surface },
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
  title: { fontSize: 24, fontWeight: '800', color: LibraryColors.navy },
  sub: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  hint: { fontSize: 13, textAlign: 'center' },
  btn: {
    backgroundColor: LibraryColors.navy,
    padding: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
  card: {
    backgroundColor: LibraryColors.card,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: LibraryColors.border,
  },
  bookTitle: { fontSize: 17, fontWeight: '700', color: LibraryColors.navy },
  row: { fontSize: 15, color: LibraryColors.navy },
  label: { fontWeight: '800', color: LibraryColors.accent },
  meta: { fontSize: 13, color: LibraryColors.muted },
  returnBtn: {
    marginTop: Spacing.two,
    backgroundColor: LibraryColors.success,
    padding: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  returnText: { color: '#fff', fontWeight: '800' },
});
