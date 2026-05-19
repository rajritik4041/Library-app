/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => {
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() ||
    'https://library-app-2-e5ly.onrender.com';

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl: apiUrl.replace(/\/$/, ''),
    },
  };
};
