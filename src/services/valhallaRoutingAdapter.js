const toShape = (points) => points.map((point) => {
  const capturedAt = point.capturedAt || point.timestamp
  return { lat: Number(point.latitude), lon: Number(point.longitude), time: capturedAt ? Math.floor(new Date(capturedAt).getTime() / 1000) : undefined }
}).filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))

export class ValhallaRoutingAdapter {
  constructor({ endpoint = '', fetchImpl = globalThis.fetch } = {}) { this.endpoint = endpoint.replace(/\/$/, ''); this.fetchImpl = fetchImpl }
  async routeTrace(points) {
    if (!this.endpoint || typeof this.fetchImpl !== 'function') return null
    const shape = toShape(points)
    if (shape.length < 2) return null
    const response = await this.fetchImpl(`${this.endpoint}/trace_attributes`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shape, shape_match: 'map_snap', costing: 'auto', units: 'kilometers', format: 'osrm' }) })
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
