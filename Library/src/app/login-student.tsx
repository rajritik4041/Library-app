import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { LoginForm } from '@/components/auth/login-form';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, Spacing } from '@/constants/theme';

export default function StudentLoginScreen() {
  const { loginStudent } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!userId.trim() || !password) {
      Alert.alert('Error', 'Enter Student User ID and password');
      return;
    }
    setLoading(true);
    try {
      await loginStudent(userId, password);
      router.replace('/(tabs)/issued');
    } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <PageHeader
        badge="Student"
        title="Student Login"
        subtitle="Login with Student User ID and password from your teacher"
      />

      <LoginForm
        fields={[
          {
            label: 'Student User ID',
            value: userId,
            onChangeText: setUserId,
            placeholder: 'e.g. STU001',
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
        hint="Ask your teacher if you do not have login credentials yet"
      />

      <Pressable onPress={() => router.replace('/welcome')}>
        <ThemedText style={styles.back}>← Back to role selection</ThemedText>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  back: {
    color: LibraryColors.accent,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
