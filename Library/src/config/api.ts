// import { Platform } from 'react-native';

// const defaultUrl =
//   Platform.OS === 'web'
//     ? 'http://localhost:3001'
//     : Platform.OS === 'android'
//       ? 'http://10.0.2.2:3001'
//       : 'http://localhost:3001';

// export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? defaultUrl;
export const API_URL =   process.env.EXPO_PUBLIC_API_URL ||   "https://library-app-2-e5ly.onrender.com";