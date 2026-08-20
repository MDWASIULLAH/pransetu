# PRANSETU Testing Strategy

## Rule

Critical functionality is not complete because it compiles. It is complete only after appropriate automated tests and real-device/service validation.

## Android

Test:

- app startup without internet
- SOS creation without internet
- local persistence
- app/process restart
- location freshness and accuracy metadata
- duplicate SOS handling
- queue/retry behavior
- localization switching
- relay packet validation
- TTL/hop limit
- acknowledgement handling

## Backend

Test:

- authentication/authorization
- schema validation
- idempotent SOS ingestion
- duplicate packet handling
- geospatial queries
- webhook verification
- retry/idempotency behavior
- audit records

## Relay Physical Tests

Minimum target scenarios:

1. A -> B
2. A -> B -> C
3. A -> B -> C -> Gateway
4. Duplicate packet
5. Gateway disappears during transfer
6. Device restarts with queued SOS
7. Internet returns after offline period
8. Multiple concurrent SOS beacons
9. Low battery power state on Relay Nodes
10. Hardware Watchdog recovery

## AI & ML Integration Tests

Test:

- ML Route Validation fallback when real-time DEM data fails
- Domino Effect Cascade graph accuracy with synthetic stress test data
- Latency check for AI inference on edge nodes (< 200ms target)
- Priority Triage engine consistency with standard Medical Triage rules
