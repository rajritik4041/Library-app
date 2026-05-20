const { execSync } = require('child_process');
const path = require('path');

const desktopDir = path.join(__dirname, '..', 'desktop-app');

execSync('npx electron-builder --mac dmg --config electron-builder.json', {
  cwd: desktopDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  },
});
