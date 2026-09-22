import type { ActivitySessionState } from '../session/ActivitySessionMachine';

export type PendingActivity = Extract<
  ActivitySessionState,
  { phase: 'pending_sync' }
>;

/**
 * Persistence boundary for offline-first recording.
 *
 * A native implementation can use SQLite/MMKV/another local store without
 * leaking storage concerns into the recorder state machine.
 */
export interface ActivityStore {
  saveSession(session: ActivitySessionState): Promise<void>;
  loadActiveSession(): Promise<ActivitySessionState | null>;
  listPendingSync(): Promise<PendingActivity[]>;
  markSynced(localId: string, remoteActivityId: string): Promise<void>;
  remove(localId: string): Promise<void>;
}
