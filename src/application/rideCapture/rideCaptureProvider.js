export const RideCaptureProviderError = class extends Error {
  constructor(message = 'Ride capture provider is not configured.') {
    super(message)
    this.name = 'RideCaptureProviderError'
  }
}

export const createRideCaptureProvider = (adapter = null) => Object.freeze({
  async extractRide(image) {
    if (!adapter || typeof adapter.extractRide !== 'function') {
      throw new RideCaptureProviderError()
    }
    const result = await adapter.extractRide(image)
    if (!result || typeof result !== 'object') throw new RideCaptureProviderError('Ride capture provider returned no extraction.')
    return result
  },
})

export const getConfiguredRideCaptureProvider = () => createRideCaptureProvider(globalThis?.KFE_RIDE_CAPTURE_PROVIDER || null)
