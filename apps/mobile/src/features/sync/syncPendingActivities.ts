import { getAuth } from '@react-native-firebase/auth';
import {
  getFunctions,
  httpsCallable,
} from '@react-native-firebase/functions';
import {
  getStorage,
  ref as storageRef,
  uploadString,
} from '@react-native-firebase/storage';
import { computeActivityMetrics } from '@trace/shared';

import { activityStore } from '../activity/storage/SqliteActivityStore';
import type { PendingActivity } from '../activity/storage/ActivityStore';
import { createRouteArtifact } from './routeArtifact';

type FinalizeActivityRequest = {
  localId: string;
  activityType: PendingActivity['activityType'];
  startedAtMs: number;
  finishedAtMs: number;
  durationSec: number;
  distanceM: number;
  averagePaceSecPerKm: number | null;
  elevationGainM: number;
  sampleCount: number;
  routePath: string;
};

type FinalizeActivityResponse = {
  activityId: string;
  created: boolean;
};

export type SyncResult =
  | {
      localId: string;
      status: 'synced';
      activityId: string;
    }
  | {
      localId: string;
      status: 'failed';
      error: string;
    };

export async function syncAllPendingActivities(): Promise<SyncResult[]> {
  const user = getAuth().currentUser;
  if (!user) return [];

  const pending = await activityStore.listPendingSync();
  const results: SyncResult[] = [];

  for (const activity of pending) {
    try {
      const metrics = computeActivityMetrics(activity.samples);
      const routePath =
        `users/${user.uid}/activities/${activity.localId}/route.json`;

      const artifact = JSON.stringify(createRouteArtifact(activity));
      const routeReference = storageRef(getStorage(), routePath);

      await uploadString(routeReference, artifact, 'raw', {
        contentType: 'application/json',
        cacheControl: 'private,max-age=31536000,immutable',
      });

      const finalize = httpsCallable<
        FinalizeActivityRequest,
        FinalizeActivityResponse
      >(getFunctions(), 'finalizeActivity');

      const response = await finalize({
        localId: activity.localId,
        activityType: activity.activityType,
        startedAtMs: activity.startedAt,
        finishedAtMs: activity.finishedAt,
        durationSec: metrics.durationSec,
        distanceM: metrics.distanceM,
        averagePaceSecPerKm: metrics.averagePaceSecPerKm,
        elevationGainM: metrics.elevationGainM,
        sampleCount: activity.samples.length,
        routePath,
      });

      await activityStore.markSynced(
        activity.localId,
        response.data.activityId,
      );

      results.push({
        localId: activity.localId,
        status: 'synced',
        activityId: response.data.activityId,
      });
    } catch (cause) {
      results.push({
        localId: activity.localId,
        status: 'failed',
        error:
          cause instanceof Error
            ? cause.message
            : 'Unknown activity sync error',
      });
    }
  }

  return results;
}
