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
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
};

function requireAuth(uid?: string): string {
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required.');
  return uid;
}

/**
 * Creates a server-trusted JOIN RUN request.
 *
 * The client is intentionally not allowed to create session membership
 * directly. Membership is granted only after the session owner accepts.
 */
export const requestJoinRun = onCall(
  { enforceAppCheck: true, region: 'us-central1' },
  async (request) => {
    const requesterId = requireAuth(request.auth?.uid);
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
      throw new HttpsError('permission-denied', 'This session is not accepting joins.');
    }

    const existing = await firestore
      .collection('joinRequests')
      .where('requesterId', '==', requesterId)
      .where('sessionId', '==', sessionId)
      .where('status', '==', 'requested')
      .limit(1)
      .get();

    if (!existing.empty) {
      return { requestId: existing.docs[0].id, status: 'requested' };
    }

    const document: JoinRequestDocument = {
      requesterId,
      sessionId,
      sessionOwnerId: session.ownerId,
      status: 'requested',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const ref = await firestore.collection('joinRequests').add(document);

    return { requestId: ref.id, status: 'requested' };
  },
);

/**
 * Accepts or declines a JOIN RUN request.
 *
 * Accepting the request creates RTDB session membership. That membership is
 * what unlocks session-scoped precise live location through Security Rules.
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
      throw new HttpsError('permission-denied', 'Only the session owner can respond.');
    }

    if (joinRequest.status !== 'requested') {
      throw new HttpsError('failed-precondition', 'Join request is no longer pending.');
    }

    await ref.update({
      status: decision,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (decision === 'accepted') {
      const memberUpdates: Record<string, boolean> = {};
      memberUpdates[`sessionMembers/${joinRequest.sessionId}/${ownerId}`] = true;
      memberUpdates[
        `sessionMembers/${joinRequest.sessionId}/${joinRequest.requesterId}`
      ] = true;

      await realtime.ref().update(memberUpdates);
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

    const sessionOwnerId = (
      await realtime.ref(`liveSessions/${sessionId}/ownerId`).get()
    ).val();

    if (sessionOwnerId === uid) {
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
