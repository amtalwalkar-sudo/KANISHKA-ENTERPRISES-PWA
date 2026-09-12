const DEFAULT_VALHALLA_ENDPOINT = 'https://valhalla1.openstreetmap.de'
const KFE_CLIENT_ID = 'KANISHKA-ENTERPRISES-PWA'

const toShape = (points) => points.map((point) => {
  const capturedAt = point.capturedAt || point.timestamp
  const milliseconds = capturedAt ? new Date(capturedAt).getTime() : NaN
  return { lat: Number(point.latitude), lon: Number(point.longitude), ...(Number.isFinite(milliseconds) ? { time: Math.floor(milliseconds / 1000) } : {}) }
}).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))

const endpointFromRuntime = () => {
  try {
    return globalThis.__KFE_VALHALLA_ENDPOINT__ || import.meta.env?.VITE_VALHALLA_ENDPOINT || DEFAULT_VALHALLA_ENDPOINT
  } catch {
    return globalThis.__KFE_VALHALLA_ENDPOINT__ || DEFAULT_VALHALLA_ENDPOINT
  }
}

export class ValhallaRoutingAdapter {
  constructor({ endpoint = endpointFromRuntime(), fetchImpl = globalThis.fetch, clientId = KFE_CLIENT_ID } = {}) {
    this.endpoint = String(endpoint || DEFAULT_VALHALLA_ENDPOINT).replace(/\/$/, '')
    this.fetchImpl = fetchImpl
    this.clientId = clientId
  }

  async routeTrace(points) {
    if (typeof this.fetchImpl !== 'function') return null
    const shape = toShape(points)
    if (shape.length < 2) return null
    const response = await this.fetchImpl(`${this.endpoint}/trace_attributes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Client-Id': this.clientId },
      body: JSON.stringify({ shape, shape_match: 'map_snap', costing: 'auto', units: 'kilometers', format: 'osrm' })
    })
    if (!response.ok) throw new Error(`Valhalla trace request failed: ${response.status}`)
    const payload = await response.json()
    const distance = Number(payload.trip?.summary?.length)
    return {
      provider: 'valhalla',
      method: 'VALHALLA_TRACE_ATTRIBUTES_MAP_MATCH',
      confidence: 'ESTIMATED_ROAD_TRACE',
      distanceKm: Number.isFinite(distance) ? distance : null,
      geometry: payload.trip?.legs || [],
      provenance: { provider: 'valhalla', endpoint: this.endpoint, operation: 'trace_attributes', shapeMatch: 'map_snap', costing: 'auto', units: 'kilometers', sourcePointCount: shape.length },
      raw: payload
    }
  }
}

export const getValhallaEndpoint = () => endpointFromRuntime()
