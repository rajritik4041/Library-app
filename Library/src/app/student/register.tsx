import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { api } from '@/services/api';

export default function RegisterStudentScreen() {
  const { token, isStaff } = useAuth();
  const router = useRouter();
  const { styles: FormStyles, colors: FormColors } = useFormStyles();
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

  const onSubmit = async () => {
    if (
      !idNo.trim() ||
      !userId.trim() ||
      !password ||
      !name.trim() ||
      !mobile.trim() ||
      !course.trim() ||
      !year.trim() ||
      !department.trim()
    ) {
      Alert.alert('Error', 'Fill all fields (ID No, User ID, password, name, mobile, course, grade)');
      return;
    }
    setLoading(true);
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
      Alert.alert('Success', `Student registered.\nUser ID: ${userId.toUpperCase()}`, [
        { text: 'OK', onPress: () => router.replace('/(tabs)/teacher') },
      ]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder: string,
    opts?: { secure?: boolean; caps?: boolean; phone?: boolean },
  ) => (
    <View key={label}>
      <ThemedText style={FormStyles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        secureTextEntry={opts?.secure}
        autoCapitalize={opts?.caps ? 'characters' : 'none'}
        keyboardType={opts?.phone ? 'phone-pad' : 'default'}
        placeholderTextColor={FormColors.inputPlaceholder}
        style={FormStyles.input}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={FormStyles.page}>
      <PageHeader
        badge="Teacher"
        title="Register Student"
        subtitle="Unique: Student ID No · User ID · Mobile No"
      />

      <View style={FormStyles.card}>
        {field('Student ID No *', idNo, setIdNo, 'e.g. 2024AG001', { caps: true })}
        {field('Student User ID * (for login)', userId, setUserId, 'e.g. STU001', { caps: true })}
        {field('Password *', password, setPassword, 'Login password', { secure: true })}
        {field('Full name *', name, setName, 'Student name')}
        {field('Mobile No *', mobile, setMobile, '10-digit mobile', { phone: true })}
        {field('Course *', course, setCourse, 'e.g. B.Tech')}
        {field('Grade / Year *', year, setYear, 'e.g. 1, 2, 3')}
        {field('Department *', department, setDepartment, 'e.g. CSE')}

        <Pressable style={styles.btn} onPress={onSubmit} disabled={loading}>
          <ThemedText style={styles.btnText}>
            {loading ? 'Saving…' : 'Create Student Account'}
          </ThemedText>
        </Pressable>
      </View>

      <Pressable onPress={() => router.replace('/(tabs)/teacher')}>
        <ThemedText style={styles.back}>← Back to Teacher page</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
