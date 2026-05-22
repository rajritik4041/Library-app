import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { SearchBar } from '@/components/library/search-bar';
import { StatCard } from '@/components/library/stat-card';
import { TeacherReturnPasswordModal } from '@/components/library/teacher-return-password-modal';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { resolveIssueBookRack } from '@/lib/book-catalog-fields';
import { filterIssuesByQuery } from '@/lib/filter-issues';
import { showAlert } from '@/lib/show-alert';
import { api } from '@/services/api';
import type { ApiIssue } from '@/types/api';

function formatDt(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isActive(issue: ApiIssue) {
  return issue.status === 'issued' || !issue.returnedAt;
}

export default function HistoryScreen() {
  const { isStaff, token } = useAuth();
  const router = useRouter();
  const { styles: FormStyles } = useFormStyles();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
        width: '100%',
      },
      statWrap: { flex: 1, minWidth: 140 },
      errorBanner: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: Radius.md,
        padding: Spacing.three,
        width: '100%',
      },
      errorText: { color: '#b91c1c', fontWeight: '600', fontSize: 14, lineHeight: 20 },
      sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: c.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: Spacing.two,
        marginBottom: Spacing.one,
      },
      linkBtn: {
        alignSelf: 'center',
        padding: Spacing.two,
        marginBottom: Spacing.two,
      },
      linkBtnText: { color: c.accent, fontWeight: '700', fontSize: 15 },
      card: {
        width: '100%',
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: Spacing.two,
      },
      cardActive: { borderLeftWidth: 4, borderLeftColor: c.accent },
      cardReturned: { borderLeftWidth: 4, borderLeftColor: c.success, opacity: 0.92 },
      statusRow: { flexDirection: 'row' },
      statusBadge: {
        fontSize: 11,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
      },
      badgeActive: { backgroundColor: c.accentSoft, color: c.accent },
      badgeReturned: { backgroundColor: '#d1fae5', color: c.success },
      bookTitle: { fontSize: 17, fontWeight: '800', color: c.ink },
      returnBtn: {
        marginTop: Spacing.two,
        backgroundColor: c.success,
        padding: Spacing.two,
        borderRadius: Radius.md,
        alignItems: 'center',
      },
      btn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
      },
      btnText: { color: '#fff', fontWeight: '800' },
      loadingBox: { padding: Spacing.five, alignItems: 'center' },
    }),
  );

  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [returnIssue, setReturnIssue] = useState<ApiIssue | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setPageError(null);
    try {
      const data = await api.getIssueHistory(token);
      setIssues(data.issues);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'History load nahi hui';
      setPageError(msg);
      showAlert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isStaff && token) load();
    else setLoading(false);
  }, [isStaff, token, load]);

  const onReturnConfirm = async (password: string) => {
    if (!token || !returnIssue) return;
    try {
      await api.returnBook(token, returnIssue.id, password);
      setReturnIssue(null);
      await load();
      showAlert('Success', 'Book returned — ab library mein available dikhegi');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Return failed';
      showAlert('Error', msg);
    }
  };

  const filteredIssues = useMemo(
    () => filterIssuesByQuery(issues, searchQuery),
    [issues, searchQuery],
  );

  const activeAll = useMemo(() => issues.filter(isActive), [issues]);
  const returnedAll = useMemo(() => issues.filter((i) => !isActive(i)), [issues]);
  const activeFiltered = useMemo(() => filteredIssues.filter(isActive), [filteredIssues]);
  const returnedFiltered = useMemo(() => filteredIssues.filter((i) => !isActive(i)), [filteredIssues]);

  const renderIssue = (issue: ApiIssue) => {
    const active = isActive(issue);
    return (
      <View
        key={issue.id}
        style={[styles.card, active ? styles.cardActive : styles.cardReturned]}>
        <View style={styles.statusRow}>
          <ThemedText style={[styles.statusBadge, active ? styles.badgeActive : styles.badgeReturned]}>
            {active ? 'WITH STUDENT' : 'RETURNED'}
          </ThemedText>
        </View>
        <ThemedText style={styles.bookTitle}>{issue.book?.title ?? 'Book'}</ThemedText>
        <ThemedText style={FormStyles.metaText}>
          Book ID: {issue.book?.id} · Rack {resolveIssueBookRack(issue.book) || '—'}
        </ThemedText>
        <ThemedText style={FormStyles.bodyText}>
          Student: {issue.studentName || '—'} (ID No: {issue.studentId})
        </ThemedText>
        <ThemedText style={FormStyles.metaText}>
          Issued: {formatDt(issue.issuedAt)}
          {issue.teacherName ? ` · By ${issue.teacherName}` : ''}
        </ThemedText>
        {!active ? (
          <ThemedText style={FormStyles.metaText}>Returned: {formatDt(issue.returnedAt)}</ThemedText>
        ) : (
          <Pressable style={styles.returnBtn} onPress={() => setReturnIssue(issue)}>
            <ThemedText style={styles.btnText}>Mark Returned Now</ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  if (!isStaff || !token) {
    return (
      <ScrollView contentContainerStyle={FormStyles.pageCentered}>
        <PageHeader
          title="Book History"
          subtitle="Teacher ya Dean login — issue aur return records"
        />
        <Pressable style={styles.btn} onPress={() => router.push('/welcome')}>
          <ThemedText style={styles.btnText}>Sign in</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={FormStyles.page}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader
        badge="History"
        title="Book Issue History"
        subtitle="Search and track which student has a specific book issued."
      />

      <View style={styles.statsRow}>
        <View style={styles.statWrap}>
          <StatCard label="With students" value={String(activeAll.length)} accent="teal" />
        </View>
        <View style={styles.statWrap}>
          <StatCard label="Returned" value={String(returnedAll.length)} accent="gold" />
        </View>
      </View>

      {pageError ? (
        <View style={styles.errorBanner}>
          <ThemedText style={styles.errorText}>{pageError}</ThemedText>
        </View>
      ) : null}

      {issues.length > 0 ? (
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Student ID, name, book title, teacher..."
          resultCount={searchQuery.trim() ? filteredIssues.length : undefined}
          resultUnit="record"
          onClear={() => setSearchQuery('')}
        />
      ) : null}

      <Pressable style={styles.linkBtn} onPress={() => router.push('/(tabs)/teacher')}>
        <ThemedText style={styles.linkBtnText}>← Professor panel</ThemedText>
      </Pressable>

      {loading && issues.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <ThemedText style={FormStyles.hint}>Loading history…</ThemedText>
        </View>
      ) : issues.length === 0 ? (
        <ThemedText style={FormStyles.hint}>There are currently no issued book records.</ThemedText>
      ) : filteredIssues.length === 0 ? (
        <ThemedText style={FormStyles.hint}>
        No records found — search using the Student ID Number, book title, or student name.
        </ThemedText>
      ) : (
        <>
          {activeFiltered.length > 0 ? (
            <>
              <ThemedText style={styles.sectionTitle}>
                Active ({activeFiltered.length}
                {searchQuery.trim() ? ` / ${activeAll.length}` : ''})
              </ThemedText>
              {activeFiltered.map(renderIssue)}
            </>
          ) : null}
          {returnedFiltered.length > 0 ? (
            <>
              <ThemedText style={styles.sectionTitle}>
                Returned ({returnedFiltered.length}
                {searchQuery.trim() ? ` / ${returnedAll.length}` : ''})
              </ThemedText>
              {returnedFiltered.map(renderIssue)}
            </>
          ) : null}
        </>
      )}

      <TeacherReturnPasswordModal
        visible={Boolean(returnIssue)}
        bookTitle={returnIssue?.book?.title}
        onCancel={() => setReturnIssue(null)}
        onConfirm={onReturnConfirm}
      />
    </ScrollView>
  );
}
