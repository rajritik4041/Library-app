import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type FieldKind,
  type FieldValidation,
  validateField,
} from '@/lib/field-validation';

export const FIELD_FEEDBACK_MS = 10_000;

export type FieldFeedback = FieldValidation;

export function useFieldFeedback() {
  const [feedback, setFeedback] = useState<Record<string, FieldFeedback>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const touchedRef = useRef<Set<string>>(new Set());

  const clearTimer = useCallback((key: string) => {
    const t = timersRef.current[key];
    if (t) clearTimeout(t);
    delete timersRef.current[key];
  }, []);

  const hide = useCallback(
    (key: string) => {
      clearTimer(key);
      setFeedback((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [clearTimer],
  );

  const show = useCallback(
    (key: string, result: FieldValidation) => {
      if (!result.message) {
        hide(key);
        return;
      }
      clearTimer(key);
      setFeedback((prev) => ({ ...prev, [key]: result }));
      timersRef.current[key] = setTimeout(() => hide(key), FIELD_FEEDBACK_MS);
    },
    [clearTimer, hide],
  );

  const markTouched = useCallback((key: string) => {
    touchedRef.current.add(key);
  }, []);

  const isTouched = useCallback((key: string) => touchedRef.current.has(key), []);

  const runValidate = useCallback(
    (key: string, kind: FieldKind, value: string, options?: { required?: boolean }) => {
      const result = validateField(kind, value, options);
      show(key, result);
      return result.valid;
    },
    [show],
  );

  const validateOnBlur = useCallback(
    (key: string, kind: FieldKind, value: string, options?: { required?: boolean }) => {
      markTouched(key);
      return runValidate(key, kind, value, options);
    },
    [markTouched, runValidate],
  );

  const validateOnChange = useCallback(
    (key: string, kind: FieldKind, value: string, options?: { required?: boolean }) => {
      if (!touchedRef.current.has(key)) return true;
      return runValidate(key, kind, value, options);
    },
    [runValidate],
  );

  const validateAll = useCallback(
    (
      fields: Array<{
        key: string;
        kind: FieldKind;
        value: string;
        options?: { required?: boolean };
      }>,
    ) => {
      let allValid = true;
      for (const f of fields) {
        markTouched(f.key);
        const valid = runValidate(f.key, f.kind, f.value, f.options);
        if (!valid) allValid = false;
      }
      return allValid;
    },
    [markTouched, runValidate],
  );

  const showMessage = useCallback(
    (key: string, valid: boolean, message: string) => {
      show(key, { valid, message });
    },
    [show],
  );

  const clearAll = useCallback(() => {
    Object.keys(timersRef.current).forEach(clearTimer);
    touchedRef.current.clear();
    setFeedback({});
  }, [clearTimer]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return {
    feedback,
    get: (key: string) => feedback[key],
    show,
    showMessage,
    hide,
    markTouched,
    isTouched,
    validateOnBlur,
    validateOnChange,
    validateAll,
    clearAll,
  };
}
