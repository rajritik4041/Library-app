/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.rajritik.library',
  productName: 'MCAET Library',
  directories: {
    app: 'desktop-app',
    output: 'release',
    buildResources: 'assets/images',
  },
  files: ['**/*'],
  asar: true,
  npmRebuild: false,
  nodeGypRebuild: false,
  extraMetadata: {
    main: 'electron/main.js',
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'icon.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MCAET Library',
    installerLanguages: ['en_US', 'hi_IN'],
    language: '1033',
  },
  mac: {
    target: ['dmg'],
    icon: 'icon.png',
    category: 'public.app-category.education',
  },
  linux: {
    target: ['AppImage'],
    icon: 'icon.png',
    category: 'Education',
  },
};
