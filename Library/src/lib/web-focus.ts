import type { RefObject } from 'react';
import { Platform } from 'react-native';

/**
 * Electron / RN Web: native window.alert/confirm and modals can leave body/#root
 * with pointer-events disabled — inputs show a cursor but ignore clicks.
 */
export function restoreWebPointerEvents(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.body.style.pointerEvents = '';
  document.body.style.userSelect = '';
  document.body.removeAttribute('inert');
  const root = document.getElementById('root');
  if (root instanceof HTMLElement) {
    root.style.pointerEvents = '';
  }
}

export function focusWebTextInput(
  ref: RefObject<{ focus?: () => void } | null>,
  delayMs = 80,
): () => void {
  if (Platform.OS !== 'web') return () => {};
  const id = setTimeout(() => {
    restoreWebPointerEvents();
    ref.current?.focus?.();
  }, delayMs);
  return () => clearTimeout(id);
}
