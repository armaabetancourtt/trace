export type LocationSample = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracyM?: number;
  speedMps?: number;
  altitudeM?: number;
};

export type ActiveActivity = {
  localId: string;
  activityType: 'run' | 'walk' | 'ride';
  startedAt: number;
  samples: LocationSample[];
  status: 'recording' | 'paused' | 'finished' | 'pending_sync';
};

/**
 * Domain-level recorder buffer.
 *
 * Platform GPS/background-task integration should push samples into this
 * recorder and persist them to a local database. Network connectivity is NOT
 * required while recording.
 */
export class ActivityRecorder {
  private activity: ActiveActivity | null = null;

  start(localId: string, activityType: ActiveActivity['activityType']) {
    if (this.activity?.status === 'recording') {
      throw new Error('An activity is already recording');
    }

    this.activity = {
      localId,
      activityType,
      startedAt: Date.now(),
      samples: [],
      status: 'recording',
    };

    return this.activity;
  }

  append(sample: LocationSample) {
    if (!this.activity || this.activity.status !== 'recording') return;

    if (sample.accuracyM && sample.accuracyM > 80) return;

    this.activity.samples.push(sample);
  }

  pause() {
    if (this.activity?.status === 'recording') this.activity.status = 'paused';
  }

  resume() {
    if (this.activity?.status === 'paused') this.activity.status = 'recording';
  }

  finish() {
    if (!this.activity) throw new Error('No active activity');
    this.activity.status = 'pending_sync';
    return this.activity;
  }
}
