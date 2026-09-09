import mongoose from 'mongoose';

const MONGO_OPTS = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 120000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
};

let reconnecting = false;

function isTransientMongoError(err) {
  if (!err) return false;
  const name = err.name || '';
  const labels = err.errorLabelSet;
  if (
    name === 'MongoPoolClearedError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoServerSelectionError' ||
    name === 'MongoTimeoutError'
  ) {
    return true;
  }
  if (labels?.has?.('PoolRequestedRetry') || labels?.has?.('PoolRequstedRetry')) {
    return true;
  }
  const msg = String(err.message || '');
  return /connection.*closed|pool.*cleared|topology was destroyed/i.test(msg);
}

export function registerMongoProcessHandlers() {
  mongoose.connection.on('error', (err) => {
    console.warn('MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  process.on('unhandledRejection', (reason) => {
    if (isTransientMongoError(reason)) {
      console.warn('MongoDB transient (pool/network):', reason.message);
      return;
    }
  });
}

export async function connectMongo(uri) {
  registerMongoProcessHandlers();
  await mongoose.connect(uri, MONGO_OPTS);
}

export async function ensureMongoConnected(uri) {
  if (mongoose.connection.readyState === 1) return;
  if (reconnecting) {
    await new Promise((r) => setTimeout(r, 400));
    if (mongoose.connection.readyState === 1) return;
  }
  if (!uri?.trim()) throw new Error('MONGODB_URI missing');
  reconnecting = true;
  try {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch {
        /* ignore */
      }
    }
    await connectMongo(uri);
    console.log('MongoDB reconnected');
  } finally {
    reconnecting = false;
  }
}

/** Retry transient pool/network errors (Atlas blips, sheet sync bursts). */
export async function withMongoRetry(fn, { retries = 2, uri } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      if (mongoose.connection.readyState !== 1 && uri) {
        await ensureMongoConnected(uri);
      }
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientMongoError(err) || attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      if (uri) {
        try {
          await ensureMongoConnected(uri);
        } catch {
          /* next attempt may still work */
        }
      }
    }
  }
  throw lastErr;
}

export { isTransientMongoError };

let authConnection = null;

export async function connectAuthMongo(uri) {
  if (!uri?.trim()) {
    console.warn('MCAET_AUTH_MONGODB_URI not configured — auth will use local Mongo / file store');
    return null;
  }
  if (authConnection && authConnection.readyState === 1) {
    return authConnection;
  }
  try {
    authConnection = await mongoose.createConnection(uri, MONGO_OPTS).asPromise();
    console.log('MCAET Auth MongoDB connected (student_portal, professor_portal, admin_portal, Otp_Record)');
    return authConnection;
  } catch (err) {
    console.error('Failed to connect to MCAET Auth MongoDB:', err.message);
    return null;
  }
}

export function getAuthConnection() {
  return authConnection;
}

export async function ensureAuthMongoConnected(uri) {
  if (authConnection && authConnection.readyState === 1) return authConnection;
  if (uri?.trim()) {
    return connectAuthMongo(uri);
  }
  return null;
}
