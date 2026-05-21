import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { LoginForm } from '@/components/auth/login-form';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { showAlert } from '@/lib/show-alert';

export default function LoginDeanScreen() {
  const { loginDean } = useAuth();
  const router = useRouter();
  const [deanId, setDeanId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      back: {
        color: c.accent,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.four,
      },
    }),
  );

  const onLogin = async () => {
    if (!deanId.trim() || !password) {
      showAlert('Error', 'Dean ID aur password daalein');
      return;
    }
    setLoading(true);
    try {
      await loginDean(deanId, password);
      router.replace('/(tabs)/dean' as const);
    } catch (e) {
      showAlert('Login failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell centered>
      <PageHeader
        badge="Dean"
        title="Dean Login"
        subtitle="Teacher accounts create karein — poori library par full access"
      />

      <LoginForm
        fields={[
          {
            label: 'Dean ID',
            value: deanId,
            onChangeText: setDeanId,
            placeholder: 'e.g. DEAN01',
            autoCapitalize: 'characters',
          },
          {
            label: 'Password',
            value: password,
            onChangeText: setPassword,
            placeholder: 'Password',
            secure: true,
          },
        ]}
        onSubmit={onLogin}
        loading={loading}
        hint="Default: DEAN01 / dean123"
      />

      <Pressable onPress={() => router.replace('/welcome')}>
        <ThemedText style={styles.back}>← Back to role selection</ThemedText>
      </Pressable>
    </ScreenShell>
  );
}
