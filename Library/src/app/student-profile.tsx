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

export default function StudentProfileScreen() {
  const { token, isStudent, student, updateStudentSession } = useAuth();
  const router = useRouter();
  const { styles: FormStyles, colors } = useFormStyles();
  const fields = useFieldFeedback();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      centered: { flexGrow: 1, padding: Spacing.four, justifyContent: 'center', gap: Spacing.three },
      infoCard: {
        backgroundColor: c.accentSoft,
        padding: Spacing.three,
        borderRadius: Radius.md,
        gap: 4,
      },
      infoLine: { fontSize: 14, color: c.ink, fontWeight: '600' },
      infoHint: { fontSize: 12, color: c.inkMuted, marginTop: Spacing.one },
      card: {
        backgroundColor: c.card,
        padding: Spacing.four,
        borderRadius: Radius.lg,
        gap: Spacing.two,
        borderWidth: 1,
        borderColor: c.border,
      },
      btn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        marginTop: Spacing.two,
      },
      btnText: { color: '#fff', fontWeight: '800' },
      back: { color: c.accent, fontWeight: '600', textAlign: 'center' },
      banner: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.two,
      },
    }),
  );
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
    const checks: Parameters<typeof fields.validateAll>[0] = [
      { key: 'name', kind: 'name', value: name },
      { key: 'mobile', kind: 'mobile', value: mobile },
    ];
    if (password.trim()) {
      checks.push({ key: 'password', kind: 'passwordOptional', value: password });
    }
    if (!fields.validateAll(checks)) return;

    setLoading(true);
    fields.hide('_form');
    try {
      const { student: updated } = await api.updateMyProfile(token, {
        name: name.trim(),
        mobile: mobile.trim(),
        ...(password ? { password } : {}),
      });
      await updateStudentSession(updated);
      setPassword('');
      fields.showMessage('_form', true, 'Your profile has been updated');
    } catch (e) {
      fields.showMessage('_form', false, e instanceof Error ? e.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const formBanner = fields.get('_form');

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
        <FormField label="Full name" placeholder="Your name" {...bind('name', 'name', name, setName)} />
        <FormField
          label="Mobile number"
          placeholder="10-digit mobile"
          keyboardType="phone-pad"
          {...bind('mobile', 'mobile', mobile, setMobile)}
        />
        <FormField
          label="New password"
          placeholder="Leave blank to keep current"
          secureTextEntry
          {...bind('password', 'passwordOptional', password, setPassword, false)}
        />
        <Pressable style={styles.btn} onPress={onSave} disabled={loading}>
          <ThemedText style={styles.btnText}>{loading ? 'Saving…' : 'Save'}</ThemedText>
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

      <Pressable onPress={() => router.back()}>
        <ThemedText style={styles.back}> ← Back</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
