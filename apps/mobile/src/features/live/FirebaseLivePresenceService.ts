import { getAuth } from '@react-native-firebase/auth';
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

function requireCurrentUser() {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error(
      'Authentication is required before publishing live presence.',
    );
  }

  return user;
}

export class FirebaseLivePresenceService implements LivePresenceService {
  async start(payload: LivePresenceUpdate) {
    const user = requireCurrentUser();

    if (user.isAnonymous && payload.visibility !== 'private') {
      throw new Error(
        'Create a verified TRACE profile before becoming publicly discoverable.',
      );
    }

    const uid = user.uid;
    const coarse = coarsenCoordinate(payload.coordinate, 300);

    const sessionRef = ref(database, `liveSessions/${payload.sessionId}`);
    const coarseRef = ref(
      database,
      `coarseSessionLocation/${payload.sessionId}`,
    );
    const preciseRef = ref(
      database,
      `preciseSessionLocation/${payload.sessionId}/${uid}`,
    );

    // Create the owner-controlled session first so subsequent location writes
    // can be authorized by Realtime Database Security Rules.
    await set(sessionRef, {
      ownerId: uid,
      visibility: payload.visibility,
      activityType: payload.activityType,
      startedAt: serverTimestamp(),
    });

    await Promise.all([
      set(coarseRef, {
        latitude: coarse.latitude,
        longitude: coarse.longitude,
        updatedAt: serverTimestamp(),
      }),
      set(preciseRef, {
        latitude: payload.coordinate.latitude,
        longitude: payload.coordinate.longitude,
        paceSecPerKm: payload.currentPaceSecPerKm ?? null,
        updatedAt: serverTimestamp(),
      }),
    ]);

    await Promise.all([
      onDisconnect(sessionRef).remove(),
      onDisconnect(coarseRef).remove(),
      onDisconnect(preciseRef).remove(),
    ]);
  }

  async update(payload: LivePresenceUpdate) {
    const user = requireCurrentUser();

    if (user.isAnonymous && payload.visibility !== 'private') {
      throw new Error(
        'Anonymous beta identities cannot publish social live presence.',
      );
    }

    const uid = user.uid;
    const coarse = coarsenCoordinate(payload.coordinate, 300);

    await update(ref(database), {
      [`coarseSessionLocation/${payload.sessionId}`]: {
        latitude: coarse.latitude,
        longitude: coarse.longitude,
        updatedAt: serverTimestamp(),
      },
      [`preciseSessionLocation/${payload.sessionId}/${uid}`]: {
        latitude: payload.coordinate.latitude,
        longitude: payload.coordinate.longitude,
        paceSecPerKm: payload.currentPaceSecPerKm ?? null,
        updatedAt: serverTimestamp(),
      },
    });
  }

  async stop(sessionId: string) {
    const uid = requireCurrentUser().uid;

    await Promise.all([
      remove(ref(database, `liveSessions/${sessionId}`)),
      remove(ref(database, `coarseSessionLocation/${sessionId}`)),
      remove(ref(database, `preciseSessionLocation/${sessionId}/${uid}`)),
    ]);
  }
}
