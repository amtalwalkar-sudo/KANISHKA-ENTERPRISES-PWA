import { LocationRepository } from '../../repositories/locationRepository.js'

const getNativePlaceName = async ({ latitude, longitude }) => {
  try {
    const bridge = globalThis?.KFE_NATIVE_GEOCODER
    if (bridge?.reverseGeocode) {
      const result = await bridge.reverseGeocode({ latitude, longitude })
      return result?.placeName || null
    }
  } catch (_) {}
  return null
}

export async function captureLifecycleLocation({ entityType, entityId, eventType }) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(async position => {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      const capturedAt = new Date(position.timestamp || Date.now()).toISOString()
      const placeName = await getNativePlaceName({ latitude, longitude })
      try {
        resolve(await LocationRepository.record({
          entityType,
          entityId,
          eventType,
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          capturedAt,
          placeName
        }))
      } catch (_) { resolve(null) }
    }, () => resolve(null), {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 8000
    })
  })
}
