// KFE local crash/network buffer.
// IndexedDB is used when available; memory fallback keeps runtime safe in tests.

const DB_NAME = 'kfe-resilience';
const STORE = 'events';
const memory = [];

function openDb() {
  if (!('indexedDB' in globalThis)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function bufferEvent(event) {
  const record = { ...event, timestamp: new Date().toISOString() };
  try {
    const db = await openDb();
    if (!db) { memory.push(record); return; }
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch { memory.push(record); }
}

export async function bufferException(error, context = {}) {
  await bufferEvent({ type: 'exception', message: error?.message || String(error), stack: error?.stack || null, context });
}

export async function bufferNetworkFailure(url, context = {}) {
  await bufferEvent({ type: 'network-failure', url: String(url), context });
}

export async function readBufferedEvents() {
  try {
    const db = await openDb();
    if (!db) return [...memory];
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch { return [...memory]; }
}

export async function clearBufferedEvents() {
  const db = await openDb();
  if (!db) { memory.length = 0; return; }
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export function installCrashBuffer() {
  if (globalThis.__KFE_CRASH_BUFFER_INSTALLED__) return;
  globalThis.__KFE_CRASH_BUFFER_INSTALLED__ = true;
  globalThis.addEventListener?.('error', event => bufferException(event.error || new Error(event.message), { source: 'window' }));
  globalThis.addEventListener?.('unhandledrejection', event => bufferException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), { source: 'promise' }));
}
