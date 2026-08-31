import pg from "pg";
import type { SessionState } from "./game-engine.js";

/**
 * Persistência opcional em Postgres (Neon · projeto LAGEM).
 * Sem `DATABASE_URL`, o jogo continua 100% em memória como sempre — este
 * módulo simplesmente não é ativado. Com a variável presente, o servidor
 * cria o schema na inicialização, grava cada sessão encerrada e passa a
 * servir `GET /api/rankings`.
 */

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  mode text NOT NULL,
  case_id text,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL DEFAULT now(),
  export jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS team_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  score integer NOT NULL,
  escaped boolean NOT NULL DEFAULT false,
  escaped_at timestamptz
);
CREATE INDEX IF NOT EXISTS team_results_score_idx ON team_results (score DESC);
`;

export interface RankingRow {
  teamName: string;
  score: number;
  escaped: boolean;
  mode: string;
  caseId: string | null;
  finishedAt: string;
}

export class GameDb {
  private readonly pool: pg.Pool;

  constructor(databaseUrl: string) {
    this.pool = new pg.Pool({
      connectionString: databaseUrl,
      max: 3,
      // Neon exige TLS; conexões locais de teste podem dispensar.
      ssl: /neon\.tech|sslmode=require/.test(databaseUrl) ? { rejectUnauthorized: true } : undefined,
    });
  }

  async ensureSchema() {
    await this.pool.query(SCHEMA_SQL);
  }

  /** Grava a sessão encerrada e o placar final de cada equipe. */
  async saveFinishedSession(session: SessionState, exportJson: unknown) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO game_sessions (id, code, mode, case_id, topics, created_at, export)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          session.id, session.code, session.mode, session.escapeCase?.id ?? null,
          JSON.stringify(session.allowedTopics), new Date(session.createdAt).toISOString(),
          JSON.stringify(exportJson),
        ],
      );
      for (const team of session.teams.values()) {
        await client.query(
          `INSERT INTO team_results (session_id, team_name, score, escaped, escaped_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            session.id, team.name, team.score, Boolean(team.escape?.finishedAt),
            team.escape?.finishedAt ? new Date(team.escape.finishedAt).toISOString() : null,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async fetchRankings(limit = 20): Promise<RankingRow[]> {
    const result = await this.pool.query(
      `SELECT tr.team_name, tr.score, tr.escaped, gs.mode, gs.case_id, gs.finished_at
       FROM team_results tr
       JOIN game_sessions gs ON gs.id = tr.session_id
       ORDER BY tr.score DESC, tr.escaped DESC, gs.finished_at DESC
       LIMIT $1`,
      [Math.max(1, Math.min(100, limit))],
    );
    return result.rows.map((row) => ({
      teamName: row.team_name as string,
      score: row.score as number,
      escaped: row.escaped as boolean,
      mode: row.mode as string,
      caseId: (row.case_id as string | null) ?? null,
      finishedAt: new Date(row.finished_at as string).toISOString(),
    }));
  }

  async ping() {
    await this.pool.query("SELECT 1");
  }

  async close() {
    await this.pool.end();
  }
}

/** Ativa a persistência apenas quando DATABASE_URL existe. */
export function createDb(databaseUrl = process.env.DATABASE_URL): GameDb | undefined {
  if (!databaseUrl) return undefined;
  return new GameDb(databaseUrl);
}
