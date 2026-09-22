import type { LocationSample } from '../tracking/ActivityRecorder';

export type ActivityKind = 'run' | 'walk' | 'ride';

export type ActivitySessionState =
  | {
      phase: 'idle';
    }
  | {
      phase: 'recording';
      localId: string;
      activityType: ActivityKind;
      startedAt: number;
      samples: LocationSample[];
    }
  | {
      phase: 'paused';
      localId: string;
      activityType: ActivityKind;
      startedAt: number;
      samples: LocationSample[];
      pausedAt: number;
    }
  | {
      phase: 'pending_sync';
      localId: string;
      activityType: ActivityKind;
      startedAt: number;
      finishedAt: number;
      samples: LocationSample[];
    };

export type ActivitySessionEvent =
  | {
      type: 'START';
      localId: string;
      activityType: ActivityKind;
      startedAt?: number;
    }
  | {
      type: 'LOCATION';
      sample: LocationSample;
    }
  | {
      type: 'PAUSE';
      at?: number;
    }
  | {
      type: 'RESUME';
    }
  | {
      type: 'FINISH';
      at?: number;
    }
  | {
      type: 'RESET';
    };

export function reduceActivitySession(
  state: ActivitySessionState,
  event: ActivitySessionEvent,
): ActivitySessionState {
  switch (event.type) {
    case 'START':
      if (state.phase !== 'idle') {
        throw new Error('Cannot start while another activity is active');
      }

      return {
        phase: 'recording',
        localId: event.localId,
        activityType: event.activityType,
        startedAt: event.startedAt ?? Date.now(),
        samples: [],
      };

    case 'LOCATION':
      if (state.phase !== 'recording') return state;

      if (event.sample.accuracyM && event.sample.accuracyM > 80) {
        return state;
      }

      return {
        ...state,
        samples: [...state.samples, event.sample],
      };

    case 'PAUSE':
      if (state.phase !== 'recording') return state;

      return {
        ...state,
        phase: 'paused',
        pausedAt: event.at ?? Date.now(),
      };

    case 'RESUME':
      if (state.phase !== 'paused') return state;

      return {
        phase: 'recording',
        localId: state.localId,
        activityType: state.activityType,
        startedAt: state.startedAt,
        samples: state.samples,
      };

    case 'FINISH':
      if (state.phase !== 'recording' && state.phase !== 'paused') {
        return state;
      }

      return {
        phase: 'pending_sync',
        localId: state.localId,
        activityType: state.activityType,
        startedAt: state.startedAt,
        finishedAt: event.at ?? Date.now(),
        samples: state.samples,
      };

    case 'RESET':
      return { phase: 'idle' };

    default:
      return state;
  }
}
