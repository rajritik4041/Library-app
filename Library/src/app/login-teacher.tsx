import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { LoginForm } from '@/components/auth/login-form';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { LibraryColors, Spacing } from '@/constants/theme';

export default function TeacherLoginScreen() {
  const { loginTeacher } = useAuth();
  const router = useRouter();
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!teacherId.trim() || !password) {
      Alert.alert('Error', 'Enter Teacher ID and password');
      return;
    }
    setLoading(true);
    try {
      await loginTeacher(teacherId, password);
      router.replace('/(tabs)/teacher' as const);
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
        subtitle="Sign in to manage books, register students, and handle issue/return"
      />

      <LoginForm
        fields={[
          {
            label: 'Teacher ID',
            value: teacherId,
            onChangeText: setTeacherId,
            placeholder: 'e.g. T001',
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
        hint="Default: T001 / teacher123"
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
