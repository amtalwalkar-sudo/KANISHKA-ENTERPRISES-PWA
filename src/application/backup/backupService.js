import { initializeCanonicalStorage } from '../../utils/indexedDB.js'

export const BACKUP_FORMAT = 'KFE_BACKUP'
export const BACKUP_FORMAT_VERSION = 1
export const LOCAL_BACKUP_DB_NAME = 'kanishka_kfe_local_backup_db'
export const LOCAL_BACKUP_DB_VERSION = 1
export const LOCAL_BACKUP_ID = 'current'
export const CANONICAL_BACKUP_STORES = Object.freeze(['shifts','fuel_logs','odoGaps','pending_mutations','days','trips','gps_snapshots','movement_artifacts','vehicles','drivers','compliance_records','maintenance_records','driver_collected_data','loans','loan_payments','prepayments','driver_targets','break_even_inputs','settings'])

const openLocalBackupDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(LOCAL_BACKUP_DB_NAME, LOCAL_BACKUP_DB_VERSION)
  request.onupgradeneeded = event => { const db = event.target.result; if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id' }) }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error || new Error('Local backup storage could not be opened.'))
})

const readCanonicalSnapshot = async () => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CANONICAL_BACKUP_STORES, 'readonly'); const result = {}; let remaining = CANONICAL_BACKUP_STORES.length; let settled = false
    const fail = error => { if (settled) return; settled = true; try { tx.abort() } catch (_) {}; reject(error) }
    for (const storeName of CANONICAL_BACKUP_STORES) { const request = tx.objectStore(storeName).getAll(); request.onsuccess = () => { result[storeName] = request.result || []; remaining -= 1; if (remaining === 0 && !settled) { settled = true; resolve(result) } }; request.onerror = () => fail(request.error || new Error(`Backup read failed for ${storeName}.`)) }
    tx.onerror = () => fail(tx.error || new Error('Backup snapshot transaction failed.'))
    tx.onabort = () => { if (!settled) { settled = true; reject(tx.error || new Error('Backup snapshot transaction aborted.')) } }
  })
}

export const validateBackup = input => {
  let backup = input
  if (typeof input === 'string') { try { backup = JSON.parse(input) } catch (_) { throw new Error('Backup file is not valid JSON.') } }
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) throw new Error('Backup must be a JSON object.')
  if (backup.format !== BACKUP_FORMAT) throw new Error('Unsupported KFE backup format.')
  if (backup.formatVersion !== BACKUP_FORMAT_VERSION) throw new Error(`Unsupported backup format version: ${backup.formatVersion}.`)
  if (!backup.source || backup.source.dbName !== 'kanishka_kfe_canonical_db' || backup.source.dbVersion !== 8) throw new Error('Backup source does not match the canonical KFE database version.')
  if (typeof backup.exportedAt !== 'string' || Number.isNaN(Date.parse(backup.exportedAt))) throw new Error('Backup exportedAt timestamp is invalid.')
  if (!backup.stores || typeof backup.stores !== 'object' || Array.isArray(backup.stores)) throw new Error('Backup stores section is missing.')
  const expected = new Set(CANONICAL_BACKUP_STORES); const actual = Object.keys(backup.stores)
  if (actual.length !== expected.size || actual.some(name => !expected.has(name))) throw new Error('Backup store set does not exactly match the canonical KFE database.')
  for (const storeName of CANONICAL_BACKUP_STORES) { const records = backup.stores[storeName]; if (!Array.isArray(records)) throw new Error(`Backup store ${storeName} must be an array.`); const ids = new Set(); for (const record of records) { if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string' || !record.id.trim()) throw new Error(`Backup store ${storeName} contains an invalid record.`); if (ids.has(record.id)) throw new Error(`Backup store ${storeName} contains duplicate id ${record.id}.`); ids.add(record.id) } }
  return backup
}
export const createBackup = async () => validateBackup({ format: BACKUP_FORMAT, formatVersion: BACKUP_FORMAT_VERSION, source: { dbName: 'kanishka_kfe_canonical_db', dbVersion: 8 }, exportedAt: new Date().toISOString(), stores: await readCanonicalSnapshot() })
export const serializeBackup = backup => JSON.stringify(validateBackup(backup), null, 2)
export const getBackupSummary = backup => { const valid = validateBackup(backup); const counts = Object.fromEntries(CANONICAL_BACKUP_STORES.map(store => [store, valid.stores[store].length])); return { exportedAt: valid.exportedAt, totalRecords: Object.values(counts).reduce((sum, count) => sum + count, 0), counts } }

export const saveLocalBackup = async backup => { const valid = validateBackup(backup); const db = await openLocalBackupDB(); return new Promise((resolve, reject) => { const tx = db.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').put({ id: LOCAL_BACKUP_ID, savedAt: new Date().toISOString(), backup: valid }); tx.oncomplete = () => { db.close(); resolve(true) }; tx.onerror = () => { db.close(); reject(tx.error || new Error('Local backup save failed.')) }; tx.onabort = () => { db.close(); reject(tx.error || new Error('Local backup save aborted.')) } }) }
export const getLocalBackup = async () => { const db = await openLocalBackupDB(); return new Promise((resolve, reject) => { const tx = db.transaction('snapshots', 'readonly'); const request = tx.objectStore('snapshots').get(LOCAL_BACKUP_ID); request.onsuccess = () => { db.close(); resolve(request.result || null) }; request.onerror = () => { db.close(); reject(request.error || new Error('Local backup lookup failed.')) } }) }
export const restoreBackup = async input => { const backup = validateBackup(input); const db = await initializeCanonicalStorage(); await new Promise((resolve, reject) => { const tx = db.transaction(CANONICAL_BACKUP_STORES, 'readwrite'); try { for (const storeName of CANONICAL_BACKUP_STORES) { const store = tx.objectStore(storeName); store.clear(); for (const record of backup.stores[storeName]) store.add(structuredClone(record)) } } catch (error) { try { tx.abort() } catch (_) {}; reject(error); return } tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || new Error('KFE restore transaction failed.')); tx.onabort = () => reject(tx.error || new Error('KFE restore transaction aborted.')) }); await saveLocalBackup(backup); return getBackupSummary(backup) }
export const downloadBackup = async (backup, filename = null) => { const valid = validateBackup(backup); const blob = new Blob([serializeBackup(valid)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename || `kfe-backup-${valid.exportedAt.replace(/[:.]/g, '-')}.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url) }
export const readBackupFile = async file => validateBackup(await file.text())

let checkpointTimer = null; let checkpointRunning = false; let checkpointRequested = false
export const requestLocalBackupCheckpoint = () => { checkpointRequested = true; if (checkpointTimer !== null) return; checkpointTimer = setTimeout(async () => { checkpointTimer = null; if (checkpointRunning || !checkpointRequested) return; checkpointRequested = false; checkpointRunning = true; try { await saveLocalBackup(await createBackup()) } catch (error) { console.warn('KFE local backup checkpoint failed:', error) } finally { checkpointRunning = false } }, 250) }
export const maybeDailyLocalBackup = async () => { const current = await getLocalBackup(); if (!current || Date.now() - Date.parse(current.savedAt) >= 24 * 60 * 60 * 1000) { const backup = await createBackup(); await saveLocalBackup(backup); return getBackupSummary(backup) } return getBackupSummary(current.backup) }

let cloudProvider = null
export const registerCloudBackupProvider = provider => { if (!provider || typeof provider.upload !== 'function' || typeof provider.download !== 'function') throw new Error('Cloud backup provider must expose upload() and download().'); cloudProvider = provider; return provider.name || 'Cloud' }
export const getCloudBackupProviderName = () => cloudProvider?.name || null
export const backupToCloud = async backup => { if (!cloudProvider) throw new Error('No cloud backup provider is configured.'); return cloudProvider.upload(validateBackup(backup)) }
export const restoreFromCloud = async () => { if (!cloudProvider) throw new Error('No cloud backup provider is configured.'); const backup = validateBackup(await cloudProvider.download()); await restoreBackup(backup); return getBackupSummary(backup) }
export const BackupService = Object.freeze({ createBackup, validateBackup, serializeBackup, getBackupSummary, saveLocalBackup, getLocalBackup, restoreBackup, downloadBackup, readBackupFile, requestLocalBackupCheckpoint, maybeDailyLocalBackup, registerCloudBackupProvider, getCloudBackupProviderName, backupToCloud, restoreFromCloud })
