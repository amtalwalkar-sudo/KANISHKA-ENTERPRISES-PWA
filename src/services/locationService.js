const MIN_INTERVAL_MS = 5 * 60 * 1000
let lastSnapshotAt = 0
let timer = null
let activeHandler = null
let foregroundService = null

const readPosition = (options = {}) => new Promise((resolve) => {
  if (!navigator.geolocation) return resolve(null)
  navigator.geolocation.getCurrentPosition(
    (position) => resolve({ latitude: Number(position.coords.latitude), longitude: Number(position.coords.longitude), accuracy: Number(position.coords.accuracy), speed: Number.isFinite(position.coords.speed) ? Number(position.coords.speed) : null, bearing: Number.isFinite(position.coords.heading) ? Number(position.coords.heading) : null, timestamp: new Date(position.timestamp || Date.now()).toISOString() }),
    () => resolve(null),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000, ...options }
  )
})

const startAndroidForegroundService = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.getPlatform() !== 'android') return
    const module = await import('@capawesome-team/capacitor-android-foreground-service')
    foregroundService = module.ForegroundService
    await foregroundService.requestPermissions()
    await foregroundService.startForegroundService({ id: 7102, title: 'KFE — Trip Active', body: 'Location snapshots are active for distance calculation.' })
  } catch (error) { console.warn('Android foreground location service unavailable; Trip continues without blocking.', error) }
}
const stopAndroidForegroundService = async () => { try { if (foregroundService) await foregroundService.stopForegroundService() } catch (error) { console.warn('Unable to stop Android foreground location service.', error) } finally { foregroundService=null } }

export const LocationService = {
  captureLocation: readPosition,
  async capturePeriodicSnapshot(handler) { const now=Date.now();if(now-lastSnapshotAt<MIN_INTERVAL_MS)return null;const location=await readPosition();if(location){lastSnapshotAt=now;await handler(location)}return location },
  startActiveTripSnapshots(handler) { this.stopActiveTripSnapshots(); activeHandler=handler;void startAndroidForegroundService();void this.capturePeriodicSnapshot(handler);timer=window.setInterval(()=>void this.capturePeriodicSnapshot(activeHandler),MIN_INTERVAL_MS) },
  stopActiveTripSnapshots() { if(timer!==null)window.clearInterval(timer);timer=null;activeHandler=null;void stopAndroidForegroundService() },
  reset(){lastSnapshotAt=0;this.stopActiveTripSnapshots()}
}
export const LOCATION_SNAPSHOT_INTERVAL_MS=MIN_INTERVAL_MS
