import { ShiftTripRepository } from '../../repositories/shiftTripRepository.js'
import { normalizeRideExtraction, validateRideExtraction } from '../../domain/rideCapture/rideRecord.js'
import { getConfiguredRideCaptureProvider } from './rideCaptureProvider.js'

const readImage = file => new Promise((resolve, reject) => {
  if (!file) return reject(new Error('Ride screenshot is required.'))
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(reader.error || new Error('Ride screenshot could not be read.'))
  reader.readAsDataURL(file)
})

const listShifts = async () => (await ShiftTripRepository.getAllShifts()).filter(s => s.status === 'COMPLETED').sort((a, b) => new Date(b.shiftEndAt || b.updatedAt) - new Date(a.shiftEndAt || a.updatedAt))

export const RideCaptureService = Object.freeze({
  async extract(file) {
    const image = await readImage(file)
    const provider = getConfiguredRideCaptureProvider()
    const extracted = await provider.extractRide({ dataUrl: image, fileName: file.name, mimeType: file.type })
    const normalized = normalizeRideExtraction(extracted)
    const validation = validateRideExtraction(normalized)
    if (!validation.valid) return { ok: false, stage: 'VALIDATION', errors: validation.errors, value: normalized }
    return { ok: true, stage: 'REVIEW', value: normalized }
  },
  validate(data) {
    const normalized = normalizeRideExtraction(data)
    const validation = validateRideExtraction(normalized)
    return { ok: validation.valid, value: normalized, errors: validation.errors }
  },
  async getReviewContext() {
    const [shifts] = await Promise.all([listShifts()])
    return { shifts }
  },
  async save(data) {
    const validation = this.validate(data)
    if (!validation.ok) return validation
    const record = await ShiftTripRepository.createCapturedRide(validation.value)
    return { ok: true, record }
  },
})
