import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DetailRow } from '@/components/library/detail-row';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/config/api';
import { COLLEGE, LIBRARY_ABOUT } from '@/constants/college-branding';
import { useBooksApi } from '@/context/books-api-context';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

const RULES = [
  'Library card is mandatory for book issue.',
  'Maximum 5 books per student for 14 days.',
  'Late return fine: ₹10 per day per book.',
  'Maintain silence in the reading hall.',
  'Report lost or damaged books to the librarian immediately.',
];

const TIMINGS = [
  { day: 'Monday – Friday', time: '9:00 AM – 5:00 PM (IST)' },
  // { day: 'Saturday', time: '9:00 AM – 1:00 PM (IST)' },
  { day: 'Sunday & Holidays & Second Saturday', time: 'Closed' },
];

// const PLATFORMS = [
//   {
//     name: 'Android (APK)',
//     access: 'Mobile app · Expo / EAS build',
//     hours: 'Same library hours · catalog works offline with cache',
//   },
//   {
//     name: 'Windows (.exe)',
//     access: 'Desktop installer · `Library/release/`',
//     hours: 'Mon–Fri 9 AM–5 PM · Only second Sat off library (physical library)',
//   },
//   {
//     name: 'macOS (.dmg)',
//     access: 'Mac desktop app · GitHub Actions or Mac build',
//     hours: 'Same timings as Windows desktop · shared MongoDB catalog',
//   },
// ];

export default function AboutScreen() {
  const { stats, apiOnline, dataSource, refresh } = useBooksApi();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      card: {
        backgroundColor: c.card,
        borderRadius: Spacing.three,
        padding: Spacing.four,
        borderWidth: 1,
        borderColor: c.border,
        gap: Spacing.two,
      },
      cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.ink,
      },
      paragraph: {
        fontSize: 15,
        lineHeight: 24,
      },
      rules: {
        gap: Spacing.two,
      },
      ruleRow: {
        flexDirection: 'row',
        gap: Spacing.two,
      },
      ruleNum: {
        fontWeight: '700',
        color: c.accent,
        width: 20,
      },
      ruleText: {
        flex: 1,
        fontSize: 14,
        color: c.ink,
        lineHeight: 22,
      },
      footer: {
        textAlign: 'center',
        fontSize: 12,
        color: c.inkMuted,
        paddingBottom: Spacing.five,
      },
      refreshBtn: {
        marginTop: Spacing.two,
        alignSelf: 'flex-start',
      },
      refreshText: {
        color: c.accent,
        fontWeight: '700',
        fontSize: 14,
      },
    }),
  );

  return (
    <ScreenShell>
      <PageHeader
        // badge={apiOnline ? 'MongoDB' : 'Offline'}
        title={COLLEGE.libraryName}
        subtitle={`${COLLEGE.shortName} — agricultural engineering college library with live catalog.`}
      />

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Live catalog
           {/* (MongoDB) */}
           </ThemedText>
        <DetailRow label="Data source" value={dataSource === 'mongodb' ? 'Database' : 'Offline cache'} />
        {/* <DetailRow label="API server" value={API_URL} /> */}
        <DetailRow
          label="Sync"
          value={
            apiOnline
              ? 'Live — add/delete ~12 sec par sab devices par'
              : 'Offline — internet / server check karein'
          }
        />
        <DetailRow label="Book titles" value={String(stats.totalTitles)} />
        <DetailRow label="Total copies" value={String(stats.totalCopies)} />
        <DetailRow label="Available now" value={String(stats.availableCopies)} />
        <DetailRow label="Currently issued" value={String(stats.activeIssues)} />
        <Pressable onPress={refresh} style={styles.refreshBtn}>
          <ThemedText style={styles.refreshText}>↻ Refresh from server</ThemedText>
        </Pressable>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>About the Library</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          {LIBRARY_ABOUT}
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Library Timings</ThemedText>
        {TIMINGS.map((row) => (
          <DetailRow key={row.day} label={row.day} value={row.time} />
        ))}
      </View>

      {/* <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>App on Android, Windows & Mac</ThemedText>
        {PLATFORMS.map((row) => (
          <View key={row.name} style={{ gap: 4, marginBottom: 8 }}>
            <DetailRow label={row.name} value={row.access} />
            <DetailRow label="Hours / notes" value={row.hours} />
          </View>
        ))}
      </View> */}

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Contact</ThemedText>
        <DetailRow label="Institution" value={COLLEGE.fullName} />
        <DetailRow label="Dean" value={COLLEGE.dean} />
        <DetailRow label="Email" value={COLLEGE.email} />
        <DetailRow label="Phone" value={COLLEGE.phone} />
        <DetailRow label="Website" value={COLLEGE.websiteDisplay} />
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Library Rules</ThemedText>
        <View style={styles.rules}>
          {RULES.map((rule, index) => (
            <View key={rule} style={styles.ruleRow}>
              <ThemedText style={styles.ruleNum}>{index + 1}.</ThemedText>
              <ThemedText style={styles.ruleText}>{rule}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      <ThemedText style={styles.footer}>
        © {new Date().getFullYear()} {COLLEGE.shortName}  Library · {COLLEGE.websiteDisplay}
      </ThemedText>
    </ScreenShell>
  );
}
