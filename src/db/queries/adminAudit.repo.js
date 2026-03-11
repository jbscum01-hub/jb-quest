const { getPool } = require('../pool');

async function createAdminAuditLog(payload, client) {
  const db = client || getPool();

  const result = await db.query(
    `
    INSERT INTO public.tb_quest_admin_audit
    (
      action_type,
      actor_discord_id,
      actor_discord_tag,
      quest_id,
      requirement_id,
      reward_id,
      dependency_id,
      media_id,
      target_table,
      target_id,
      before_json,
      after_json,
      note
    )
    VALUES
    (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13
    )
    RETURNING *
    `,
    [
      payload.actionType,
      payload.actorDiscordId,
      payload.actorDiscordTag || null,
      payload.questId || null,
      payload.requirementId || null,
      payload.rewardId || null,
      payload.dependencyId || null,
      payload.mediaId || null,
      payload.targetTable || null,
      payload.targetId || null,
      payload.beforeJson ? JSON.stringify(payload.beforeJson) : null,
      payload.afterJson ? JSON.stringify(payload.afterJson) : null,
      payload.note || null
    ]
  );

  return result.rows[0];
}

module.exports = {
  createAdminAuditLog
};
