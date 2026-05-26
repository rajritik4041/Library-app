import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { FieldFeedback } from '@/hooks/use-field-feedback';
import { useFormStyles } from '@/hooks/use-form-styles';
import type { FieldKind } from '@/lib/field-validation';
import { webTextInputProps } from '@/lib/platform-styles';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  kind: FieldKind;
  feedback?: FieldFeedback;
  onBlur?: () => void;
  onChangeValidate?: (v: string) => void;
  required?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: TextInputProps['keyboardType'];
  editable?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  kind: _kind,
  feedback,
  onBlur,
  onChangeValidate,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  editable = true,
}: FormFieldProps) {
  const { styles: formStyles, colors } = useFormStyles();

  const borderColor = feedback
    ? feedback.valid
      ? colors.success
      : colors.danger
    : colors.border;

  return (
    <View style={styles.wrap}>
      <ThemedText style={formStyles.label}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={(t) => {
          onChangeText(t);
          onChangeValidate?.(t);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        editable={editable}
        placeholderTextColor={colors.inputPlaceholder}
        style={[
          formStyles.input,
          { borderColor },
          !editable && formStyles.inputDisabled,
        ]}
        {...webTextInputProps}
      />
      {feedback?.message ? (
        <ThemedText
          style={[
            styles.feedback,
            { color: feedback.valid ? colors.success : colors.danger },
          ]}>
          {feedback.message}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  feedback: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
});
