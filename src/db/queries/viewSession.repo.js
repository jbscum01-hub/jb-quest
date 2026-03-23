const { getPool } = require('../pool');

async function ensureViewSessionTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.tb_quest_view_session (
      session_id BIGSERIAL PRIMARY KEY,
      discord_user_id TEXT NOT NULL,
      profession_code TEXT NOT NULL,
      application_id TEXT NOT NULL,
      interaction_token TEXT NOT NULL,
      reply_kind TEXT NOT NULL DEFAULT 'ORIGINAL',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      closed_at TIMESTAMPTZ NULL,
      close_error TEXT NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tb_quest_view_session_status_exp
    ON public.tb_quest_view_session (status, expires_at);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tb_quest_view_session_user_prof_created
    ON public.tb_quest_view_session (discord_user_id, profession_code, created_at DESC);
  `);
}

async function createViewSession({
  discordUserId,
  professionCode,
  applicationId,
  interactionToken,
  expiresAt
}) {
  const pool = getPool();
  const result = await pool.query(
    `
    INSERT INTO public.tb_quest_view_session
    (discord_user_id, profession_code, application_id, interaction_token, expires_at, status)
    VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
    RETURNING *
    `,
    [discordUserId, professionCode, String(applicationId), interactionToken, expiresAt]
  );

  return result.rows[0];
}

async function getLatestViewSession(discordUserId, professionCode) {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT *
    FROM public.tb_quest_view_session
    WHERE discord_user_id = $1
      AND profession_code = $2
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [discordUserId, professionCode]
  );

  return result.rows[0] || null;
}

async function claimExpiredViewSessions(limit = 20) {
  const pool = getPool();
  const result = await pool.query(
    `
    WITH picked AS (
      SELECT session_id
      FROM public.tb_quest_view_session
      WHERE status = 'ACTIVE'
        AND expires_at <= NOW()
      ORDER BY expires_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE public.tb_quest_view_session AS t
    SET status = 'PROCESSING',
        updated_at = NOW()
    WHERE t.session_id IN (SELECT session_id FROM picked)
    RETURNING *
    `,
    [limit]
  );

  return result.rows;
}

async function markViewSessionClosed(sessionId) {
  const pool = getPool();
  await pool.query(
    `
    UPDATE public.tb_quest_view_session
    SET status = 'EXPIRED',
        closed_at = NOW(),
        updated_at = NOW(),
        close_error = NULL
    WHERE session_id = $1
    `,
    [sessionId]
  );
}

async function markViewSessionFailed(sessionId, errorMessage) {
  const pool = getPool();
  await pool.query(
    `
    UPDATE public.tb_quest_view_session
    SET status = 'FAILED',
        closed_at = NOW(),
        updated_at = NOW(),
        close_error = LEFT($2, 1000)
    WHERE session_id = $1
    `,
    [sessionId, errorMessage || 'Unknown close error']
  );
}

module.exports = {
  ensureViewSessionTable,
  createViewSession,
  getLatestViewSession,
  claimExpiredViewSessions,
  markViewSessionClosed,
  markViewSessionFailed
};
