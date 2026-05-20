import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api } from '@/services/api';
import { confirmAsync } from '@/lib/confirm';

/** Flat route — avoids /student/[id] conflicts with register */
export default function EditStudentScreen() {
  const params = useLocalSearchParams<{ key?: string }>();
  const lookupKey = (Array.isArray(params.key) ? params.key[0] : params.key)?.trim() || '';
  const { token, isTeacher } = useAuth();
  const router = useRouter();
  const { styles: FormStyles, colors: FormColors } = useFormStyles();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      fieldWrap: { width: '100%' },
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
      Alert.alert('Error', e instanceof Error ? e.message : 'Student not found');
      goTeacher();
    } finally {
      setLoading(false);
    }
  }, [token, lookupKey]);

  useEffect(() => {
    if (!lookupKey) {
      Alert.alert('Error', 'No student selected');
      goTeacher();
      return;
    }
    if (isTeacher && token) load();
  }, [isTeacher, token, lookupKey, load]);

  if (!isTeacher || !token) {
    return (
      <ScrollView contentContainerStyle={FormStyles.pageCentered}>
        <ThemedText style={FormStyles.bodyText}>Teacher login required</ThemedText>
        <Pressable style={styles.btn} onPress={() => router.replace('/login-teacher')}>
          <ThemedText style={styles.btnText}>Teacher Login</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const onSave = async () => {
    if (!lookupKey || !studentIdNo) return;
    if (
      !userId.trim() ||
      !name.trim() ||
      !mobile.trim() ||
      !course.trim() ||
      !year.trim() ||
      !department.trim()
    ) {
      Alert.alert('Error', 'Name, User ID, mobile, course, grade, and department are required');
      return;
    }
    setSaving(true);
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
      Alert.alert('Saved', 'Student updated successfully', [{ text: 'OK', onPress: goTeacher }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
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
      Alert.alert('Deleted', 'Student removed', [{ text: 'OK', onPress: goTeacher }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder: string,
    opts?: { secure?: boolean; caps?: boolean; phone?: boolean; editable?: boolean },
  ) => (
    <View key={label} style={styles.fieldWrap}>
      <ThemedText style={FormStyles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        editable={opts?.editable !== false}
        secureTextEntry={opts?.secure}
        autoCapitalize={opts?.caps ? 'characters' : 'none'}
        keyboardType={opts?.phone ? 'phone-pad' : 'default'}
        placeholderTextColor={FormColors.inputPlaceholder}
        style={[FormStyles.input, opts?.editable === false && FormStyles.inputDisabled]}
      />
    </View>
  );

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
        {field('Student ID No', studentIdNo, () => {}, studentIdNo, { editable: false })}
        {field('Student User ID (login) *', userId, setUserId, 'Unique login ID', { caps: true })}
        {field('Full name *', name, setName, 'Required')}
        {field('Mobile No *', mobile, setMobile, '10-digit mobile', { phone: true })}
        {field('Course *', course, setCourse, 'e.g. B.Tech')}
        {field('Grade / Year *', year, setYear, 'e.g. 1, 2, 3')}
        {field('Department *', department, setDepartment, 'e.g. CSE')}
        {field('New password', password, setPassword, 'Leave blank to keep current', { secure: true })}

        <Pressable style={styles.btn} onPress={onSave} disabled={saving}>
          <ThemedText style={styles.btnText}>{saving ? 'Saving…' : 'Save Student Account'}</ThemedText>
        </Pressable>
        <Pressable style={styles.btnDanger} onPress={onDelete}>
          <ThemedText style={styles.btnText}>Delete Student</ThemedText>
        </Pressable>
      </View>

      <Pressable onPress={goTeacher}>
        <ThemedText style={styles.back}>← Back to Teacher page</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
