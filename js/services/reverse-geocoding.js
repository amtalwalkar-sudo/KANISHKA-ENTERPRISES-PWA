function validCoordinate(value, min, max) {
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max
}

export function formatPlaceName(address = {}) {
  const parts = [
    address.road,
    address.neighbourhood || address.suburb,
    address.city || address.town || address.village || address.municipality,
    address.state,
    address.postcode,
    address.country,
  ].map(value => String(value || '').trim()).filter(Boolean)
  return [...new Set(parts)].join(', ')
}

export async function reverseGeocode(latitude, longitude, { fetchImpl = globalThis.fetch, signal } = {}) {
  if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180) || typeof fetchImpl !== 'function') return null
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`
  try {
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal })
    if (!response?.ok) return null
    const data = await response.json()
    const placeName = formatPlaceName(data?.address)
    return placeName || String(data?.display_name || '').trim() || null
  } catch {
    return null
  }
}
