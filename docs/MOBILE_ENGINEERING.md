<p align="center"><img src="../brand/trace-banner.svg" alt="TRACE official wordmark" width="680" /></p>

# Mobile Engineering

TRACE is designed so the hardest mobile concerns live outside UI components.

## Activity lifecycle

```text
IDLE
  ↓ START
RECORDING ←→ PAUSED
  ↓ FINISH
PENDING_SYNC
  ↓ server acknowledgement
SYNCED
```

The domain reducer lives in:

`apps/mobile/src/features/activity/session/ActivitySessionMachine.ts`

Location updates are accepted only while recording. Poor-accuracy samples can be rejected before they affect product metrics.

## Offline persistence

The state machine does not know whether persistence is SQLite, MMKV or another native store.

`ActivityStore` defines the contract for:

- saving the active session;
- recovering after app/process interruption;
- enumerating pending activities;
- marking server acknowledgement;
- removing local data after safe synchronization.

## Realtime transport

`LivePresenceService` separates product logic from Firebase implementation.

The implementation must publish:

- **coarse** presence for discovery;
- **precise** coordinates only in session-scoped protected storage.

This prevents UI code from accidentally writing exact coordinates to public presence paths.

## Background tracking requirements

The eventual native integration should handle:

- iOS When In Use → Always authorization flow where justified;
- Android foreground-service requirements;
- background execution constraints;
- battery-aware sampling;
- significant GPS accuracy degradation;
- app termination/relaunch;
- offline operation;
- explicit user-visible recording state.

TRACE should never imply hidden or silent background tracking.
