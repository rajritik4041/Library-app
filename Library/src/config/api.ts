import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Production API — MongoDB connected (Render). APK / EAS builds must use this or set EXPO_PUBLIC_API_URL. */
export const PRODUCTION_API_URL = 'https://library-app-2-e5ly.onrender.com';

function trimUrl(url: string) {
  return url.replace(/\/$/, '');
}

/**
 * API base URL:
 * - EAS/APK: EXPO_PUBLIC_API_URL from eas.json (baked at build time)
 * - Dev web: localhost:3001
 * - Dev Android emulator: 10.0.2.2:3001
 * - Dev physical phone: set EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3001 in Library/.env
 */
export function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return trimUrl(fromEnv);

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra) return trimUrl(fromExtra);

  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:3001';
    if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
    return 'http://localhost:3001';
  }

  return PRODUCTION_API_URL;
}

export const API_URL = resolveApiUrl();
