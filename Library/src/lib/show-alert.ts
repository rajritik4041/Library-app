import { Alert, Platform } from 'react-native';

import { enqueueAlert } from '@/lib/app-dialog-queue';
import { restoreWebPointerEvents } from '@/lib/web-focus';

/**
 * Cross-platform alert. On web/Electron use in-app modal — window.alert breaks TextInput focus.
 */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    restoreWebPointerEvents();
    void enqueueAlert(title, message);
    return;
  }
  Alert.alert(title, message);
}
