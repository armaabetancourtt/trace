<p align="center"><img src="../brand/trace-banner.svg" alt="TRACE official wordmark" width="680" /></p>

# Engineering Roadmap

## Phase 1 — Foundation

- [x] Firebase-first architecture
- [x] privacy model
- [x] Firestore / RTDB / Storage rules baseline
- [x] offline recorder domain layer
- [x] geospatial utilities
- [x] interception baseline
- [x] pacer ranking baseline
- [x] activity metric computation
- [ ] Firebase emulator tests
- [ ] native mobile shell

## Phase 2 — Record a real activity

- background location permissions
- local SQLite persistence
- start / pause / resume / finish state machine
- route rendering
- offline recovery
- final activity upload
- post-run summary

## Phase 3 — Live movement network

- opt-in live presence
- coarse public discovery
- stale-presence cleanup
- live session membership
- join request lifecycle
- exact-location release after acceptance
- FCM notifications

## Phase 4 — Find a Pacer

- candidate discovery
- explainable ranking baseline
- request/accept flow
- session creation
- match-quality telemetry

## Phase 5 — TRACE Intelligence

- split analysis
- rolling baseline metrics
- consistency score
- personal records
- route difficulty
- training trends

## Phase 6 — Data / ML

Only after real, consented data exists:

- pace prediction
- learned pacer ranking
- route clustering
- anomaly detection
- personalized challenge ranking
