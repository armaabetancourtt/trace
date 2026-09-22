import {
  getDatabase,
  onDisconnect,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from '@react-native-firebase/database';
import { coarsenCoordinate } from '@trace/shared';

import type {
  LivePresenceService,
  LivePresenceUpdate,
} from './LivePresenceService';

const database = getDatabase();

export class FirebaseLivePresenceService implements LivePresenceService {
  async start(payload: LivePresenceUpdate) {
    await this.write(payload);

    const preciseRef = ref(
      database,
      `preciseSessionLocation/${payload.sessionId}/current`,
    );

    await onDisconnect(preciseRef).remove();
  }

  async update(payload: LivePresenceUpdate) {
    await this.write(payload);
  }

  async stop(sessionId: string) {
    await Promise.all([
      remove(ref(database, `liveSessions/${sessionId}`)),
      remove(ref(database, `preciseSessionLocation/${sessionId}`)),
    ]);
  }

  private async write(payload: LivePresenceUpdate) {
    const coarse = coarsenCoordinate(payload.coordinate, 300);

    await update(ref(database), {
      [`liveSessions/${payload.sessionId}`]: {
        ownerId: 'CLIENT_AUTH_UID_SET_SERVER_SIDE',
        visibility: payload.visibility,
        activityType: payload.activityType,
        startedAt: serverTimestamp(),
      },
      [`preciseSessionLocation/${payload.sessionId}/current`]: {
        latitude: payload.coordinate.latitude,
        longitude: payload.coordinate.longitude,
        paceSecPerKm: payload.currentPaceSecPerKm ?? null,
        updatedAt: serverTimestamp(),
      },
      [`coarseSessionLocation/${payload.sessionId}`]: {
        latitude: coarse.latitude,
        longitude: coarse.longitude,
        updatedAt: serverTimestamp(),
      },
    });
  }
}
