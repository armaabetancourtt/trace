export type JoinRunDecision = 'accepted' | 'declined';

export interface JoinRunService {
  requestJoin(sessionId: string): Promise<{
    requestId: string;
    status: 'requested';
  }>;

  respond(
    requestId: string,
    decision: JoinRunDecision,
  ): Promise<{
    requestId: string;
    status: JoinRunDecision;
  }>;

  leave(sessionId: string): Promise<void>;
  end(sessionId: string): Promise<void>;
}
