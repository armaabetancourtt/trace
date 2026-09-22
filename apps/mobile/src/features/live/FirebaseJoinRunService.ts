import {
  getFunctions,
  httpsCallable,
} from '@react-native-firebase/functions';

import type {
  JoinRunDecision,
  JoinRunService,
} from './JoinRunService';

const functions = getFunctions();

export class FirebaseJoinRunService implements JoinRunService {
  async requestJoin(sessionId: string) {
    const callable = httpsCallable<{ sessionId: string }, {
      requestId: string;
      status: 'requested';
    }>(functions, 'requestJoinRun');

    const result = await callable({ sessionId });
    return result.data;
  }

  async respond(requestId: string, decision: JoinRunDecision) {
    const callable = httpsCallable<
      { requestId: string; decision: JoinRunDecision },
      { requestId: string; status: JoinRunDecision }
    >(functions, 'respondToJoinRun');

    const result = await callable({ requestId, decision });
    return result.data;
  }

  async leave(sessionId: string) {
    const callable = httpsCallable<{ sessionId: string }, { left: boolean }>(
      functions,
      'leaveLiveSession',
    );

    await callable({ sessionId });
  }

  async end(sessionId: string) {
    const callable = httpsCallable<{ sessionId: string }, { ended: boolean }>(
      functions,
      'endLiveSession',
    );

    await callable({ sessionId });
  }
}
