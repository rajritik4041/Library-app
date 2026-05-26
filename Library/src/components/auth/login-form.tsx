import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useFormStyles } from '@/hooks/use-form-styles';
import { useThemedStyles } from '@/hooks/use-themed-styles';
import { webTextInputProps } from '@/lib/platform-styles';

type Field = {
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
};

export function LoginForm({
  fields,
  onSubmit,
  loading,
  submitLabel = 'Login',
  hint,
}: LoginFormProps) {
  const { styles: formStyles, colors } = useFormStyles();
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
    }),
  );

  return (
    <View style={styles.card}>
      {fields.map((field) => (
        <View key={field.label}>
          <ThemedText style={formStyles.label}>{field.label}</ThemedText>
          <TextInput
            value={field.value}
            onChangeText={field.onChangeText}
            placeholder={field.placeholder}
            secureTextEntry={field.secure}
            autoCapitalize={field.autoCapitalize ?? 'none'}
            keyboardType={field.keyboardType}
            placeholderTextColor={colors.inputPlaceholder}
            style={formStyles.input}
            {...webTextInputProps}
          />
        </View>
      ))}

      <Pressable style={styles.btn} onPress={onSubmit} disabled={loading}>
        <ThemedText style={styles.btnText}>{loading ? 'Please wait…' : submitLabel}</ThemedText>
      </Pressable>

      {hint ? <ThemedText style={formStyles.hint}>{hint}</ThemedText> : null}
    </View>
  );
}
