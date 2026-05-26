import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form/form-field';
import { PageHeader } from '@/components/library/page-header';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { Radius, Spacing } from '@/constants/theme';
import { useFieldFeedback } from '@/hooks/use-field-feedback';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { confirmAsync } from '@/lib/confirm';
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
  const { styles: FormStyles, colors } = useFormStyles();
  const fields = useFieldFeedback();
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
      banner: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.one,
      },
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

    const checks: Parameters<typeof fields.validateAll>[0] = [
      { key: 'name', kind: 'name', value: form.name },
      { key: 'mobile', kind: 'mobileOptional', value: form.mobile },
      { key: 'department', kind: 'department', value: form.department, options: { required: false } },
      { key: 'inCharge', kind: 'text', value: form.inCharge, options: { required: false } },
    ];
    if (!editingId) {
      checks.unshift(
        { key: 'teacherId', kind: 'teacherId', value: form.teacherId },
        { key: 'password', kind: 'password', value: form.password },
      );
    } else if (form.password.trim()) {
      checks.push({ key: 'password', kind: 'passwordOptional', value: form.password });
    }
    if (!fields.validateAll(checks)) return;

    setSaving(true);
    fields.hide('_save');
    try {
      if (editingId) {
        await api.updateDeanTeacher(token, editingId, {
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          department: form.department.trim(),
          inCharge: form.inCharge.trim(),
          ...(form.password ? { password: form.password } : {}),
        });
        fields.showMessage('_save', true, 'Professor updated');
      } else {
        await api.createDeanTeacher(token, {
          teacherId: form.teacherId.trim(),
          password: form.password,
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          department: form.department.trim(),
          inCharge: form.inCharge.trim(),
        });
        fields.showMessage(
          '_save',
          true,
          `Professor ${form.teacherId.toUpperCase()} created`,
        );
      }
      resetForm();
      await load();
    } catch (e) {
      fields.showMessage('_save', false, e instanceof Error ? e.message : 'Could not save');
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
      fields.showMessage('_save', true, 'Professor account removed');
    } catch (e) {
      fields.showMessage('_save', false, e instanceof Error ? e.message : 'Could not delete');
    }
  };

  const bind = (
    key: string,
    kind: Parameters<typeof fields.validateOnBlur>[1],
    value: string,
    onChange: (v: string) => void,
    required = true,
  ) => ({
    kind,
    value,
    onChangeText: onChange,
    feedback: fields.get(key),
    onBlur: () => fields.validateOnBlur(key, kind, value, { required }),
    onChangeValidate: (v: string) =>
      fields.validateOnChange(key, kind, v, { required }),
  });

  const saveBanner = fields.get('_save');

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
            <FormField
              label="Professor ID *"
              placeholder="e.g. T002"
              autoCapitalize="characters"
              {...bind('teacherId', 'teacherId', form.teacherId, (v) =>
                setForm((f) => ({ ...f, teacherId: v })),
              )}
            />
            <FormField
              label="Password *"
              placeholder="Login password"
              secureTextEntry
              {...bind('password', 'password', form.password, (v) =>
                setForm((f) => ({ ...f, password: v })),
              )}
            />
          </>
        ) : (
          <FormField
            label="New password (optional)"
            placeholder="Leave empty to keep current"
            secureTextEntry
            {...bind(
              'password',
              'passwordOptional',
              form.password,
              (v) => setForm((f) => ({ ...f, password: v })),
              false,
            )}
          />
        )}
        <FormField
          label="Name *"
          placeholder="Professor name"
          {...bind('name', 'name', form.name, (v) => setForm((f) => ({ ...f, name: v })))}
        />
        <FormField
          label="Mobile"
          placeholder="Mobile number"
          keyboardType="phone-pad"
          {...bind(
            'mobile',
            'mobileOptional',
            form.mobile,
            (v) => setForm((f) => ({ ...f, mobile: v })),
            false,
          )}
        />
        <FormField
          label="Department (Professor)"
          placeholder="e.g. CSE, ME, CE"
          autoCapitalize="characters"
          {...bind(
            'department',
            'department',
            form.department,
            (v) => setForm((f) => ({ ...f, department: v })),
            false,
          )}
        />
        <FormField
          label="Incharge of"
          placeholder="e.g. Library, Lab, Sports"
          {...bind(
            'inCharge',
            'text',
            form.inCharge,
            (v) => setForm((f) => ({ ...f, inCharge: v })),
            false,
          )}
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

        {saveBanner?.message ? (
          <ThemedText
            style={[
              styles.banner,
              { color: saveBanner.valid ? colors.success : colors.danger },
            ]}>
            {saveBanner.message}
          </ThemedText>
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
