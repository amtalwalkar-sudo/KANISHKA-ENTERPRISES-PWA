import { describe, expect, it } from "vitest"
import { MovementAccountingService, haversineDistanceKm } from "../movementAccountingService.js"

const garage = { latitude: 19.0000, longitude: 72.0000, accuracy: 5 }
const pickup1 = { latitude: 19.0100, longitude: 72.0000, accuracy: 5 }
const drop1 = { latitude: 19.0200, longitude: 72.0000, accuracy: 5 }
const pickup2 = { latitude: 19.0300, longitude: 72.0000, accuracy: 5 }
const drop2 = { latitude: 19.0400, longitude: 72.0000, accuracy: 5 }

const trips = [
  { status: "COMPLETED", tripStartAt: "2026-09-12T08:00:00Z", tripEndAt: "2026-09-12T08:30:00Z", tripStartLocation: pickup1, tripEndLocation: drop1 },
  { status: "COMPLETED", tripStartAt: "2026-09-12T09:00:00Z", tripEndAt: "2026-09-12T09:30:00Z", tripStartLocation: pickup2, tripEndLocation: drop2 }
]

describe("MovementAccountingService", () => {
  it("calculates the expected in-shift movement segments", async () => {
    const result = await MovementAccountingService.calculateDeadMiles({ garageLocation: garage, trips })
    expect(result.segments).toHaveLength(5)
    expect(result.segments.map((s) => s.label)).toEqual([
      "GARAGE_TO_FIRST_PICKUP",
      "TRIP_1_BUSINESS",
      "TRIP_1_END_TO_TRIP_2_START",
      "TRIP_2_BUSINESS",
      "LAST_TRIP_TO_GARAGE"
    ])
    expect(result.segments.filter((s) => s.classification === "DEAD")).toHaveLength(3)
    expect(result.deadMilesKm).toBeGreaterThan(0)
    expect(result.businessMilesKm).toBeGreaterThan(0)
    expect(haversineDistanceKm(garage, pickup1)).toBeGreaterThan(0)
  })

  it("handles a missing trip endpoint without fabricating distance", async () => {
    const missing = await MovementAccountingService.calculateDeadMiles({
      garageLocation: garage,
      trips: [{ ...trips[0], tripEndLocation: null }]
    })
    expect(missing.segments[1].distanceKm).toBeNull()
    expect(missing.deadMilesKm).toBeGreaterThanOrEqual(0)
  })
})
