import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form/form-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useFieldFeedback } from '@/hooks/use-field-feedback';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import type { FieldKind } from '@/lib/field-validation';

type Field = {
  key: string;
  kind: FieldKind;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
};

type LoginFormProps = {
  fields: Field[];
  onSubmit: () => void;
  loading: boolean;
  submitLabel?: string;
  hint?: string;
  /** API / login failure — shown below fields in red for 10s */
  submitError?: string;
};

export function LoginForm({
  fields,
  onSubmit,
  loading,
  submitLabel = 'Login',
  hint,
  submitError,
}: LoginFormProps) {
  const { styles: formStyles, colors } = useFormStyles();
  const { get, validateAll, validateOnBlur, validateOnChange, showMessage } = useFieldFeedback();
  const styles = useThemedStyles((c) =>
    StyleSheet.create({
      card: {
        ...formStyles.card,
        width: '100%',
      },
      btn: {
        backgroundColor: c.navy,
        padding: Spacing.three,
        borderRadius: Radius.md,
        alignItems: 'center',
        marginTop: Spacing.two,
      },
      btnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
      },
      formError: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: Spacing.one,
        textAlign: 'center',
      },
    }),
  );

  useEffect(() => {
    if (submitError) {
      showMessage('_submit', false, submitError);
    }
  }, [submitError, showMessage]);

  const handleSubmit = () => {
    const ok = validateAll(
      fields.map((f) => ({
        key: f.key,
        kind: f.kind,
        value: f.value,
        options: { required: true },
      })),
    );
    if (!ok) return;
    onSubmit();
  };

  const submitFb = get('_submit');

  return (
    <View style={styles.card}>
      {fields.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          value={field.value}
          onChangeText={field.onChangeText}
          placeholder={field.placeholder}
          kind={field.kind}
          feedback={get(field.key)}
          secureTextEntry={field.secure}
          autoCapitalize={field.autoCapitalize ?? 'none'}
          keyboardType={field.keyboardType}
          onBlur={() =>
            validateOnBlur(field.key, field.kind, field.value, {
              required: true,
            })
          }
          onChangeValidate={(v) =>
            validateOnChange(field.key, field.kind, v, {
              required: true,
            })
          }
        />
      ))}

      <Pressable style={styles.btn} onPress={handleSubmit} disabled={loading}>
        <ThemedText style={styles.btnText}>{loading ? 'Please wait…' : submitLabel}</ThemedText>
      </Pressable>

      {submitFb?.message ? (
        <ThemedText style={[styles.formError, { color: colors.danger }]}>
          {submitFb.message}
        </ThemedText>
      ) : null}

      {hint ? <ThemedText style={formStyles.hint}>{hint}</ThemedText> : null}
    </View>
  );
}
