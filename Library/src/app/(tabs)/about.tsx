import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DetailRow } from '@/components/library/detail-row';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { LibraryColors, Spacing } from '@/constants/theme';

const RULES = [
  'Library card is mandatory for book issue.',
  'Maximum 2 books per student for 14 days.',
  'Late return fine: ₹2 per day per book.',
  'Maintain silence in the reading hall.',
  'Report lost or damaged books to the librarian immediately.',
];

const TIMINGS = [
  { day: 'Monday – Friday', time: '9:00 AM – 5:00 PM' },
  { day: 'Saturday', time: '9:00 AM – 1:00 PM' },
  { day: 'Sunday & Holidays', time: 'Closed' },
];

export default function AboutScreen() {
  return (
    <ScreenShell>
      <PageHeader
        badge="About"
        title="EJ MCAET Library"
        subtitle="Engineering college library management — digital catalog for the entire campus."
      />

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>About the Library</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.paragraph}>
          The EJ MCAET College Central Library supports undergraduate and postgraduate programs in
          engineering. Our collection includes core textbooks in FMPE, Mechanical Engineering, CSE,
          SWCE, and related disciplines — all catalogued digitally for easy access.
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Library Timings</ThemedText>
        {TIMINGS.map((row) => (
          <DetailRow key={row.day} label={row.day} value={row.time} />
        ))}
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Contact</ThemedText>
        <DetailRow label="Institution" value="EJ MCAET College" />
        <DetailRow label="Librarian" value="Contact college administration office" />
        <DetailRow label="Email" value="library@ejmcaet.edu.in" />
        <DetailRow label="Phone" value="+91-XXXX-XXXXXX" />
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
        © {new Date().getFullYear()} EJ MCAET College Library · Catalog v1.0
      </ThemedText>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LibraryColors.card,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: LibraryColors.border,
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LibraryColors.navy,
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
    color: LibraryColors.accent,
    width: 20,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: LibraryColors.navy,
    lineHeight: 22,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: LibraryColors.muted,
    paddingBottom: Spacing.five,
  },
});
