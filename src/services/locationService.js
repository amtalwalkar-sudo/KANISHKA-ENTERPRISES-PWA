const GPS_INTERVALS_MS = Object.freeze({
  WAITING: 7 * 60 * 1000,
  TRIP_ACTIVE: 9 * 60 * 1000,
  BETWEEN_TRIPS_MOVING: 2 * 60 * 1000,
  BETWEEN_TRIPS_STATIONARY: 6 * 60 * 1000
})

let lastSnapshotAt = 0
let timer = null
let activeHandler = null
let currentState = 'WAITING'
let foregroundService = null

const readPosition = (options = {}) => new Promise((resolve) => {
  if (!navigator.geolocation) return resolve(null)
  navigator.geolocation.getCurrentPosition(
    (position) => resolve({
      latitude: Number(position.coords.latitude),
      longitude: Number(position.coords.longitude),
      accuracy: Number(position.coords.accuracy),
      speed: Number.isFinite(position.coords.speed) ? Number(position.coords.speed) : null,
      bearing: Number.isFinite(position.coords.heading) ? Number(position.coords.heading) : null,
      timestamp: new Date(position.timestamp || Date.now()).toISOString()
    }),
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
    await foregroundService.startForegroundService({
      id: 7102,
      title: 'KFE — Shift Active',
      body: 'Location snapshots are active for shift movement calculation.',
      foregroundServiceType: 'location'
    })
  } catch (error) {
    console.warn('Android foreground location service unavailable; Shift continues without blocking.', error)
  }
}

const stopAndroidForegroundService = async () => {
  try {
    if (foregroundService) await foregroundService.stopForegroundService()
  } catch (error) {
    console.warn('Unable to stop Android foreground location service.', error)
  } finally {
    foregroundService = null
  }
}

const capture = async (handler, force = false) => {
  const now = Date.now()
  if (!force && now - lastSnapshotAt < GPS_INTERVALS_MS[currentState]) return null
  const location = await readPosition()
  if (location) {
    lastSnapshotAt = now
    await handler(location)
  }
  return location
}

const schedule = () => {
  if (timer !== null) window.clearTimeout(timer)
  timer = window.setTimeout(async () => {
    if (activeHandler) await capture(activeHandler)
    if (activeHandler) schedule()
  }, GPS_INTERVALS_MS[currentState])
}

export const LocationService = {
  captureLocation: readPosition,
  getState() { return currentState },
  getIntervals() { return { ...GPS_INTERVALS_MS } },
  setState(state) {
    if (!GPS_INTERVALS_MS[state]) throw new Error(`Unsupported GPS state: ${state}`)
    currentState = state
    if (activeHandler) schedule()
  },
  async capturePeriodicSnapshot(handler, { force = false } = {}) {
    return capture(handler, force)
  },
  async captureBoundarySnapshot(handler) {
    return capture(handler, true)
  },
  startActiveShiftSnapshots(handler, state = 'WAITING') {
    this.stopActiveShiftSnapshots()
    activeHandler = handler
    currentState = state
    void startAndroidForegroundService()
    void capture(activeHandler, true)
    schedule()
  },
  stopActiveShiftSnapshots() {
    if (timer !== null) window.clearTimeout(timer)
    timer = null
    activeHandler = null
    void stopAndroidForegroundService()
  },
  startActiveTripSnapshots(handler) { this.startActiveShiftSnapshots(handler, 'TRIP_ACTIVE') },
  stopActiveTripSnapshots() { this.stopActiveShiftSnapshots() },
  reset() {
    lastSnapshotAt = 0
    currentState = 'WAITING'
    this.stopActiveShiftSnapshots()
  }
}

export const LOCATION_SNAPSHOT_INTERVAL_MS = GPS_INTERVALS_MS.WAITING
export const LOCATION_SNAPSHOT_INTERVALS_MS = GPS_INTERVALS_MS
