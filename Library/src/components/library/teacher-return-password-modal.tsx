import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { cardBorder, libraryElevation, webTextInputProps, webTypography } from '@/lib/platform-styles';
import { focusWebTextInput, restoreWebPointerEvents } from '@/lib/web-focus';

type TeacherReturnPasswordModalProps = {
  visible: boolean;
  bookTitle?: string;
  title?: string;
  subtitle?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (password: string) => void | Promise<void>;
};

export function TeacherReturnPasswordModal({
  visible,
  bookTitle,
  title = 'Confirm book return',
  subtitle = 'Enter your password before marking the book as returned — only then will the book appear back in the library.',
  confirmLabel = 'Confirm return',
  onCancel,
  onConfirm,
}: TeacherReturnPasswordModalProps) {
  const colors = useLibraryColors();
  const inputRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      sub: { fontSize: 14, color: c.inkMuted, lineHeight: 20 },
      book: { fontSize: 15, fontWeight: '700', color: c.ink },
      input: {
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: Radius.md,
        padding: Spacing.three,
        fontSize: 15,
        color: c.inputText,
        backgroundColor: c.inputBg,
        ...webTypography,
      },
      row: { flexDirection: 'row', gap: Spacing.two },
      btn: {
        flex: 1,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
      },
      cancelBtn: { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
      confirmBtn: { backgroundColor: c.success },
      cancelText: { fontWeight: '700', color: c.ink },
      confirmText: { color: '#fff', fontWeight: '800' },
    }),
  );

  useEffect(() => {
    if (visible) {
      setPassword('');
      setSubmitting(false);
      restoreWebPointerEvents();
      return focusWebTextInput(inputRef);
    }
    restoreWebPointerEvents();
  }, [visible]);

  const cancel = () => {
    restoreWebPointerEvents();
    onCancel();
  };

  const submit = async () => {
    if (!password.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(password);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={cancel}
      onDismiss={restoreWebPointerEvents}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable
          style={styles.backdrop}
          onPress={cancel}
          accessibilityRole="button"
        />
        <View style={styles.card} pointerEvents="auto">
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.sub}>{subtitle}</ThemedText>
          {bookTitle ? (
            <ThemedText style={styles.book} numberOfLines={2}>
              {bookTitle}
            </ThemedText>
          ) : null}
          <TextInput
            ref={inputRef}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
            onSubmitEditing={() => void submit()}
            autoFocus={Platform.OS !== 'web'}
            {...webTextInputProps}
          />
          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.cancelBtn]}
              onPress={cancel}
              disabled={submitting}>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => void submit()}
              disabled={submitting || !password.trim()}>
              <ThemedText style={styles.confirmText}>
                {submitting ? 'Checking…' : confirmLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
