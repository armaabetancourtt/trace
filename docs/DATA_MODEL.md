<p align="center"><img src="../brand/trace-banner.svg" alt="TRACE official wordmark" width="680" /></p>

# Data Model

## Firestore

### users/{uid}

Durable profile/preferences. Do not store continuous live coordinates here.

### activities/{activityId}

```ts
{
  ownerId: string,
  activityType: 'run' | 'walk' | 'ride',
  startedAt: Timestamp,
  finishedAt: Timestamp,
  durationSec: number,
  distanceM: number,
  averagePaceSecPerKm?: number,
  elevationGainM?: number,
  routeRef?: string,
  privacy: 'private' | 'friends' | 'public',
  insightVersion?: string
}
```

### joinRequests/{requestId}

Request/accept flow for live sessions.

### challenges/{challengeId}

Collective/geographic challenge metadata and progress summaries.

## Realtime Database

### /liveSessions/{sessionId}

Contains only session-scoped ephemeral data.

### /presence/{uid}

Coarse discoverability state with last-updated timestamp.

### /preciseSessionLocation/{sessionId}/{uid}

Protected by membership/accepted-join rules.
