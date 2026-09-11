const EARTH_RADIUS_KM = 6371.0088
const EPSILON_KM = 1e-6
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

const makeSegment = async ({ from, to, classification, label, router, tripId = null }) => ({
  id: `${label}:${tripId || 'SHIFT'}`,
  tripId,
  label,
  classification,
  authority: 'GPS_ESTIMATE',
  from: normalizeLocation(from),
  to: normalizeLocation(to),
  ...(await distance(from, to, router))
})

const sum = (segments, classification) => segments
  .filter((segment) => segment.classification === classification && finite(segment.distanceKm))
  .reduce((total, segment) => total + Number(segment.distanceKm), 0)

const normalizeManualKm = (trip, manualBusinessKmByTripId = {}) => {
  const value = manualBusinessKmByTripId[trip.id]
  if (value === undefined || value === null || value === '') return null
  const km = Number(value)
  if (!Number.isFinite(km) || km < 0) throw new Error(`Invalid Uber Business KM for trip ${trip.id}.`)
  return km
}

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
        router,
        tripId: trip.id
      }))

      const next = completed[i + 1]
      segments.push(await makeSegment({
        from: trip.tripEndLocation,
        to: next ? next.tripStartLocation : garage,
        classification: 'DEAD',
        label: next ? `TRIP_${i + 1}_END_TO_TRIP_${i + 2}_START` : 'LAST_TRIP_TO_GARAGE',
        router
      }))
    }

    return {
      segments,
      deadMilesKm: sum(segments, 'DEAD'),
      businessMilesKm: sum(segments, 'BUSINESS'),
      unclassifiedKm: sum(segments, 'UNCLASSIFIED')
    }
  },

  async reconcileShiftMovement({ garageLocation, trips = [], startOdometer, endOdometer, router, manualBusinessKmByTripId = {} } = {}) {
    const start = Number(startOdometer)
    const end = Number(endOdometer)
    if (!finite(start) || !finite(end) || start < 0 || end < start) {
      throw new Error('Valid Shift Start and End Odometer readings are required for movement reconciliation.')
    }

    const base = await this.calculateSegments({ garageLocation, trips, router })
    const totalShiftVehicleKm = end - start
    const manualByTrip = new Map()
    const reconciledSegments = base.segments.map((segment) => ({ ...segment }))

    for (const trip of trips.filter((item) => item?.status === 'COMPLETED')) {
      const manualKm = normalizeManualKm(trip, manualBusinessKmByTripId)
      if (manualKm === null) continue
      const segment = reconciledSegments.find((item) => item.tripId === trip.id && item.classification === 'BUSINESS')
      if (!segment) throw new Error(`Business segment not found for trip ${trip.id}.`)
      segment.distanceKm = manualKm
      segment.method = 'UBER_MANUAL'
      segment.confidence = 'AUTHORITATIVE'
      segment.authority = 'MANUAL_UBER'
      manualByTrip.set(trip.id, manualKm)
    }

    const classifiedKm = reconciledSegments
      .filter((segment) => (segment.classification === 'DEAD' || segment.classification === 'BUSINESS') && finite(segment.distanceKm))
      .reduce((total, segment) => total + Number(segment.distanceKm), 0)
    const unclassifiedKm = Math.max(0, totalShiftVehicleKm - classifiedKm)
    const reconciliationDifferenceKm = totalShiftVehicleKm - classifiedKm - unclassifiedKm

    if (classifiedKm - totalShiftVehicleKm > EPSILON_KM) {
      return {
        ...base,
        segments: reconciledSegments,
        totalShiftVehicleKm,
        manualBusinessKmByTripId: Object.fromEntries(manualByTrip),
        deadMilesKm: sum(reconciledSegments, 'DEAD'),
        businessMilesKm: sum(reconciledSegments, 'BUSINESS'),
        unclassifiedKm: 0,
        reconciliationDifferenceKm: totalShiftVehicleKm - classifiedKm,
        reconciliationStatus: 'OVER_ESTIMATE',
        personalKmInShift: 0,
        authoritativeOdometerKm: totalShiftVehicleKm
      }
    }

    if (unclassifiedKm > EPSILON_KM) {
      reconciledSegments.push({
        id: 'SHIFT_RECONCILIATION_UNCLASSIFIED',
        tripId: null,
        label: 'SHIFT_RECONCILIATION_REMAINDER',
        classification: 'UNCLASSIFIED',
        authority: 'ODOMETER_REMAINDER',
        distanceKm: unclassifiedKm,
        method: 'ODOMETER_RECONCILIATION',
        confidence: 'AUTHORITATIVE_REMAINDER'
      })
    }

    return {
      ...base,
      segments: reconciledSegments,
      totalShiftVehicleKm,
      manualBusinessKmByTripId: Object.fromEntries(manualByTrip),
      deadMilesKm: sum(reconciledSegments, 'DEAD'),
      businessMilesKm: sum(reconciledSegments, 'BUSINESS'),
      unclassifiedKm,
      reconciliationDifferenceKm,
      reconciliationStatus: 'RECONCILED',
      personalKmInShift: 0,
      authoritativeOdometerKm: totalShiftVehicleKm
    }
  },

  calculateDeadMiles(options = {}) {
    return this.calculateSegments(options)
  }
}
