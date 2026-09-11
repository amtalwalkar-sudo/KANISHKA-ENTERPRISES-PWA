import { describe, expect, it } from "vitest"
import { MovementAccountingService, haversineDistanceKm } from "../movementAccountingService.js"

const garage = { latitude: 19.0000, longitude: 72.0000, accuracy: 5 }
const pickup1 = { latitude: 19.0100, longitude: 72.0000, accuracy: 5 }
const drop1 = { latitude: 19.0200, longitude: 72.0000, accuracy: 5 }
const pickup2 = { latitude: 19.0300, longitude: 72.0000, accuracy: 5 }
const drop2 = { latitude: 19.0400, longitude: 72.0000, accuracy: 5 }

const trips = [
  { id: "trip-1", status: "COMPLETED", tripStartAt: "2026-09-12T08:00:00Z", tripEndAt: "2026-09-12T08:30:00Z", tripStartLocation: pickup1, tripEndLocation: drop1 },
  { id: "trip-2", status: "COMPLETED", tripStartAt: "2026-09-12T09:00:00Z", tripEndAt: "2026-09-12T09:30:00Z", tripStartLocation: pickup2, tripEndLocation: drop2 }
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
    expect(result.segments.every((segment) => segment.authority === "GPS_ESTIMATE")).toBe(true)
  })

  it("reconciles GPS estimates to authoritative shift odometer and leaves positive remainder unclassified", async () => {
    const result = await MovementAccountingService.reconcileShiftMovement({
      garageLocation: garage,
      trips,
      startOdometer: 100,
      endOdometer: 101
    })
    expect(result.totalShiftVehicleKm).toBe(1)
    expect(result.authoritativeOdometerKm).toBe(1)
    expect(result.personalKmInShift).toBe(0)
    expect(result.reconciliationStatus).toBe("RECONCILED")
    expect(result.unclassifiedKm).toBeGreaterThanOrEqual(0)
    expect(result.segments.find((segment) => segment.classification === "UNCLASSIFIED")?.authority).toBe("ODOMETER_REMAINDER")
  })

  it("upgrades only manually reconciled Uber Business KM to authoritative", async () => {
    const result = await MovementAccountingService.reconcileShiftMovement({
      garageLocation: garage,
      trips,
      startOdometer: 100,
      endOdometer: 105,
      manualBusinessKmByTripId: { "trip-1": 2.5 }
    })
    const trip1 = result.segments.find((segment) => segment.tripId === "trip-1")
    const trip2 = result.segments.find((segment) => segment.tripId === "trip-2")
    expect(trip1.distanceKm).toBe(2.5)
    expect(trip1.authority).toBe("MANUAL_UBER")
    expect(trip1.confidence).toBe("AUTHORITATIVE")
    expect(trip2.authority).toBe("GPS_ESTIMATE")
    expect(result.personalKmInShift).toBe(0)
  })

  it("flags an over-estimated GPS/manual movement total instead of fabricating a negative remainder", async () => {
    const result = await MovementAccountingService.reconcileShiftMovement({
      garageLocation: garage,
      trips,
      startOdometer: 100,
      endOdometer: 100.1,
      manualBusinessKmByTripId: { "trip-1": 5 }
    })
    expect(result.reconciliationStatus).toBe("OVER_ESTIMATE")
    expect(result.unclassifiedKm).toBe(0)
    expect(result.reconciliationDifferenceKm).toBeLessThan(0)
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
