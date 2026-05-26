/** @type {import('expo/config').ExpoConfig} */
export default ({ config }) => {
  // Sirf explicit build/env par bake karo — dev mein resolveApiUrl() localhost use karega
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  return {
    ...config,
    extra: {
      ...config.extra,
      ...(apiUrl ? { apiUrl: apiUrl.replace(/\/$/, '') } : {}),
    },
  };
};
// /** @type {import('expo/config').ExpoConfig} */
// export default ({ config }) => {
//   const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

//   return {
//     ...config,

//     ios: {
//       ...config.ios,
//       bundleIdentifier: "com.rajritik.mcaetlibrary",

//       infoPlist: {
//         ...config.ios?.infoPlist,
//         ITSAppUsesNonExemptEncryption: false,
//       },
//     },

//     extra: {
//       ...config.extra,
//       ...(apiUrl ? { apiUrl: apiUrl.replace(/\/$/, "") } : {}),
//     },
//   };
// };