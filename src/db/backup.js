import { db } from './index.js'

export async function exportDatabase() {
  const records = await db.records.toArray()
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kfe-backup-${new Date().toISOString().substring(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importDatabase(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!Array.isArray(data)) throw new Error('File must contain an array of records.')

        // Strict Structural Guard
        const isValid = data.every(rec => 
          rec && typeof rec === 'object' && rec.entityId && rec.record_type && rec.date
        )
        if (!isValid) throw new Error('Backup contains invalid or missing record fields.')

        await db.transaction('rw', db.records, async () => {
          await db.records.bulkPut(data)
        })
        resolve(data.length)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
