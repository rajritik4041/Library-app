const { app, BrowserWindow, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const isDev = !app.isPackaged;
const DEV_URL = process.env.EXPO_WEB_URL || 'http://127.0.0.1:8081';

function getDistDir() {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), 'dist');
  }
  return path.join(__dirname, '..', 'dist');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://127.0.0.1');
        let rel = decodeURIComponent(url.pathname);
        if (rel.endsWith('/')) rel += 'index.html';
        if (rel === '/') rel = '/index.html';

        const rootResolved = path.resolve(rootDir);
        let filePath = path.resolve(rootDir, '.' + rel);
        if (!filePath.startsWith(rootResolved)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        if (!fs.existsSync(filePath) && !path.extname(filePath)) {
          const asHtml = `${filePath}.html`;
          if (fs.existsSync(asHtml)) filePath = asHtml;
        }

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(rootDir, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

function createWindow(loadUrl) {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'MCAET Library',
    autoHideMenuBar: true,
    backgroundColor: '#eef3f9',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // sandbox:true can block reliable keyboard/focus on some Windows builds
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('tel:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('did-finish-load', () => {
    win.focus();
    win.webContents.focus();
  });

  win.webContents.on('did-fail-load', (_event, code, desc) => {
    console.error('Page failed to load:', code, desc);
  });

  win.loadURL(loadUrl);
  return win;
}

let staticServer = null;

app.whenReady().then(async () => {
  let loadUrl = DEV_URL;

  if (!isDev) {
    const distDir = getDistDir();
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      console.error(
        'Missing web build. Run: npm run export-web\nThen: npm run desktop:pack',
      );
      app.quit();
      return;
    }
    staticServer = await startStaticServer(distDir);
    loadUrl = staticServer.url;
  }

  createWindow(loadUrl);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(loadUrl);
    }
  });
});

app.on('window-all-closed', () => {
  if (staticServer?.server) {
    staticServer.server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
