import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FormColors, FormStyles } from '@/constants/form-styles';
import { LibraryColors, Radius, Spacing } from '@/constants/theme';

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
  return (
    <View style={styles.card}>
      {fields.map((field) => (
        <View key={field.label}>
          <ThemedText style={FormStyles.label}>{field.label}</ThemedText>
          <TextInput
            value={field.value}
            onChangeText={field.onChangeText}
            placeholder={field.placeholder}
            secureTextEntry={field.secure}
            autoCapitalize={field.autoCapitalize ?? 'none'}
            keyboardType={field.keyboardType}
            placeholderTextColor={FormColors.placeholder}
            style={FormStyles.input}
          />
        </View>
      ))}

      <Pressable style={styles.btn} onPress={onSubmit} disabled={loading}>
        <ThemedText style={styles.btnText}>{loading ? 'Please wait…' : submitLabel}</ThemedText>
      </Pressable>

      {hint ? <ThemedText style={FormStyles.hint}>{hint}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...FormStyles.card,
    width: '100%',
  },
  btn: {
    backgroundColor: LibraryColors.navy,
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
});
