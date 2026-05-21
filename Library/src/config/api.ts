import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Production API — MongoDB on Render.
 * APK / desktop prod builds use EXPO_PUBLIC_API_URL or this default.
 */
export const PRODUCTION_API_URL = 'https://library-app-2-e5ly.onrender.com';

function trimUrl(url: string) {
  return url.replace(/\/$/, '');
}

/** Dev mein bhi Render test karna ho to EXPO_PUBLIC_USE_PRODUCTION_API=true */
function wantsProductionApiInDev(): boolean {
  const flag = process.env.EXPO_PUBLIC_USE_PRODUCTION_API?.trim();
  return flag === 'true' || flag === '1';
}

function localDevApiUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

/**
 * API base URL:
 * 1. EXPO_PUBLIC_API_URL (.env / build script — highest priority)
 * 2. __DEV__ → localhost (Library/server on 3001), unless USE_PRODUCTION_API
 * 3. app.config.js extra.apiUrl (production export only)
 * 4. PRODUCTION_API_URL (Render)
 */
export function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return trimUrl(fromEnv);

  if (__DEV__ && !wantsProductionApiInDev()) {
    return localDevApiUrl();
  }

  const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromExtra?.trim()) return trimUrl(fromExtra);

  return PRODUCTION_API_URL;
}

export const API_URL = resolveApiUrl();
