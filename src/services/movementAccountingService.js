const EARTH_RADIUS_KM = 6371.0088

const finite = (value) => Number.isFinite(Number(value))

const normalizeLocation = (location) => {
  if (!location) return null
  const latitude = Number(location.latitude)
  const longitude = Number(location.longitude)
  const accuracy = location.accuracy == null ? null : Number(location.accuracy)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return { latitude, longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null }
}

export const haversineDistanceKm = (from, to) => {
  const a = normalizeLocation(from)
  const b = normalizeLocation(to)
  if (!a || !b) return null
  const lat1 = a.latitude * Math.PI / 180
  const lat2 = b.latitude * Math.PI / 180
  const dLat = lat2 - lat1
  const dLon = (b.longitude - a.longitude) * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const distance = async (from, to, router) => {
  const a = normalizeLocation(from)
  const b = normalizeLocation(to)
  if (!a || !b) return { distanceKm: null, method: 'UNAVAILABLE', confidence: 'UNAVAILABLE' }
  if (typeof router === 'function') {
    try {
      const routed = Number(await router(a, b))
      if (Number.isFinite(routed) && routed >= 0) return { distanceKm: routed, method: 'ROUTED', confidence: 'ESTIMATED_ROAD' }
    } catch (error) {
      console.warn('Movement router unavailable; using straight-line estimate.', error)
    }
  }
  const straight = haversineDistanceKm(a, b)
  return { distanceKm: straight, method: 'HAVERSINE', confidence: 'ESTIMATED_STRAIGHT_LINE' }
}

const makeSegment = async ({ from, to, classification, label, router }) => ({
  label,
  classification,
  from: normalizeLocation(from),
  to: normalizeLocation(to),
  ...(await distance(from, to, router))
})

export const MovementAccountingService = {
  async calculateSegments({ garageLocation, trips = [], router } = {}) {
    const garage = normalizeLocation(garageLocation)
    if (!garage) throw new Error('A valid garage location is required to calculate garage/dead-mile segments.')
    const completed = [...trips]
      .filter((trip) => trip?.status === 'COMPLETED' && trip?.tripStartAt && trip?.tripEndAt)
      .sort((a, b) => new Date(a.tripStartAt) - new Date(b.tripStartAt))

    const segments = []
    if (!completed.length) return { segments, deadMilesKm: 0, businessMilesKm: 0, unclassifiedKm: 0 }

    segments.push(await makeSegment({
      from: garage,
      to: completed[0].tripStartLocation,
      classification: 'DEAD',
      label: 'GARAGE_TO_FIRST_PICKUP',
      router
    }))

    for (let i = 0; i < completed.length; i += 1) {
      const trip = completed[i]
      segments.push(await makeSegment({
        from: trip.tripStartLocation,
        to: trip.tripEndLocation,
        classification: 'BUSINESS',
        label: `TRIP_${i + 1}_BUSINESS`,
        router
      }))

      const next = completed[i + 1]
      segments.push(await makeSegment({
        from: trip.tripEndLocation,
        to: next ? next.tripStartLocation : garage,
        classification: 'DEAD',
        label: next ? `TRIP_${i + 1}_END_TO_TRIP_${i + 2}_START` : `LAST_TRIP_TO_GARAGE`,
        router
      }))
    }

    const deadMilesKm = segments
      .filter((segment) => segment.classification === 'DEAD' && finite(segment.distanceKm))
      .reduce((sum, segment) => sum + Number(segment.distanceKm), 0)
    const businessMilesKm = segments
      .filter((segment) => segment.classification === 'BUSINESS' && finite(segment.distanceKm))
      .reduce((sum, segment) => sum + Number(segment.distanceKm), 0)
    const unclassifiedKm = segments
      .filter((segment) => segment.classification === 'UNCLASSIFIED' && finite(segment.distanceKm))
      .reduce((sum, segment) => sum + Number(segment.distanceKm), 0)

    return { segments, deadMilesKm, businessMilesKm, unclassifiedKm }
  },

  calculateDeadMiles(options = {}) {
    return this.calculateSegments(options)
  }
}
