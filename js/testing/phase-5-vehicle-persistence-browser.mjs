import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const port = 4173;
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', chunk => { output += chunk.toString(); });
server.stderr.on('data', chunk => { output += chunk.toString(); });

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Vite preview did not start. Output:\n${output}`);
}

try {
  await waitForServer(`http://127.0.0.1:${port}/`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const dbName = 'kfe';
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('IndexedDB delete failed'));
      request.onblocked = () => reject(new Error('IndexedDB delete blocked'));
    });

    const { createVehicleRepository } = await import('/js/application/vehicle-repository.js');
    const { DB_NAME, DB_VERSION, STORES } = await import('/js/core/hardened-db.js');

    if (DB_NAME !== dbName) throw new Error(`Unexpected DB name: ${DB_NAME}`);
    if (DB_VERSION !== 4) throw new Error(`Unexpected DB version: ${DB_VERSION}`);
    if (!STORES.vehicles || STORES.vehicles.keyPath !== 'id') {
      throw new Error('Canonical vehicles store is missing or has the wrong keyPath');
    }

    const repository = createVehicleRepository();
    const record = { id: 'vehicle-browser-round-trip-1', marker: 'real-indexeddb' };
    const updated = { ...record, marker: 'real-indexeddb-updated' };

    await repository.create(record);
    const created = await repository.get(record.id);
    const listedAfterCreate = await repository.list();

    await repository.update(updated);
    const readAfterUpdate = await repository.get(record.id);
    const listedAfterUpdate = await repository.list();

    await repository.remove(record.id);
    const afterRemove = await repository.get(record.id);
    const listedAfterRemove = await repository.list();

    if (JSON.stringify(created) !== JSON.stringify(record)) throw new Error('CREATE/GET round-trip failed');
    if (listedAfterCreate.length !== 1 || JSON.stringify(listedAfterCreate[0]) !== JSON.stringify(record)) {
      throw new Error('CREATE/LIST round-trip failed');
    }
    if (JSON.stringify(readAfterUpdate) !== JSON.stringify(updated)) throw new Error('UPDATE/GET round-trip failed');
    if (listedAfterUpdate.length !== 1 || JSON.stringify(listedAfterUpdate[0]) !== JSON.stringify(updated)) {
      throw new Error('UPDATE/LIST round-trip failed');
    }
    if (afterRemove !== undefined || listedAfterRemove.length !== 0) throw new Error('REMOVE round-trip failed');

    return {
      database: DB_NAME,
      version: DB_VERSION,
      store: 'vehicles',
      keyPath: STORES.vehicles.keyPath,
      operations: ['create/get', 'create/list', 'update/get', 'update/list', 'remove/get', 'remove/list'],
      result: 'PASS'
    };
  });

  console.log(`PHASE_5_VEHICLE_REAL_INDEXEDDB_PERSISTENCE=${result.result}`);
  console.log(JSON.stringify(result));

  await context.close();
  await browser.close();
} finally {
  server.kill('SIGTERM');
}
