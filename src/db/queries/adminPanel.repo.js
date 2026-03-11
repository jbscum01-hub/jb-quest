const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findActiveProfessions(client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, profession_code ASC
    `
  );

  return result.rows;
}

async function findProfessionById(professionId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE profession_id = $1
    LIMIT 1
    `,
    [professionId]
  );

  return result.rows[0] || null;
}

async function findQuestLevelsByProfession(professionId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.quest_level, COUNT(*)::int AS quest_count
    FROM public.tb_quest_master q
    WHERE q.profession_id = $1
      AND q.is_active IN (TRUE, FALSE)
    GROUP BY q.quest_level
    ORDER BY q.quest_level ASC NULLS LAST
    `,
    [professionId]
  );

  return result.rows;
}

async function findQuestsByProfessionAndLevel(professionId, level, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.quest_id, q.quest_code, q.quest_name, q.quest_level, q.is_active, q.is_step_quest,
           q.requires_ticket, q.is_repeatable, q.display_order
    FROM public.tb_quest_master q
    WHERE q.profession_id = $1
      AND q.quest_level = $2
    ORDER BY q.display_order ASC, q.quest_code ASC, q.created_at ASC
    `,
    [professionId, level]
  );

  return result.rows;
}

async function findQuestSteps(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT step_id, quest_id, step_no, step_title, step_description, requires_attachment, is_active
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY step_no ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findQuestDependenciesWithNames(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT d.*, q.quest_code AS required_quest_code, q.quest_name AS required_quest_name
    FROM public.tb_quest_master_dependency d
    LEFT JOIN public.tb_quest_master q ON d.required_quest_id = q.quest_id
    WHERE d.quest_id = $1
      AND d.is_active = TRUE
    ORDER BY d.sort_order ASC, d.created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function insertAdminAudit(payload, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_admin_audit (
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
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13
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

  return result.rows[0] || null;
}

module.exports = {
  findActiveProfessions,
  findProfessionById,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findQuestSteps,
  findQuestDependenciesWithNames,
  insertAdminAudit
};
