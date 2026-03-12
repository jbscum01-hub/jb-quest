const { getPool } = require('../pool');

async function insertAuditLog({ guildId, actorId, actorTag, action, target, meta }) {
  await getPool().query(
    `
    INSERT INTO public.audit_logs
    (guild_id, actor_id, actor_tag, action, target, meta)
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [guildId || 'GLOBAL', actorId || null, actorTag || null, action, target || null, meta || null]
  );
}

module.exports = {
  insertAuditLog
};
