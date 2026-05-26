import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { confirmAsync } from '@/lib/confirm';
import { webTextInputProps } from '@/lib/platform-styles';
import { showAlert } from '@/lib/show-alert';
import { api } from '@/services/api';
import type { TeacherSession } from '@/types/api';

const emptyForm = {
  teacherId: '',
  password: '',
  name: '',
  mobile: '',
  department: '',
  inCharge: '',
};

export default function DeanScreen() {
  const { isDean, token, dean, logout } = useAuth();
  const router = useRouter();
  const { styles: FormStyles, colors: FormColors } = useFormStyles();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      teacherRow: {
        flexDirection: 'row',
        gap: Spacing.two,
        paddingVertical: Spacing.two,
        borderTopWidth: 1,
        borderTopColor: c.border,
      },
      teacherInfo: { flex: 1, gap: 2 },
      teacherIdText: { fontWeight: '800', color: c.ink, fontSize: 14 },
      actions: { gap: Spacing.one, justifyContent: 'center' },
      smallBtn: {
        backgroundColor: c.accent,
        paddingHorizontal: Spacing.two,
        paddingVertical: 8,
        borderRadius: Radius.sm,
        minWidth: 52,
        alignItems: 'center',
      },
      smallBtnDanger: {
        backgroundColor: '#b91c1c',
        paddingHorizontal: Spacing.two,
        paddingVertical: 8,
        borderRadius: Radius.sm,
        minWidth: 52,
        alignItems: 'center',
      },
      smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
      btn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        width: '100%',
      },
      btnSecondary: {
        backgroundColor: c.goldMuted,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: c.goldLight,
      },
      btnText: { color: '#fff', fontWeight: '800' },
      btnTextDark: { color: c.ink, fontWeight: '800' },
      logout: { alignItems: 'center', padding: Spacing.three },
      logoutText: { color: c.inkMuted, fontWeight: '600' },
      editBanner: {
        backgroundColor: c.accentSoft,
        padding: Spacing.two,
        borderRadius: Radius.md,
        marginBottom: Spacing.two,
      },
      editBannerText: { color: c.accent, fontWeight: '700', fontSize: 13 },
    }),
  );

  const [teachers, setTeachers] = useState<TeacherSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getDeanTeachers(token);
      setTeachers(data.teachers);
    } catch (e) {
      showAlert('Error', e instanceof Error ? e.message : 'Could not load teachers');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isDean && token) load();
    else setLoading(false);
  }, [isDean, token, load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (t: TeacherSession) => {
    setEditingId(t.teacherId);
    setForm({
      teacherId: t.teacherId,
      password: '',
      name: t.name,
      mobile: t.mobile || '',
      department: t.department || '',
      inCharge: t.inCharge || '',
    });
  };

  const saveTeacher = async () => {
    if (!token) return;
    if (!form.name.trim()) {
      showAlert('Error', 'Teacher name is required');
      return;
    }
    if (!editingId && (!form.teacherId.trim() || !form.password)) {
      showAlert('Error', 'Enter ID and password for a new teacher');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.updateDeanTeacher(token, editingId, {
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          department: form.department.trim(),
          inCharge: form.inCharge.trim(),
          ...(form.password ? { password: form.password } : {}),
        });
        showAlert('Saved', 'Teacher updated');
      } else {
        await api.createDeanTeacher(token, {
          teacherId: form.teacherId.trim(),
          password: form.password,
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          department: form.department.trim(),
          inCharge: form.inCharge.trim(),
        });
        showAlert('Created', `Teacher ${form.teacherId.toUpperCase()} created`);
      }
      resetForm();
      await load();
    } catch (e) {
      showAlert('Failed', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const removeTeacher = async (t: TeacherSession) => {
    if (!token) return;
    const ok = await confirmAsync(
      'Delete teacher?',
      `${t.name} (${t.teacherId}) — this account will be removed permanently.`,
      { confirmLabel: 'Delete', destructive: true },
    );
    if (!ok) return;
    try {
      await api.deleteDeanTeacher(token, t.teacherId);
      if (editingId === t.teacherId) resetForm();
      await load();
      showAlert('Deleted', 'Teacher account removed');
    } catch (e) {
      showAlert('Delete failed', e instanceof Error ? e.message : 'Could not delete');
    }
  };

  const inputProps = {
    placeholderTextColor: FormColors.inputPlaceholder,
    style: FormStyles.input,
    ...webTextInputProps,
  };

  if (!isDean || !token) {
    return (
      <ScrollView contentContainerStyle={FormStyles.pageCentered}>
        <PageHeader title="Dean Panel" subtitle="Dean login required" />
        <Pressable style={styles.btn} onPress={() => router.push('/login-dean')}>
          <ThemedText style={styles.btnText}>Dean Login</ThemedText>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={FormStyles.page}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <PageHeader
        badge="Dean"
        title={`Welcome, ${dean?.name}`}
        subtitle={`ID: ${dean?.deanId}  \n Professors can manage and oversee all library operations efficiently.`}
      />

      <Pressable style={styles.btnSecondary} onPress={() => router.push('/(tabs)/teacher')}>
        <ThemedText style={styles.btnTextDark}>📚 Library panel (books, students, issue)</ThemedText>
      </Pressable>

      <View style={FormStyles.card}>
        <ThemedText style={FormStyles.cardTitle}>
          {editingId ? `✏️ Edit Professor — ${editingId}` : `➕ Create New Professor ID`}
        </ThemedText>
        {editingId ? (
          <View style={styles.editBanner}>
            <ThemedText style={styles.editBannerText}>
            Only the Dean can update professor details — professors cannot edit their own information.
               </ThemedText>
          </View>
        ) : null}
        {!editingId ? (
          <>
            <ThemedText style={FormStyles.label}>Professor ID *</ThemedText>
            <TextInput
              placeholder="e.g. T002"
              value={form.teacherId}
              onChangeText={(v) => setForm((f) => ({ ...f, teacherId: v }))}
              autoCapitalize="characters"
              {...inputProps}
            />
            <ThemedText style={FormStyles.label}>Password *</ThemedText>
            <TextInput
              placeholder="Login password"
              value={form.password}
              onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              secureTextEntry
              {...inputProps}
            />
          </>
        ) : (
          <>
            <ThemedText style={FormStyles.hint}>
            New password (optional — you can leave this field empty)
              </ThemedText>
            <TextInput
              placeholder="New password"
              value={form.password}
              onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
              secureTextEntry
              {...inputProps}
            />
          </>
        )}
        <ThemedText style={FormStyles.label}>Name *</ThemedText>
        <TextInput
          placeholder="Teacher name"
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          {...inputProps}
        />
        <ThemedText style={FormStyles.label}>Mobile</ThemedText>
        <TextInput
          placeholder="Mobile number"
          value={form.mobile}
          onChangeText={(v) => setForm((f) => ({ ...f, mobile: v }))}
          keyboardType="phone-pad"
          {...inputProps}
        />
        <ThemedText style={FormStyles.label}>Department (Professor)</ThemedText>
        <TextInput
          placeholder="e.g. CSE, ME, CE"
          value={form.department}
          onChangeText={(v) => setForm((f) => ({ ...f, department: v }))}
          {...inputProps}
        />
        <ThemedText style={FormStyles.label}>Incharge of</ThemedText>
        <TextInput
          placeholder="e.g. Library, Lab, Sports"
          value={form.inCharge}
          onChangeText={(v) => setForm((f) => ({ ...f, inCharge: v }))}
          {...inputProps}
        />
        <Pressable style={styles.btn} onPress={saveTeacher} disabled={saving}>
          <ThemedText style={styles.btnText}>
            {saving ? 'Saving…' : editingId ? 'Update Teacher' : 'Create Teacher'}
          </ThemedText>
        </Pressable>
        {editingId ? (
          <Pressable style={styles.btnSecondary} onPress={resetForm}>
            <ThemedText style={styles.btnTextDark}>Cancel edit</ThemedText>
          </Pressable>
        ) : null}
      </View>

      <View style={FormStyles.card}>
        <ThemedText style={FormStyles.cardTitle}>👩‍🏫 Registered Professors ({teachers.length})</ThemedText>
        {teachers.length === 0 ? (
          <ThemedText style={FormStyles.hint}>No professors have been added yet — add one using the option above.</ThemedText>
        ) : (
          teachers.map((t) => (
            <View key={t.teacherId} style={styles.teacherRow}>
              <View style={styles.teacherInfo}>
                <ThemedText style={styles.teacherIdText}>{t.teacherId}</ThemedText>
                <ThemedText style={FormStyles.bodyText}>{t.name}</ThemedText>
                <ThemedText style={FormStyles.metaText}>
                  {t.mobile || '—'} · {t.department || 'Dept —'} · Incharge: {t.inCharge || '—'}
                </ThemedText>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.smallBtn} onPress={() => startEdit(t)}>
                  <ThemedText style={styles.smallBtnText}>Edit</ThemedText>
                </Pressable>
                <Pressable style={styles.smallBtnDanger} onPress={() => removeTeacher(t)}>
                  <ThemedText style={styles.smallBtnText}>Del</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>
    </ScrollView>
  );
}
