import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form/form-field';
import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFieldFeedback } from '@/hooks/use-field-feedback';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api } from '@/services/api';

export default function RegisterStudentScreen() {
  const { token, isStaff } = useAuth();
  const router = useRouter();
  const { styles: FormStyles, colors } = useFormStyles();
  const fields = useFieldFeedback();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      btn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        marginTop: Spacing.two,
        width: '100%',
      },
      btnText: { color: '#fff', fontWeight: '800' },
      back: { color: c.accent, fontWeight: '600', textAlign: 'center', width: '100%' },
      banner: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.two,
      },
    }),
  );

  const [idNo, setIdNo] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isStaff || !token) {
    return (
      <ScrollView contentContainerStyle={FormStyles.pageCentered}>
        <ThemedText style={FormStyles.bodyText}>Teacher login required</ThemedText>
        <Pressable style={styles.btn} onPress={() => router.replace('/login-teacher')}>
          <ThemedText style={styles.btnText}>Teacher Login</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const bind = (
    key: string,
    kind: Parameters<typeof fields.validateOnBlur>[1],
    value: string,
    set: (v: string) => void,
  ) => ({
    kind,
    value,
    onChangeText: set,
    feedback: fields.get(key),
    onBlur: () => fields.validateOnBlur(key, kind, value, { required: true }),
    onChangeValidate: (v: string) =>
      fields.validateOnChange(key, kind, v, { required: true }),
  });

  const onSubmit = async () => {
    const ok = fields.validateAll([
      { key: 'idNo', kind: 'studentId', value: idNo },
      { key: 'userId', kind: 'username', value: userId },
      { key: 'password', kind: 'password', value: password },
      { key: 'name', kind: 'name', value: name },
      { key: 'mobile', kind: 'mobile', value: mobile },
      { key: 'course', kind: 'course', value: course },
      { key: 'year', kind: 'year', value: year },
      { key: 'department', kind: 'department', value: department },
    ]);
    if (!ok) return;

    setLoading(true);
    fields.hide('_form');
    try {
      await api.createStudent(token, {
        studentId: idNo.trim(),
        userId: userId.trim(),
        studentUserId: userId.trim(),
        password,
        name: name.trim(),
        mobile: mobile.trim(),
        course: course.trim(),
        year: year.trim(),
        department: department.trim(),
      });
      fields.showMessage(
        '_form',
        true,
        `Student registered — User ID: ${userId.toUpperCase()}`,
      );
      setTimeout(() => router.replace('/(tabs)/teacher'), 2000);
    } catch (e) {
      fields.showMessage('_form', false, e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const formBanner = fields.get('_form');

  return (
    <ScrollView contentContainerStyle={FormStyles.page}>
      <PageHeader
        badge="Teacher"
        title="Register Student"
        subtitle="Unique: Student ID No · User ID · Mobile No"
      />

      <View style={FormStyles.card}>
        <FormField
          label="Student ID No *"
          placeholder="e.g. 2024AG001"
          autoCapitalize="characters"
          {...bind('idNo', 'studentId', idNo, setIdNo)}
        />
        <FormField
          label="Student User ID * (for login)"
          placeholder="e.g. STU001"
          autoCapitalize="characters"
          {...bind('userId', 'username', userId, setUserId)}
        />
        <FormField
          label="Password *"
          placeholder="Login password"
          secureTextEntry
          {...bind('password', 'password', password, setPassword)}
        />
        <FormField label="Full name *" placeholder="Student name" {...bind('name', 'name', name, setName)} />
        <FormField
          label="Mobile No *"
          placeholder="10-digit mobile"
          keyboardType="phone-pad"
          {...bind('mobile', 'mobile', mobile, setMobile)}
        />
        <FormField label="Course *" placeholder="e.g. B.Tech" {...bind('course', 'course', course, setCourse)} />
        <FormField label="Grade / Year *" placeholder="e.g. 1, 2, 3" {...bind('year', 'year', year, setYear)} />
        <FormField
          label="Department *"
          placeholder="e.g. CSE"
          autoCapitalize="characters"
          {...bind('department', 'department', department, setDepartment)}
        />

        <Pressable style={styles.btn} onPress={onSubmit} disabled={loading}>
          <ThemedText style={styles.btnText}>
            {loading ? 'Saving…' : 'Create Student Account'}
          </ThemedText>
        </Pressable>

        {formBanner?.message ? (
          <ThemedText
            style={[
              styles.banner,
              { color: formBanner.valid ? colors.success : colors.danger },
            ]}>
            {formBanner.message}
          </ThemedText>
        ) : null}
      </View>

      <Pressable onPress={() => router.replace('/(tabs)/teacher')}>
        <ThemedText style={styles.back}>← Back to Teacher page</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
