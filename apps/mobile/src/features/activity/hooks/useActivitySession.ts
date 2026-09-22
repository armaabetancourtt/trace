import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeActivityMetrics } from '@trace/shared';

import {
  reduceActivitySession,
  type ActivityKind,
  type ActivitySessionState,
} from '../session/ActivitySessionMachine';
import { activityStore } from '../storage/SqliteActivityStore';
import {
  requestTrackingPermissions,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../tracking/LocationTrackingService';

const POLL_INTERVAL_MS = 1_000;

export function useActivitySession(activityType: ActivityKind) {
  const [session, setSession] = useState<ActivitySessionState>({
    phase: 'idle',
  });
  const [error, setError] = useState<string | null>(null);

  const refreshFromDisk = useCallback(async () => {
    const persisted = await activityStore.loadActiveSession();
    if (persisted) setSession(persisted);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshFromDisk();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [refreshFromDisk]);

  const start = useCallback(async () => {
    try {
      setError(null);
      await requestTrackingPermissions();

      const next = reduceActivitySession(
        { phase: 'idle' },
        {
          type: 'START',
          localId: `activity-${Date.now()}`,
          activityType,
        },
      );

      await activityStore.saveSession(next);
      setSession(next);
      await startBackgroundTracking();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to start activity.');
    }
  }, [activityType]);

  const pause = useCallback(async () => {
    if (session.phase !== 'recording') return;

    const next = reduceActivitySession(session, { type: 'PAUSE' });
    await activityStore.saveSession(next);
    setSession(next);
    await stopBackgroundTracking();
  }, [session]);

  const resume = useCallback(async () => {
    if (session.phase !== 'paused') return;

    const next = reduceActivitySession(session, { type: 'RESUME' });
    await activityStore.saveSession(next);
    setSession(next);
    await startBackgroundTracking();
  }, [session]);

  const finish = useCallback(async () => {
    if (session.phase !== 'recording' && session.phase !== 'paused') {
      return null;
    }

    const next = reduceActivitySession(session, { type: 'FINISH' });
    await activityStore.saveSession(next);
    setSession(next);
    await stopBackgroundTracking();

    return next;
  }, [session]);

  const metrics = useMemo(() => {
    if (session.phase === 'idle') {
      return computeActivityMetrics([]);
    }

    return computeActivityMetrics(session.samples);
  }, [session]);

  const route = useMemo(() => {
    if (session.phase === 'idle') return [];

    return session.samples.map(({ latitude, longitude }) => ({
      latitude,
      longitude,
    }));
  }, [session]);

  return {
    session,
    metrics,
    route,
    error,
    start,
    pause,
    resume,
    finish,
  };
}
