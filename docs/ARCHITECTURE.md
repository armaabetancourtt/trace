# TRACE Architecture

## Design goal

TRACE must support two very different data modes:

1. **durable product state** — profiles, completed activities, challenges, friendships, requests;
2. **ephemeral live movement** — presence, approximate live positions, session membership and short-lived coordination.

Using one storage pattern for both would create unnecessary cost, privacy risk and write amplification.

## Mobile client

React Native + TypeScript is the primary client.

The client is responsible for:

- foreground/background location permission handling;
- battery-aware GPS sampling;
- local activity persistence;
- offline recovery;
- live map rendering;
- privacy state and discoverability controls;
- batching route samples for upload.

## Firebase split

### Firestore

Use for durable documents:

- users;
- activities;
- friendships;
- join requests;
- challenges;
- computed insights;
- route metadata.

### Realtime Database

Use for highly dynamic state:

- active session presence;
- coarse location cells;
- session participant membership;
- live pace/status;
- ephemeral pacer availability.

TTL/cleanup logic should remove stale live sessions.

### Cloud Functions

Functions own trusted transitions such as:

- accepting join requests;
- fan-out notifications;
- finalizing an activity summary;
- computing derived metrics;
- matching pacer candidates;
- cleaning stale presence;
- validating privileged writes.

## Route storage

During a run, samples live in a local queue. At completion the client produces a normalized route artifact and summary.

A practical representation can be:

- encoded polyline / compressed coordinate series;
- optional detailed route file in Cloud Storage;
- summary metrics in Firestore.

This avoids thousands of permanent Firestore documents per activity.

## Realtime privacy boundary

Public discovery should use a coarse geospatial cell/geohash rather than exact coordinates.

Exact location can be placed in a session-scoped path only after an accepted join/share relationship.

## Future ML

Training datasets should be generated from explicitly consented and de-identified activity data. Raw public live coordinates should never become an unrestricted analytics dataset.
