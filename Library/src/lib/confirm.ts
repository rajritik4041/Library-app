import { Alert, Platform } from 'react-native';

import { enqueueConfirm } from '@/lib/app-dialog-queue';
import { restoreWebPointerEvents } from '@/lib/web-focus';

/**
 * Cross-platform confirm. On web/Electron use in-app modal — window.confirm breaks TextInput focus.
 */
export function confirmAsync(
  title: string,
  message: string,
  options?: { confirmLabel?: string; destructive?: boolean },
): Promise<boolean> {
  if (Platform.OS === 'web') {
    restoreWebPointerEvents();
    return enqueueConfirm(title, message, options);
  }

  const confirmLabel = options?.confirmLabel ?? 'OK';

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
