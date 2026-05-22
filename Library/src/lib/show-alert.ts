import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert — web par Alert.alert kabhi dikhta nahi; window.alert reliable hai.
 */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof globalThis !== 'undefined') {
    const w = globalThis as typeof globalThis & { alert?: (msg: string) => void };
    if (typeof w.alert === 'function') {
      w.alert(message ? `${title}\n\n${message}` : title);
      return;
    }
  }
  Alert.alert(title, message);
}
