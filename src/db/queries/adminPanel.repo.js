const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findActiveProfessions(client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT profession_id, profession_code, profession_name_th, profession_name_en
    FROM public.tb_quest_master_profession
    WHERE is_active = TRUE
    ORDER BY display_order ASC, created_at ASC
  `);
  return result.rows;
}

async function findProfessionById(professionId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT profession_id, profession_code, profession_name_th, profession_name_en
    FROM public.tb_quest_master_profession
    WHERE profession_id = $1
    LIMIT 1
  `, [professionId]);
  return result.rows[0] || null;
}

async function findQuestLevelsByProfession(professionId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT DISTINCT quest_level
    FROM public.tb_quest_master
    WHERE profession_id = $1
      AND tier_type = 'NORMAL'
    ORDER BY quest_level ASC
  `, [professionId]);
  return result.rows.map((row) => Number(row.quest_level)).filter(Number.isFinite);
}

async function findQuestsByProfessionAndLevel(professionId, level, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT quest_id, quest_code, quest_name, quest_level, is_active, is_repeatable, is_step_quest, requires_ticket
    FROM public.tb_quest_master
    WHERE profession_id = $1
      AND quest_level = $2
      AND tier_type = 'NORMAL'
    ORDER BY display_order ASC, created_at ASC
  `, [professionId, level]);
  return result.rows;
}

async function findQuestDetailById(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT
      q.*,
      p.profession_code,
      p.profession_name_th,
      c.category_code,
      c.category_name
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    WHERE q.quest_id = $1
    LIMIT 1
  `, [questId]);
  return result.rows[0] || null;
}

async function findQuestRequirements(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT *
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
  `, [questId]);
  return result.rows;
}

async function findRequirementById(requirementId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT *
    FROM public.tb_quest_master_requirement
    WHERE requirement_id = $1
    LIMIT 1
  `, [requirementId]);
  return result.rows[0] || null;
}

async function findQuestRewards(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
  `, [questId]);
  return result.rows;
}

async function findRewardById(rewardId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE reward_id = $1
    LIMIT 1
  `, [rewardId]);
  return result.rows[0] || null;
}

async function findQuestDependencies(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT d.*, rq.quest_code AS required_quest_code, rq.quest_name AS required_quest_name
    FROM public.tb_quest_master_dependency d
    LEFT JOIN public.tb_quest_master rq ON d.required_quest_id = rq.quest_id
    WHERE d.quest_id = $1
      AND d.is_active = TRUE
    ORDER BY d.sort_order ASC, d.created_at ASC
  `, [questId]);
  return result.rows;
}

async function findQuestGuideMedia(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT *
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY display_order ASC, created_at ASC
  `, [questId]);
  return result.rows;
}

async function searchQuests(query, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT
      q.quest_id,
      q.quest_code,
      q.quest_name,
      q.quest_level,
      p.profession_code,
      p.profession_name_th
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.quest_code ILIKE '%' || $1 || '%'
       OR q.quest_name ILIKE '%' || $1 || '%'
    ORDER BY p.display_order ASC, q.quest_level ASC, q.display_order ASC
    LIMIT 25
  `, [query]);
  return result.rows;
}

async function updateQuestDescription(questId, payload, client) {
  const db = getDb(client);
  const result = await db.query(`
    UPDATE public.tb_quest_master
    SET quest_name = $2,
        quest_description = $3,
        panel_title = $4,
        button_label = $5,
        admin_note = $6,
        updated_at = NOW()
    WHERE quest_id = $1
    RETURNING *
  `, [
    questId,
    payload.quest_name || null,
    payload.quest_description || null,
    payload.panel_title || null,
    payload.button_label || null,
    payload.admin_note || null
  ]);
  return result.rows[0] || null;
}

async function updateRequirement(requirementId, payload, client) {
  const db = getDb(client);
  const result = await db.query(`
    UPDATE public.tb_quest_master_requirement
    SET item_name = $2,
        required_quantity = $3,
        display_text = $4,
        admin_display_text = $5,
        sort_order = $6,
        updated_at = NOW()
    WHERE requirement_id = $1
    RETURNING *
  `, [
    requirementId,
    payload.item_name || null,
    payload.required_quantity,
    payload.display_text || null,
    payload.admin_display_text || null,
    payload.sort_order
  ]);
  return result.rows[0] || null;
}

async function updateReward(rewardId, payload, client) {
  const db = getDb(client);
  const result = await db.query(`
    UPDATE public.tb_quest_master_reward
    SET reward_item_name = $2,
        reward_quantity = $3,
        reward_display_text = $4,
        discord_role_id = $5,
        sort_order = $6,
        updated_at = NOW()
    WHERE reward_id = $1
    RETURNING *
  `, [
    rewardId,
    payload.reward_item_name || null,
    payload.reward_quantity,
    payload.reward_display_text || null,
    payload.discord_role_id || null,
    payload.sort_order
  ]);
  return result.rows[0] || null;
}

async function insertQuestGuideImage(questId, payload, client) {
  const db = getDb(client);
  const result = await db.query(`
    INSERT INTO public.tb_quest_master_media
    (quest_id, media_type, media_url, media_title, media_description, display_order, is_active, created_at)
    VALUES ($1, 'GUIDE_IMAGE', $2, $3, $4, $5, TRUE, NOW())
    RETURNING *
  `, [
    questId,
    payload.media_url,
    payload.media_title || null,
    payload.media_description || null,
    payload.display_order
  ]);
  return result.rows[0] || null;
}

async function toggleQuestActive(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    UPDATE public.tb_quest_master
    SET is_active = NOT COALESCE(is_active, TRUE),
        updated_at = NOW()
    WHERE quest_id = $1
    RETURNING *
  `, [questId]);
  return result.rows[0] || null;
}

async function findPanelStatusRows(client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT
      p.profession_code,
      pc.config_value AS panel_channel_id,
      pm.config_value AS panel_message_id
    FROM public.tb_quest_master_profession p
    LEFT JOIN public.tb_quest_master_discord_config pc
      ON pc.scope_type = 'PROFESSION'
     AND pc.scope_key = p.profession_code
     AND pc.config_key = 'QUEST_PANEL'
     AND pc.is_active = TRUE
    LEFT JOIN public.tb_quest_master_discord_config pm
      ON pm.scope_type = 'PROFESSION'
     AND pm.scope_key = p.profession_code
     AND pm.config_key = 'QUEST_PANEL_MESSAGE'
     AND pm.is_active = TRUE
    WHERE p.is_active = TRUE
    ORDER BY p.display_order ASC, p.created_at ASC
  `);
  return result.rows;
}

async function insertAdminAudit(payload, client) {
  const db = getDb(client);
  const result = await db.query(`
    INSERT INTO public.tb_quest_admin_audit
    (
      action_type, actor_discord_id, actor_discord_tag,
      quest_id, requirement_id, reward_id, media_id,
      target_table, target_id, before_json, after_json, note, created_at
    )
    VALUES
    (
      $1, $2, $3,
      $4, $5, $6, $7,
      $8, $9, $10::jsonb, $11::jsonb, $12, NOW()
    )
    RETURNING *
  `, [
    payload.action_type,
    payload.actor_discord_id,
    payload.actor_discord_tag || null,
    payload.quest_id || null,
    payload.requirement_id || null,
    payload.reward_id || null,
    payload.media_id || null,
    payload.target_table || null,
    payload.target_id || null,
    payload.before_json ? JSON.stringify(payload.before_json) : null,
    payload.after_json ? JSON.stringify(payload.after_json) : null,
    payload.note || null
  ]);
  return result.rows[0] || null;
}

module.exports = {
  findActiveProfessions,
  findProfessionById,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findQuestDetailById,
  findQuestRequirements,
  findRequirementById,
  findQuestRewards,
  findRewardById,
  findQuestDependencies,
  findQuestGuideMedia,
  searchQuests,
  updateQuestDescription,
  updateRequirement,
  updateReward,
  insertQuestGuideImage,
  toggleQuestActive,
  findPanelStatusRows,
  insertAdminAudit
};
