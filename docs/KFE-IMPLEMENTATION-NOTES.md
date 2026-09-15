# KFE Implementation Notes

> **Purpose:** Retrievable implementation notes only. These are not architecture rules, Stage 10 rules, frozen requirements, or product decisions.

## Android / Capacitor Location Implementation Note

When implementing KFE's shift-based background location evidence later, verify and handle:

- Android location permissions and permission-state changes
- battery optimization / power-management restrictions
- foreground-service requirements and declarations for location work
- Android lifecycle/background execution behavior
- OEM-specific background execution and battery-management behavior
- recovery/restart behavior if the location service is stopped or interrupted
- persistent foreground-service notification behavior

This note exists so the implementation phase explicitly checks these constraints. It must **not** be interpreted as a current Stage 10 design rule or frozen architecture requirement.

Current design context: KFE's location session is intended to start at Shift Start and end after Shift End. Periodic pings are the normal/default approach; continuous GPS may be an optional higher-detail mode. The Android/native implementation should later determine how reliably those modes can be delivered while another app such as Maps or Uber is foreground.
