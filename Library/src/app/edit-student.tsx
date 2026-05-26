import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { confirmAsync } from '@/lib/confirm';

/** Flat route — avoids /student/[id] conflicts with register */
export default function EditStudentScreen() {
  const params = useLocalSearchParams<{ key?: string }>();
  const lookupKey = (Array.isArray(params.key) ? params.key[0] : params.key)?.trim() || '';
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
      btnDanger: {
        backgroundColor: '#b91c1c',
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        width: '100%',
      },
      btnText: { color: '#fff', fontWeight: '800' },
      back: {
        color: c.accent,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
      },
      banner: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.two,
      },
    }),
  );

  const [studentIdNo, setStudentIdNo] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const goTeacher = () => router.replace('/(tabs)/teacher');

  const load = useCallback(async () => {
    if (!token || !lookupKey) {
      setLoading(false);
      return;
    }
    try {
      const { student } = await api.getStudent(token, lookupKey);
      setStudentIdNo(student.studentId);
      setUserId(student.userId || student.studentUserId || '');
      setName(student.name);
      setMobile(student.mobile);
      setCourse(student.course);
      setYear(student.year);
      setDepartment(student.department);
    } catch (e) {
      fields.showMessage('_form', false, e instanceof Error ? e.message : 'Student not found');
      setTimeout(goTeacher, 2500);
    } finally {
      setLoading(false);
    }
  }, [token, lookupKey]);

  useEffect(() => {
    if (!lookupKey) {
      goTeacher();
      return;
    }
    if (isStaff && token) load();
  }, [isStaff, token, lookupKey, load]);

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
    required = true,
  ) => ({
    kind,
    value,
    onChangeText: set,
    feedback: fields.get(key),
    onBlur: () => fields.validateOnBlur(key, kind, value, { required }),
    onChangeValidate: (v: string) =>
      fields.validateOnChange(key, kind, v, { required }),
  });

  const onSave = async () => {
    if (!lookupKey || !studentIdNo) return;
    const checks: Parameters<typeof fields.validateAll>[0] = [
      { key: 'userId', kind: 'username', value: userId },
      { key: 'name', kind: 'name', value: name },
      { key: 'mobile', kind: 'mobile', value: mobile },
      { key: 'course', kind: 'course', value: course },
      { key: 'year', kind: 'year', value: year },
      { key: 'department', kind: 'department', value: department },
    ];
    if (password.trim()) {
      checks.push({ key: 'password', kind: 'passwordOptional', value: password });
    }
    if (!fields.validateAll(checks)) return;

    setSaving(true);
    fields.hide('_form');
    try {
      await api.updateStudent(token, lookupKey, {
        userId: userId.trim(),
        studentUserId: userId.trim(),
        name: name.trim(),
        mobile: mobile.trim(),
        course: course.trim(),
        year: year.trim(),
        department: department.trim(),
        ...(password ? { password } : {}),
      });
      fields.showMessage('_form', true, 'Student updated successfully');
      setTimeout(goTeacher, 2000);
    } catch (e) {
      fields.showMessage('_form', false, e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!lookupKey || !token) return;
    const ok = await confirmAsync(
      'Delete student?',
      `Remove ${name || 'student'} (ID No: ${studentIdNo})?`,
      { confirmLabel: 'Delete', destructive: true },
    );
    if (!ok) return;
    try {
      await api.deleteStudent(token, lookupKey);
      fields.showMessage('_form', true, 'Student removed');
      setTimeout(goTeacher, 2000);
    } catch (e) {
      fields.showMessage('_form', false, e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const formBanner = fields.get('_form');

  if (loading) {
    return (
      <ScrollView contentContainerStyle={FormStyles.pageCentered}>
        <ThemedText style={FormStyles.bodyText}>Loading student…</ThemedText>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={FormStyles.page}>
      <PageHeader
        badge="Update"
        title="Edit Student"
        subtitle={`User ID: ${userId} · ID No: ${studentIdNo}`}
      />

      <View style={FormStyles.card}>
        <FormField
          label="Student ID No"
          value={studentIdNo}
          onChangeText={() => {}}
          kind="studentId"
          editable={false}
        />
        <FormField
          label="Student User ID (login) *"
          placeholder="Unique login ID"
          autoCapitalize="characters"
          {...bind('userId', 'username', userId, setUserId)}
        />
        <FormField label="Full name *" placeholder="Required" {...bind('name', 'name', name, setName)} />
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
        <FormField
          label="New password"
          placeholder="Leave blank to keep current"
          secureTextEntry
          {...bind('password', 'passwordOptional', password, setPassword, false)}
        />

        <Pressable style={styles.btn} onPress={onSave} disabled={saving}>
          <ThemedText style={styles.btnText}>{saving ? 'Saving…' : 'Save Student Account'}</ThemedText>
        </Pressable>
        <Pressable style={styles.btnDanger} onPress={onDelete}>
          <ThemedText style={styles.btnText}>Delete Student</ThemedText>
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

      <Pressable onPress={goTeacher}>
        <ThemedText style={styles.back}>← Back to Teacher page</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
