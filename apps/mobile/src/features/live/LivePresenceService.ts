import type { Coordinate } from '@trace/shared';

import type { ActivityKind } from '../activity/session/ActivitySessionMachine';

export type LiveVisibility =
  | 'private'
  | 'friends'
  | 'public_coarse'
  | 'joinable';

export type LivePresenceUpdate = {
  sessionId: string;
  coordinate: Coordinate;
  activityType: ActivityKind;
  currentPaceSecPerKm?: number;
  visibility: LiveVisibility;
};

/**
 * Realtime transport boundary.
 *
 * Implementations should:
 * - publish only coarse position to public discovery;
 * - publish exact position only under a session-scoped protected path;
 * - attach server timestamps / TTL-friendly updatedAt values;
 * - remove live presence on disconnect when possible.
 */
export interface LivePresenceService {
  start(update: LivePresenceUpdate): Promise<void>;
  update(update: LivePresenceUpdate): Promise<void>;
  stop(sessionId: string): Promise<void>;
}
