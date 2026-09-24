<p align="center"><img src="../brand/trace-banner.svg" alt="TRACE official wordmark" width="680" /></p>

# Privacy & Safety

TRACE is location-first, so safety is part of the architecture rather than a later feature.

## Threat model

A naive live map could enable stalking, home-address inference, route prediction or unwanted interception. TRACE therefore does not expose precise public location by default.

## Default rules

- Live discoverability is opt-in.
- Public discovery uses coarse location cells.
- Exact position is session-scoped.
- A join/share relationship must be accepted before exact live position is available.
- Users can stop sharing instantly.
- Start/end portions of public routes can be masked.
- Private activities never contribute identifiable live history.
- Safety sharing is explicit and revocable.

## Firebase controls

- Firebase Authentication for identity.
- App Check to reduce unauthorized client access.
- Firestore and Realtime Database Security Rules for ownership/relationship checks.
- Cloud Functions for privileged state transitions.
- Cloud Storage rules scoped to the owning user or explicitly shared activity.

## Product safety states

Suggested session visibility:

- `private`
- `friends`
- `public_coarse`
- `joinable`

Suggested join lifecycle:

- `requested`
- `accepted`
- `declined`
- `cancelled`
- `expired`

Only `accepted` sessions should unlock precise interception data.
