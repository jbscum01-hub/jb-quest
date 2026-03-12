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
    ORDER BY sort_order ASC, created_at ASC
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
      AND is_active = TRUE
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
    ORDER BY p.sort_order ASC, q.quest_level ASC, q.display_order ASC
    LIMIT 25
  `, [query]);
  return result.rows;
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
    ORDER BY p.sort_order ASC, p.created_at ASC
  `);
  return result.rows;
}

module.exports = {
  findActiveProfessions,
  findProfessionById,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findQuestDetailById,
  findQuestRequirements,
  findQuestRewards,
  findQuestDependencies,
  findQuestGuideMedia,
  searchQuests,
  findPanelStatusRows
};
