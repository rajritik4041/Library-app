import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Production API — MongoDB on Render.
 * Android APK, Windows .exe, macOS .dmg, aur normal dev — teeno yahi use karte hain
 * taaki add/delete sab devices par turant sync ho.
 */
export const PRODUCTION_API_URL = 'https://library-app-2-e5ly.onrender.com';

function trimUrl(url: string) {
  return url.replace(/\/$/, '');
}

function wantsLocalApi(): boolean {
  const flag = process.env.EXPO_PUBLIC_USE_LOCAL_API?.trim();
  return flag === 'true' || flag === '1';
}

function localDevApiUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

/**
 * API base URL (single MongoDB backend for all platforms):
 * 1. EXPO_PUBLIC_API_URL (build / .env)
 * 2. app.config.js → extra.apiUrl
 * 3. PRODUCTION_API_URL (default — Android, Windows, Mac, web)
 *
 * Local server only when EXPO_PUBLIC_USE_LOCAL_API=true (npm run server testing).
 */
export function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return trimUrl(fromEnv);

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra?.trim()) return trimUrl(fromExtra);

  if (__DEV__ && wantsLocalApi()) {
    return localDevApiUrl();
  }

  return PRODUCTION_API_URL;
}

export const API_URL = resolveApiUrl();
