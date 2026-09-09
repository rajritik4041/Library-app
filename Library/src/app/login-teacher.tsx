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

// export default function TeacherLoginScreen() {
//   const { loginTeacher } = useAuth();
//   const router = useRouter();
//   const [teacherId, setTeacherId] = useState('');
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
//     if (!teacherId.trim() || !password) {
//       Alert.alert('Error', 'Enter Teacher ID and password');
//       return;
//     }
//     setLoading(true);
//     try {
//       await loginTeacher(teacherId, password);
//       router.replace('/(tabs)/teacher' as const);
//     } catch (e) {
//       Alert.alert('Login failed', e instanceof Error ? e.message : 'Try again');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScreenShell centered>
//       <PageHeader
//         badge="Teacher"
//         title="Teacher Login"
//         subtitle="Sign in to manage books, register students, and handle issue/return"
//       />

//       <LoginForm
//         fields={[
//           {
//             label: 'Teacher ID',
//             value: teacherId,
//             onChangeText: setTeacherId,
//             placeholder: 'e.g. T001',
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
//         // hint="Default: T001 / teacher123"
//       />

//       <Pressable onPress={() => router.replace('/welcome')}>
//         <ThemedText style={styles.back}>← Back to role selection</ThemedText>
//       </Pressable>
//     </ScreenShell>
//   );
// }
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

export default function TeacherLoginScreen() {
  const { loginTeacher } = useAuth();
  const router = useRouter();

  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
    setSubmitError('');
    setLoading(true);

    try {
      await loginTeacher(teacherId, password);
      router.replace('/(tabs)/teacher' as const);
    } catch (e) {
      setSubmitError(
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
        badge="MCAET Faculty"
        title="Professor Login"
        subtitle="Sign in with your MCAET Professor portal credentials (Email, Username, or ID)."
      />

      <LoginForm
        fields={[
          {
            key: 'teacherId',
            kind: 'username',
            label: 'Professor ID / Email / Username',
            value: teacherId,
            onChangeText: setTeacherId,
            placeholder: 'e.g. mcaetitteam or prof@mcaet.edu.in',
            autoCapitalize: 'none',
          },
          {
            key: 'password',
            kind: 'password',
            label: 'Password',
            value: password,
            onChangeText: setPassword,
            placeholder: 'Portal Password',
            secure: true,
          },
        ]}
        onSubmit={onLogin}
        loading={loading}
        submitError={submitError}
        hint="Sign in using your faculty credentials from the MCAET portal."
      />

      <Pressable onPress={() => router.replace('/welcome')}>
        <ThemedText style={styles.back}>
          ← Back to role selection
        </ThemedText>
      </Pressable>
    </ScreenShell>
  );
}