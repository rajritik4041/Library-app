import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLibraryColors } from '@/hooks/use-library-colors';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { cardBorder, libraryElevation, webTypography } from '@/lib/platform-styles';

type TeacherReturnPasswordModalProps = {
  visible: boolean;
  bookTitle?: string;
  onCancel: () => void;
  onConfirm: (password: string) => void | Promise<void>;
};

export function TeacherReturnPasswordModal({
  visible,
  bookTitle,
  onCancel,
  onConfirm,
}: TeacherReturnPasswordModalProps) {
  const colors = useLibraryColors();
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
    }
  }, [visible]);

  const submit = async () => {
    if (!password.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ThemedText style={styles.title}>Confirm book return</ThemedText>
          <ThemedText style={styles.sub}>
            Return mark karne se pehle apna teacher password daalein — tab hi book library mein
            wapas dikhegi.
          </ThemedText>
          {bookTitle ? (
            <ThemedText style={styles.book} numberOfLines={2}>
              {bookTitle}
            </ThemedText>
          ) : null}
          <TextInput
            placeholder="Teacher password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.input}
            onSubmitEditing={() => void submit()}
          />
          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              disabled={submitting}>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => void submit()}
              disabled={submitting || !password.trim()}>
              <ThemedText style={styles.confirmText}>
                {submitting ? 'Checking…' : 'Confirm return'}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
