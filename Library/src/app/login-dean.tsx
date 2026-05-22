// import { useRouter } from 'expo-router';
// import React, { useState } from 'react';
// import { Pressable, StyleSheet } from 'react-native';

// import { LoginForm } from '@/components/auth/login-form';
// import { PageHeader } from '@/components/library/page-header';
// import { ScreenShell } from '@/components/library/screen-shell';
// import { ThemedText } from '@/components/themed-text';
// import { useAuth } from '@/context/auth-context';
// import { Spacing } from '@/constants/theme';
// import { useThemedStyles } from '@/hooks/use-themed-styles';
// import { showAlert } from '@/lib/show-alert';

// export default function LoginDeanScreen() {
//   const { loginDean } = useAuth();
//   const router = useRouter();
//   const [deanId, setDeanId] = useState('');
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
//     if (!deanId.trim() || !password) {
//       showAlert('Error', 'Enter the Dean ID and password.');
//       return;
//     }
//     setLoading(true);
//     try {
//       await loginDean(deanId, password);
//       router.replace('/(tabs)/dean' as const);
//     } catch (e) {
//       showAlert('Login failed', e instanceof Error ? e.message : 'Try again');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScreenShell centered>
//       <PageHeader
//         badge="Dean"
//         title="Dean Login"
//         subtitle="Create professor accounts with full access to manage the entire library system."
//       />

//       <LoginForm
//         fields={[
//           {
//             label: 'Dean ID',
//             value: deanId,
//             onChangeText: setDeanId,
//             placeholder: 'e.g. DEAN01',
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
//         hint="Default: DEAN01 / dean123"
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

export default function LoginDeanScreen() {
  const { loginDean } = useAuth();
  const router = useRouter();

  const [deanId, setDeanId] = useState('');
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

    if (!deanId.trim() || !password) {
      setError('Enter the Dean ID and password.');
      return;
    }

    setLoading(true);

    try {
      await loginDean(deanId, password);
      router.replace('/(tabs)/dean' as const);
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
        badge="Dean"
        title="Dean Login"
        subtitle="Create professor accounts with full access to manage the entire library system."
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
        // hint="Default: DEAN01 / dean123"
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