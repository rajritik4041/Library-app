import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form/form-field';
import { PageHeader } from '@/components/library/page-header';
import { ScreenShell } from '@/components/library/screen-shell';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';

export default function StudentSignupScreen() {
  const router = useRouter();
  const { signupStudent } = useAuth();
  const { styles: FormStyles, colors } = useFormStyles();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [branch, setBranch] = useState('B. Tech');
  const [year, setYear] = useState('1');
  const [department, setDepartment] = useState('CSE');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      container: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingVertical: Spacing.four,
      },
      submitBtn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.four,
        minHeight: 48,
      },
      submitBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
      },
      errorBanner: {
        backgroundColor: '#fee2e2',
        borderColor: '#f87171',
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.three,
        marginBottom: Spacing.three,
      },
      errorText: {
        color: '#b91c1c',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
      },
      successBanner: {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.three,
        marginBottom: Spacing.three,
      },
      successText: {
        color: '#15803d',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
      },
      loginLink: {
        marginTop: Spacing.four,
        alignItems: 'center',
        padding: Spacing.two,
      },
      loginLinkText: {
        color: c.accent,
        fontWeight: '700',
        fontSize: 14,
      },
      backText: {
        color: c.inkMuted,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.two,
        fontSize: 13,
      },
    }),
  );

  const onSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !username.trim() || !studentId.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields (Name, Username, Roll No, Email, Password).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await signupStudent({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        id: studentId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        password,
        mobile: mobile.trim(),
        branch: branch.trim(),
        course: branch.trim(),
        year: year.trim(),
        department: department.trim(),
      });

      if (res?.success) {
        setSuccessMessage('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          router.replace('/(tabs)/issued' as const);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell scroll centered>
      <View style={styles.container}>
        <PageHeader
          badge="MCAET Portal"
          title="Student Sign Up"
          subtitle="Register your account for MCAET Library and Examination access"
        />

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successBanner}>
            <ThemedText style={styles.successText}>{successMessage}</ThemedText>
          </View>
        ) : null}

        <FormField
          kind="name"
          label="Full Name *"
          placeholder="e.g. Mukesh Kumar"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <FormField
          kind="studentId"
          label="Student Roll No / ID *"
          placeholder="e.g. E-15709/24"
          value={studentId}
          onChangeText={setStudentId}
          autoCapitalize="characters"
        />

        <FormField
          kind="username"
          label="Username *"
          placeholder="e.g. mukesh_93"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <FormField
          kind="text"
          label="Email Address *"
          placeholder="e.g. student@gmail.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <FormField
          kind="mobile"
          label="Mobile Number"
          placeholder="e.g. 9876543210"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
        />

        <FormField
          kind="course"
          label="Branch / Degree"
          placeholder="e.g. B. Tech / M. Tech"
          value={branch}
          onChangeText={setBranch}
        />

        <FormField
          kind="year"
          label="Year"
          placeholder="1, 2, 3, or 4"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
        />

        <FormField
          kind="department"
          label="Department"
          placeholder="e.g. CSE / Mechanical"
          value={department}
          onChangeText={setDepartment}
        />

        <FormField
          kind="password"
          label="Password *"
          placeholder="Create password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <FormField
          kind="password"
          label="Confirm Password *"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Pressable
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitBtnText}>Complete Registration</ThemedText>
          )}
        </Pressable>

        <Pressable style={styles.loginLink} onPress={() => router.replace('/login-student')}>
          <ThemedText style={styles.loginLinkText}>
            Already registered? Log in with your credentials →
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => router.replace('/welcome')}>
          <ThemedText style={styles.backText}>← Back to role selection</ThemedText>
        </Pressable>
      </View>
    </ScreenShell>
  );
}
