import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
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

export default function HistoryScreen() {
  const { isTeacher, token } = useAuth();
  const router = useRouter();
  const { styles: FormStyles } = useFormStyles();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      linkBtn: {
        alignSelf: 'center',
        padding: Spacing.two,
        marginBottom: Spacing.two,
      },
      linkBtnText: {
        color: c.accent,
        fontWeight: '700',
        fontSize: 15,
      },
      card: {
        width: '100%',
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
        alignSelf: 'center',
      },
      cardActive: {
        borderLeftWidth: 4,
        borderLeftColor: c.accent,
      },
      cardReturned: {
        borderLeftWidth: 4,
        borderLeftColor: c.success,
        opacity: 0.92,
      },
      statusRow: { flexDirection: 'row' },
      statusBadge: {
        fontSize: 11,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
      },
      badgeActive: {
        backgroundColor: c.accentSoft,
        color: c.accent,
      },
      badgeReturned: {
        backgroundColor: '#d1fae5',
        color: c.success,
      },
      bookTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: c.ink,
      },
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
    }),
  );
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getIssueHistory(token);
      setIssues(data.issues);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isTeacher && token) load();
    else setLoading(false);
  }, [isTeacher, token, load]);

  const onReturn = async (issueId: string) => {
    if (!token) return;
    try {
      await api.returnBook(token, issueId);
      await load();
      Alert.alert('Success', 'Book marked as returned');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Return failed');
    }
  };

  if (!isTeacher || !token) {
    return (
      <ScrollView contentContainerStyle={FormStyles.pageCentered}>
        <PageHeader
          title="Book History"
          subtitle="Teacher login required to view who took and returned books"
        />
        <Pressable style={styles.btn} onPress={() => router.push('/login-teacher')}>
          <ThemedText style={styles.btnText}>Teacher Login</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const active = issues.filter((i) => i.status === 'issued' || !i.returnedAt);
  const returned = issues.filter((i) => i.status === 'returned' || i.returnedAt);

  return (
    <ScrollView
      contentContainerStyle={FormStyles.page}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader
        badge="Teacher"
        title="Book Issue History"
        subtitle={`${active.length} with students · ${returned.length} returned`}
      />

      <Pressable style={styles.linkBtn} onPress={() => router.push('/(tabs)/teacher')}>
        <ThemedText style={styles.linkBtnText}>← Back to Teacher page</ThemedText>
      </Pressable>

      {issues.length === 0 ? (
        <ThemedText style={FormStyles.hint}>No issue records yet</ThemedText>
      ) : (
        issues.map((issue) => {
          const isActive = issue.status === 'issued' || !issue.returnedAt;
          return (
            <View key={issue.id} style={[styles.card, isActive ? styles.cardActive : styles.cardReturned]}>
              <View style={styles.statusRow}>
                <ThemedText style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeReturned]}>
                  {isActive ? 'WITH STUDENT' : 'RETURNED'}
                </ThemedText>
              </View>
              <ThemedText style={styles.bookTitle}>{issue.book?.title ?? 'Book'}</ThemedText>
              <ThemedText style={FormStyles.metaText}>
                Book ID: {issue.book?.id} · Rack {issue.book?.rackNo}
              </ThemedText>
              <ThemedText style={FormStyles.bodyText}>
                Student: {issue.studentName || '—'} (ID No: {issue.studentId})
              </ThemedText>
              <ThemedText style={FormStyles.metaText}>
                Issued: {formatDt(issue.issuedAt)}
                {issue.teacherName ? ` · By ${issue.teacherName}` : ''}
              </ThemedText>
              {!isActive ? (
                <ThemedText style={FormStyles.metaText}>Returned: {formatDt(issue.returnedAt)}</ThemedText>
              ) : (
                <Pressable style={styles.returnBtn} onPress={() => onReturn(issue.id)}>
                  <ThemedText style={styles.btnText}>Mark Returned Now</ThemedText>
                </Pressable>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
