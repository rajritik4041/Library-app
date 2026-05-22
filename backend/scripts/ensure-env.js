/**
 * Local dev: create server/.env from .env.example if missing or MONGODB_URI empty.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '..');
const envPath = path.join(serverDir, '.env');
const examplePath = path.join(serverDir, '.env.example');

function hasMongoUri(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const text = fs.readFileSync(filePath, 'utf8');
  const line = text.split(/\r?\n/).find((l) => /^\s*MONGODB_URI\s*=/.test(l));
  if (!line) return false;
  const value = line.replace(/^\s*MONGODB_URI\s*=\s*/, '').trim();
  return value.length > 0 && value !== '""' && value !== "''";
}

if (!fs.existsSync(examplePath)) {
  console.warn('WARN: server/.env.example missing — add MONGODB_URI manually in server/.env');
} else if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('✓ Created server/.env from .env.example');
} else if (!hasMongoUri(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('✓ server/.env had no MONGODB_URI — refreshed from .env.example');
}
