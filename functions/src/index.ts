import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const firestore = getFirestore();
const realtime = getDatabase();

type JoinRequestStatus =
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'expired';

type JoinRequestDocument = {
  requesterId: string;
  sessionId: string;
  sessionOwnerId: string;
  status: JoinRequestStatus;
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

function requireAuth(uid?: string): string {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  return uid;
}

function requireSocialIdentity(request: {
  auth?: { token?: Record<string, any> } | null;
}) {
  const signInProvider = request.auth?.token?.firebase?.sign_in_provider;

  if (signInProvider === 'anonymous') {
    throw new HttpsError(
      'permission-denied',
      'Anonymous beta identities cannot use social live features.',
    );
  }
}

function joinRequestId(sessionId: string, requesterId: string) {
  return `${sessionId}__${requesterId}`;
}

/**
 * Creates a server-trusted JOIN RUN request.
 *
 * The deterministic document ID makes retries idempotent and avoids requiring
 * a composite query/index just to detect duplicate pending requests.
 */
export const requestJoinRun = onCall(
  { enforceAppCheck: true, region: 'us-central1' },
  async (request) => {
    const requesterId = requireAuth(request.auth?.uid);
    requireSocialIdentity(request);
    const sessionId = String(request.data?.sessionId ?? '');

    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const sessionSnapshot = await realtime.ref(`liveSessions/${sessionId}`).get();

    if (!sessionSnapshot.exists()) {
      throw new HttpsError('not-found', 'Live session was not found.');
    }

    const session = sessionSnapshot.val() as {
      ownerId?: string;
      visibility?: string;
    };

    if (!session.ownerId) {
      throw new HttpsError('failed-precondition', 'Session has no owner.');
    }

    if (session.ownerId === requesterId) {
      throw new HttpsError('failed-precondition', 'You already own this session.');
    }

    if (session.visibility !== 'joinable') {
      throw new HttpsError(
        'permission-denied',
        'This session is not accepting joins.',
      );
    }

    const requestId = joinRequestId(sessionId, requesterId);
    const ref = firestore.collection('joinRequests').doc(requestId);
    const existing = await ref.get();

    if (existing.exists && existing.data()?.status === 'requested') {
      return { requestId, status: 'requested' };
    }

    const document: JoinRequestDocument = {
      requesterId,
      sessionId,
      sessionOwnerId: session.ownerId,
      status: 'requested',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await ref.set(document);

    return { requestId, status: 'requested' };
  },
);

/**
 * Accepts or declines a JOIN RUN request.
 *
 * Accepting creates server-controlled RTDB membership. Membership is what
 * unlocks session-scoped precise location through Security Rules.
 */
export const respondToJoinRun = onCall(
  { enforceAppCheck: true, region: 'us-central1' },
  async (request) => {
    const ownerId = requireAuth(request.auth?.uid);
    const requestId = String(request.data?.requestId ?? '');
    const decision = String(request.data?.decision ?? '');

    if (!requestId || !['accepted', 'declined'].includes(decision)) {
      throw new HttpsError(
        'invalid-argument',
        'requestId and a valid decision are required.',
      );
    }

    const ref = firestore.collection('joinRequests').doc(requestId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Join request was not found.');
    }

    const joinRequest = snapshot.data() as {
      requesterId: string;
      sessionId: string;
      sessionOwnerId: string;
      status: JoinRequestStatus;
    };

    if (joinRequest.sessionOwnerId !== ownerId) {
      throw new HttpsError(
        'permission-denied',
        'Only the session owner can respond.',
      );
    }

    if (joinRequest.status !== 'requested') {
      throw new HttpsError(
        'failed-precondition',
        'Join request is no longer pending.',
      );
    }

    await ref.update({
      status: decision,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (decision === 'accepted') {
      await realtime.ref().update({
        [`sessionMembers/${joinRequest.sessionId}/${ownerId}`]: true,
        [`sessionMembers/${joinRequest.sessionId}/${joinRequest.requesterId}`]:
          true,
      });
    }

    return { requestId, status: decision };
  },
);

export const leaveLiveSession = onCall(
  { enforceAppCheck: true, region: 'us-central1' },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const sessionId = String(request.data?.sessionId ?? '');

    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const ownerId = (
      await realtime.ref(`liveSessions/${sessionId}/ownerId`).get()
    ).val();

    if (ownerId === uid) {
      throw new HttpsError(
        'failed-precondition',
        'The owner must end the session instead of leaving it.',
      );
    }

    await realtime.ref().update({
      [`sessionMembers/${sessionId}/${uid}`]: null,
      [`preciseSessionLocation/${sessionId}/${uid}`]: null,
    });

    return { sessionId, left: true };
  },
);

export const endLiveSession = onCall(
  { enforceAppCheck: true, region: 'us-central1' },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const sessionId = String(request.data?.sessionId ?? '');

    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const ownerId = (
      await realtime.ref(`liveSessions/${sessionId}/ownerId`).get()
    ).val();

    if (ownerId !== uid) {
      throw new HttpsError(
        'permission-denied',
        'Only the session owner can end this session.',
      );
    }

    await realtime.ref().update({
      [`liveSessions/${sessionId}`]: null,
      [`sessionMembers/${sessionId}`]: null,
      [`preciseSessionLocation/${sessionId}`]: null,
      [`presence/${uid}`]: null,
    });

    return { sessionId, ended: true };
  },
);


type FinalizeActivityInput = {
  localId?: unknown;
  activityType?: unknown;
  startedAtMs?: unknown;
  finishedAtMs?: unknown;
  durationSec?: unknown;
  distanceM?: unknown;
  averagePaceSecPerKm?: unknown;
  elevationGainM?: unknown;
  sampleCount?: unknown;
  routePath?: unknown;
};

function requireFiniteNumber(
  value: unknown,
  field: string,
  minimum = 0,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < minimum) {
    throw new HttpsError(
      'invalid-argument',
      `${field} must be a finite number >= ${minimum}.`,
    );
  }

  return parsed;
}

export const finalizeActivity = onCall(
  { enforceAppCheck: true, region: 'us-central1' },
  async (request) => {
    const uid = requireAuth(request.auth?.uid);
    const input = (request.data ?? {}) as FinalizeActivityInput;

    const localId = String(input.localId ?? '');
    const activityType = String(input.activityType ?? '');
    const routePath = String(input.routePath ?? '');

    if (!/^activity-[0-9]+$/.test(localId)) {
      throw new HttpsError('invalid-argument', 'Invalid local activity id.');
    }

    if (!['run', 'walk', 'ride'].includes(activityType)) {
      throw new HttpsError('invalid-argument', 'Invalid activity type.');
    }

    const requiredRoutePrefix = `users/${uid}/activities/${localId}/`;

    if (!routePath.startsWith(requiredRoutePrefix)) {
      throw new HttpsError(
        'permission-denied',
        'Route artifact must belong to the authenticated user.',
      );
    }

    const startedAtMs = requireFiniteNumber(input.startedAtMs, 'startedAtMs', 1);
    const finishedAtMs = requireFiniteNumber(
      input.finishedAtMs,
      'finishedAtMs',
      startedAtMs,
    );
    const durationSec = requireFiniteNumber(input.durationSec, 'durationSec');
    const distanceM = requireFiniteNumber(input.distanceM, 'distanceM');
    const elevationGainM = requireFiniteNumber(
      input.elevationGainM,
      'elevationGainM',
    );
    const sampleCount = requireFiniteNumber(input.sampleCount, 'sampleCount');

    const averagePaceSecPerKm =
      input.averagePaceSecPerKm == null
        ? null
        : requireFiniteNumber(
            input.averagePaceSecPerKm,
            'averagePaceSecPerKm',
          );

    if (finishedAtMs - startedAtMs > 48 * 60 * 60 * 1000) {
      throw new HttpsError(
        'invalid-argument',
        'Activity duration exceeds the accepted beta limit.',
      );
    }

    const activityId = `${uid}__${localId}`;
    const ref = firestore.collection('activities').doc(activityId);
    const existing = await ref.get();

    if (existing.exists) {
      return { activityId, created: false };
    }

    await ref.create({
      ownerId: uid,
      activityType,
      startedAt: new Date(startedAtMs),
      finishedAt: new Date(finishedAtMs),
      durationSec,
      distanceM,
      averagePaceSecPerKm,
      elevationGainM,
      sampleCount,
      routeRef: routePath,
      privacy: 'private',
      createdAt: FieldValue.serverTimestamp(),
      source: 'trace-mobile',
      schemaVersion: 1,
    });

    return { activityId, created: true };
  },
);
