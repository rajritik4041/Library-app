/**
 * Local dev: create server/.env from .env.example if missing.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '..');
const envPath = path.join(serverDir, '.env');
const examplePath = path.join(serverDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('✓ Created server/.env from .env.example — MongoDB + Google Sheet sync enabled');
} else if (!fs.existsSync(envPath)) {
  console.warn('WARN: server/.env missing — copy .env.example manually');
}
