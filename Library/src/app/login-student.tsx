// import { useRouter } from 'expo-router';
// import React, { useState } from 'react';
// import { Alert, Pressable, StyleSheet } from 'react-native';

// import { LoginForm } from '@/components/auth/login-form';
// import { PageHeader } from '@/components/library/page-header';
// import { ScreenShell } from '@/components/library/screen-shell';
// import { ThemedText } from '@/components/themed-text';
// import { useAuth } from '@/context/auth-context';
// import { Spacing } from '@/constants/theme';
// import { useThemedStyles } from '@/hooks/use-themed-styles';

// export default function StudentLoginScreen() {
//   const { loginStudent } = useAuth();
//   const router = useRouter();
//   const [userId, setUserId] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const styles = useThemedStyles((c) =>
//     StyleSheet.create({
//       back: {
//         color: c.accent,
//         fontWeight: '600',
//         textAlign: 'center',
//         marginTop: Spacing.four,
//       },
//     }),
//   );

//   const onLogin = async () => {
//     if (!userId.trim() || !password) {
//       Alert.alert('Error', 'Enter Student User ID and password');
//       return;
//     }
//     setLoading(true);
//     try {
//       await loginStudent(userId, password);
//       router.replace('/(tabs)/issued' as const);
//     } catch (e) {
//       Alert.alert('Login failed', e instanceof Error ? e.message : 'Try again');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScreenShell centered>
//       <PageHeader
//         badge="Student"
//         title="Student Login"
//         subtitle="Login with Student User ID and password from your teacher"
//       />

//       <LoginForm
//         fields={[
//           {
//             label: 'Student User ID',
//             value: userId,
//             onChangeText: setUserId,
//             placeholder: 'e.g. STU001',
//             autoCapitalize: 'characters',
//           },
//           {
//             label: 'Password',
//             value: password,
//             onChangeText: setPassword,
//             placeholder: 'Password',
//             secure: true,
//           },
//         ]}
//         onSubmit={onLogin}
//         loading={loading}
//         hint="Ask your teacher if you do not have login credentials yet"
//       />

//       <Pressable onPress={() => router.replace('/welcome')}>
//         <ThemedText style={styles.back}>← Back to role selection</ThemedText>
//       </Pressable>
//     </ScreenShell>
//   );
// }
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LoginForm } from '@/components/auth/login-form';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function StudentLoginScreen() {
  const { loginStudent } = useAuth();
  const router = useRouter();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      back: {
        color: c.accent,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.four,
      },

      errorBox: {
        backgroundColor: 'rgba(255,0,0,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,0,0,0.25)',
        padding: Spacing.three,
        borderRadius: 12,
        marginTop: Spacing.three,
      },

      errorText: {
        color: '#ff4d4f',
        fontWeight: '600',
        textAlign: 'center',
      },
    }),
  );

  const onLogin = async () => {
    setError('');

    if (!userId.trim() || !password) {
      setError('Enter Student User ID and password.');
      return;
    }

    setLoading(true);

    try {
      await loginStudent(userId, password);
      router.replace('/(tabs)/issued' as const);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell centered>
      <PageHeader
        badge="Student"
        title="Student Login"
        subtitle="Login with your Student User ID and password provided by your professor."
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
        hint="Contact your professor if you do not have login credentials yet."
      />

      {!!error && (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      <Pressable onPress={() => router.replace('/welcome')}>
        <ThemedText style={styles.back}>
          ← Back to role selection
        </ThemedText>
      </Pressable>
    </ScreenShell>
  );
}