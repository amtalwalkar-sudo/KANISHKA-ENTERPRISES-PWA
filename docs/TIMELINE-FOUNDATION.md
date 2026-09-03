# KFE 2.0 Timeline Foundation

Timeline answers what happened and in what order. Work and originating ERP modules remain authoritative.

## Horizons
- L1: Day — today's chronological activity.
- L2: Week — the current week's activity.
- L3: Long-term — retained historical activity.

## Event contract
`KFE_TIMELINE_EVENT_V1` is the Timeline extensibility boundary. Conforming authoritative events can be displayed without a Timeline-specific feature for every future Work recording capability.

Work timestamps remain authoritative. GPS/location is displayed only when captured by the authoritative event. Business/personal scope is preserved and Timeline does not alter accounting.

Timeline never creates, edits, corrects, or silently reinterprets source records. Missing or invalid values remain unavailable. Ordering is deterministic by authoritative occurrence time, then stable event identity.

Break handling and Tax Reserve are not part of this contract.
