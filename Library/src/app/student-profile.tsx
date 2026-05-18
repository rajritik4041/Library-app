import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { FormColors, FormStyles } from '@/constants/form-styles';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';
import { api } from '@/services/api';

export default function StudentProfileScreen() {
  const { token, isStudent, student, updateStudentSession } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(student?.name ?? '');
  const [mobile, setMobile] = useState(student?.mobile ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isStudent || !token || !student) {
    return (
      <ScrollView contentContainerStyle={styles.centered}>
        <ThemedText>Student login required</ThemedText>
        <Pressable style={styles.btn} onPress={() => router.replace('/login-student')}>
          <ThemedText style={styles.btnText}>Student Login</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  const onSave = async () => {
    setLoading(true);
    try {
      const { student: updated } = await api.updateMyProfile(token, {
        name: name.trim(),
        mobile: mobile.trim(),
        ...(password ? { password } : {}),
      });
      await updateStudentSession(updated);
      setPassword('');
      Alert.alert('Saved', 'Your profile has been updated');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={FormStyles.page}>
      <PageHeader
        badge="Profile"
        title="Update My Details"
        subtitle={`User ID: ${student.userId} · ID No: ${student.studentId}`}
      />

      <View style={styles.infoCard}>
        <ThemedText style={styles.infoLine}>Course: {student.course}</ThemedText>
        <ThemedText style={styles.infoLine}>Year: {student.year}</ThemedText>
        <ThemedText style={styles.infoLine}>Department: {student.department}</ThemedText>
        <ThemedText style={styles.infoHint}>
          Course, year, and department can only be changed by your teacher.
        </ThemedText>
      </View>

      <View style={styles.card}>
        <ThemedText style={FormStyles.label}>Full name</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          style={FormStyles.input}
          placeholderTextColor={FormColors.placeholder}
        />
        <ThemedText style={FormStyles.label}>Mobile number</ThemedText>
        <TextInput
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          style={FormStyles.input}
          placeholderTextColor={FormColors.placeholder}
        />
        <ThemedText style={FormStyles.label}>New password</ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Leave blank to keep current"
          placeholderTextColor={FormColors.placeholder}
          style={FormStyles.input}
        />
        <Pressable style={styles.btn} onPress={onSave} disabled={loading}>
          <ThemedText style={styles.btnText}>{loading ? 'Saving…' : 'Save'}</ThemedText>
        </Pressable>
      </View>

      <Pressable onPress={() => router.back()}>
        <ThemedText style={styles.back}>← Back</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 80,
  },
  centered: { flexGrow: 1, padding: Spacing.four, justifyContent: 'center', gap: Spacing.three },
  infoCard: {
    backgroundColor: LibraryColors.accentSoft,
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: 4,
  },
  infoLine: { fontSize: 14, color: LibraryColors.navy, fontWeight: '600' },
  infoHint: { fontSize: 12, color: LibraryColors.muted, marginTop: Spacing.one },
  card: {
    backgroundColor: LibraryColors.card,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: LibraryColors.border,
  },
  label: { fontWeight: '700', color: LibraryColors.navy, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: LibraryColors.border,
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 15,
    backgroundColor: LibraryColors.surface,
    outlineStyle: 'none',
  } as object,
  btn: {
    backgroundColor: LibraryColors.navy,
    padding: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  btnText: { color: '#fff', fontWeight: '800' },
  back: { color: LibraryColors.accent, fontWeight: '600', textAlign: 'center' },
});
