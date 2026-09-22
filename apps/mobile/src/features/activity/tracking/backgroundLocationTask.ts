import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { reduceActivitySession } from '../session/ActivitySessionMachine';
import { activityStore } from '../storage/SqliteActivityStore';

export const BACKGROUND_LOCATION_TASK = 'trace-background-location';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;

  const session = await activityStore.loadActiveSession();
  if (!session) return;

  const locations =
    (data as { locations?: Location.LocationObject[] }).locations ?? [];

  let nextSession = session;

  for (const location of locations) {
    nextSession = reduceActivitySession(nextSession, {
      type: 'LOCATION',
      sample: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracyM: location.coords.accuracy ?? undefined,
        speedMps: location.coords.speed ?? undefined,
        altitudeM: location.coords.altitude ?? undefined,
      },
    });
  }

  await activityStore.saveSession(nextSession);
});
