const { execFileSync } = require('child_process');

module.exports = async function afterPack(context) {
  if (process.platform !== 'darwin') return;

  const appOutDir = context?.appOutDir;
  if (!appOutDir) return;

  // Remove extended attributes that break codesign on macOS.
  execFileSync('xattr', ['-cr', appOutDir], { stdio: 'inherit' });
};
