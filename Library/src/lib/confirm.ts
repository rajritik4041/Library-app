import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm. On web, Alert.alert often ignores button onPress — use window.confirm.
 */
export function confirmAsync(
  title: string,
  message: string,
  options?: { confirmLabel?: string; destructive?: boolean },
): Promise<boolean> {
  const confirmLabel = options?.confirmLabel ?? 'OK';

  if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
    const w = globalThis as typeof globalThis & { confirm?: (msg: string) => boolean };
    if (typeof w.confirm === 'function') {
      return Promise.resolve(w.confirm(`${title}\n\n${message}`));
    }
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: confirmLabel,
          style: options?.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
