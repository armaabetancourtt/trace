import * as SQLite from 'expo-sqlite';

import type { ActivityStore, PendingActivity } from './ActivityStore';
import type { ActivitySessionState } from '../session/ActivitySessionMachine';

const DB_NAME = 'trace.db';

type StoredSessionRow = {
  local_id: string;
  phase: string;
  payload: string;
  remote_activity_id: string | null;
};

export class SqliteActivityStore implements ActivityStore {
  private database: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (this.database) return;

    this.database = await SQLite.openDatabaseAsync(DB_NAME);
    await this.database.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS activity_sessions (
        local_id TEXT PRIMARY KEY NOT NULL,
        phase TEXT NOT NULL,
        payload TEXT NOT NULL,
        remote_activity_id TEXT,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS activity_sessions_phase_idx
      ON activity_sessions(phase);
    `);
  }

  private async db() {
    await this.initialize();
    return this.database!;
  }

  async saveSession(session: ActivitySessionState): Promise<void> {
    if (session.phase === 'idle') return;

    const db = await this.db();
    await db.runAsync(
      `
      INSERT INTO activity_sessions (
        local_id,
        phase,
        payload,
        updated_at
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(local_id) DO UPDATE SET
        phase = excluded.phase,
        payload = excluded.payload,
        updated_at = excluded.updated_at
      `,
      session.localId,
      session.phase,
      JSON.stringify(session),
      Date.now(),
    );
  }

  async loadActiveSession(): Promise<ActivitySessionState | null> {
    const db = await this.db();
    const row = await db.getFirstAsync<StoredSessionRow>(
      `
      SELECT local_id, phase, payload, remote_activity_id
      FROM activity_sessions
      WHERE phase IN ('recording', 'paused')
      ORDER BY updated_at DESC
      LIMIT 1
      `,
    );

    return row ? (JSON.parse(row.payload) as ActivitySessionState) : null;
  }

  async listPendingSync(): Promise<PendingActivity[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<StoredSessionRow>(
      `
      SELECT local_id, phase, payload, remote_activity_id
      FROM activity_sessions
      WHERE phase = 'pending_sync'
      ORDER BY updated_at ASC
      `,
    );

    return rows.map((row) => JSON.parse(row.payload) as PendingActivity);
  }

  async markSynced(
    localId: string,
    remoteActivityId: string,
  ): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `
      UPDATE activity_sessions
      SET remote_activity_id = ?, phase = 'synced', updated_at = ?
      WHERE local_id = ?
      `,
      remoteActivityId,
      Date.now(),
      localId,
    );
  }

  async remove(localId: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      'DELETE FROM activity_sessions WHERE local_id = ?',
      localId,
    );
  }
}

export const activityStore = new SqliteActivityStore();
