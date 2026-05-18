import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!teacherId.trim() || !password) {
      Alert.alert('Error', 'Teacher ID aur password daalein');
      return;
    }
    setLoading(true);
    try {
      await login(teacherId, password);
      router.replace('/teacher');
    } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <PageHeader
        badge="Teacher"
        title="Teacher Login"
        subtitle="Sir apni Teacher ID se login karein — book issue/return aur manage karein"
      />

      <View style={styles.card}>
        <ThemedText style={styles.label}>Teacher ID</ThemedText>
        <TextInput
          value={teacherId}
          onChangeText={setTeacherId}
          placeholder="e.g. T001"
          autoCapitalize="characters"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />

        <ThemedText style={styles.label}>Password</ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />

        <Pressable style={styles.btn} onPress={onLogin} disabled={loading}>
          <ThemedText style={styles.btnText}>{loading ? 'Logging in…' : 'Login'}</ThemedText>
        </Pressable>

        <ThemedText themeColor="textSecondary" style={styles.hint}>
          Default: Teacher ID T001 · Password teacher123
        </ThemedText>
      </View>

      <Pressable onPress={() => router.back()}>
        <ThemedText style={styles.back}>← Back</ThemedText>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LibraryColors.card,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: LibraryColors.border,
  },
  label: {
    fontWeight: '700',
    color: LibraryColors.navy,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: LibraryColors.border,
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 16,
    backgroundColor: LibraryColors.surface,
    outlineStyle: 'none',
  } as object,
  btn: {
    backgroundColor: LibraryColors.navy,
    padding: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
  back: {
    color: LibraryColors.accent,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
