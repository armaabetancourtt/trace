import type { ActiveActivity } from '../activity/tracking/ActivityRecorder';

export type ActivityUpload = {
  localId: string;
  summary: {
    activityType: ActiveActivity['activityType'];
    startedAt: number;
    finishedAt: number;
    sampleCount: number;
  };
  route: ActiveActivity['samples'];
};

/**
 * Sync boundary for finished activities.
 *
 * Production flow:
 * 1. read pending activity from local DB;
 * 2. create an idempotency key from localId;
 * 3. upload compressed route artifact;
 * 4. call a trusted Cloud Function to finalize Firestore summary;
 * 5. mark local row as synced only after server acknowledgement.
 */
export async function syncPendingActivity(activity: ActiveActivity): Promise<ActivityUpload> {
  if (activity.status !== 'pending_sync') {
    throw new Error('Only finished activities can be synced');
  }

  return {
    localId: activity.localId,
    summary: {
      activityType: activity.activityType,
      startedAt: activity.startedAt,
      finishedAt: activity.samples.at(-1)?.timestamp ?? Date.now(),
      sampleCount: activity.samples.length,
    },
    route: activity.samples,
  };
}
