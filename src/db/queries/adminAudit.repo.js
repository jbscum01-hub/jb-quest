const { getPool } = require('../pool');

async function insertAuditLog({
  actorId,
  actorTag,
  action,
  target,
  meta
}) {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO public.audit_logs
    (guild_id, actor_id, actor_tag, action, target, meta, created_at)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
    `,
    [
      process.env.GUILD_ID || 'UNKNOWN',
      actorId || null,
      actorTag || null,
      action,
      target || null,
      meta ? JSON.stringify(meta) : null
    ]
  );
}

module.exports = {
  insertAuditLog
};
