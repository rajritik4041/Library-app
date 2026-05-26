import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import {
  dismissAppDialog,
  subscribeAppDialog,
  type DialogRequest,
} from '@/lib/app-dialog-queue';
import { cardBorder, libraryElevation } from '@/lib/platform-styles';
import { restoreWebPointerEvents } from '@/lib/web-focus';

export function AppDialogHost() {
  const [current, setCurrent] = useState<DialogRequest | null>(null);

  useEffect(() => subscribeAppDialog(setCurrent), []);

  useEffect(() => {
    if (current) restoreWebPointerEvents();
  }, [current]);

  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: Spacing.four,
      },
      backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
      },
      card: {
        backgroundColor: c.card,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        gap: Spacing.three,
        ...cardBorder(c.border),
        ...libraryElevation(c.shadow, 'modal'),
        maxWidth: 420,
        width: '100%',
        alignSelf: 'center',
        zIndex: 1,
      },
      title: { fontSize: 18, fontWeight: '800', color: c.ink },
      message: { fontSize: 14, color: c.inkMuted, lineHeight: 20 },
      row: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
      btn: {
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.md,
        minWidth: 88,
        alignItems: 'center',
      },
      cancelBtn: { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
      okBtn: { backgroundColor: c.accent },
      dangerBtn: { backgroundColor: '#b91c1c' },
      cancelText: { fontWeight: '700', color: c.ink },
      okText: { color: '#fff', fontWeight: '800' },
    }),
  );

  if (!current) return null;

  const close = (result?: boolean) => {
    restoreWebPointerEvents();
    dismissAppDialog(current.id, result);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => close(current.kind === 'confirm' ? false : undefined)}
      onDismiss={restoreWebPointerEvents}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable
          style={styles.backdrop}
          onPress={() => close(current.kind === 'confirm' ? false : undefined)}
          accessibilityRole="button"
        />
        <View style={styles.card} pointerEvents="auto">
          <ThemedText style={styles.title}>{current.title}</ThemedText>
          {current.message ? (
            <ThemedText style={styles.message}>{current.message}</ThemedText>
          ) : null}
          <View style={styles.row}>
            {current.kind === 'confirm' ? (
              <Pressable
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => close(false)}
                accessibilityRole="button">
                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              style={[
                styles.btn,
                current.kind === 'confirm' && current.destructive
                  ? styles.dangerBtn
                  : styles.okBtn,
              ]}
              onPress={() => close(current.kind === 'confirm' ? true : undefined)}
              accessibilityRole="button">
              <ThemedText style={styles.okText}>
                {current.kind === 'confirm' ? current.confirmLabel : 'OK'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
