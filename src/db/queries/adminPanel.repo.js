const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function listActiveProfessions(client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, profession_name_th ASC
  `);
  return result.rows;
}

async function findProfessionById(professionId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE profession_id = $1
    LIMIT 1
  `, [professionId]);
  return result.rows[0] || null;
}

async function listQuestLevelsByProfession(professionId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT quest_level, COUNT(*)::int AS quest_count
    FROM public.tb_quest_master
    WHERE profession_id = $1
      AND is_active IN (TRUE, FALSE)
      AND quest_level IS NOT NULL
    GROUP BY quest_level
    ORDER BY quest_level ASC
  `, [professionId]);
  return result.rows;
}

async function listQuestsByProfessionAndLevel(professionId, questLevel, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT q.quest_id, q.quest_code, q.quest_name, q.quest_description,
           q.quest_level, q.is_active, q.is_step_quest, q.requires_ticket,
           q.is_repeatable, q.display_order
    FROM public.tb_quest_master q
    WHERE q.profession_id = $1
      AND q.quest_level = $2
    ORDER BY q.display_order ASC, q.quest_name ASC
  `, [professionId, questLevel]);
  return result.rows;
}

async function findQuestDetailById(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT q.*, p.profession_code, p.profession_name_th, p.profession_name_en, p.icon_emoji,
           c.category_code, c.category_name
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    WHERE q.quest_id = $1
    LIMIT 1
  `, [questId]);
  return result.rows[0] || null;
}

async function listQuestRequirements(questId, client) {
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

async function listQuestRewards(questId, client) {
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

async function listQuestDependencies(questId, client) {
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

async function listQuestGuideMedia(questId, client) {
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

async function listQuestSteps(questId, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY step_no ASC, created_at ASC
  `, [questId]);
  return result.rows;
}

async function searchQuests(keyword, client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT q.quest_id, q.quest_code, q.quest_name, q.quest_level,
           q.is_active, q.is_step_quest, q.requires_ticket,
           p.profession_id, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.quest_code ILIKE $1
       OR q.quest_name ILIKE $1
       OR COALESCE(q.quest_description, '') ILIKE $1
    ORDER BY q.updated_at DESC, q.display_order ASC
    LIMIT 25
  `, [`%${keyword}%`]);
  return result.rows;
}

async function listProfessionPanelConfigRows(client) {
  const db = getDb(client);
  const result = await db.query(`
    SELECT scope_key AS profession_code,
           MAX(CASE WHEN config_key = 'QUEST_PANEL' THEN config_value END) AS channel_id,
           MAX(CASE WHEN config_key = 'QUEST_PANEL_MESSAGE' THEN config_value END) AS message_id
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = 'PROFESSION'
      AND is_active = TRUE
      AND config_key IN ('QUEST_PANEL', 'QUEST_PANEL_MESSAGE')
    GROUP BY scope_key
    ORDER BY scope_key ASC
  `);
  return result.rows;
}

module.exports = {
  listActiveProfessions,
  findProfessionById,
  listQuestLevelsByProfession,
  listQuestsByProfessionAndLevel,
  findQuestDetailById,
  listQuestRequirements,
  listQuestRewards,
  listQuestDependencies,
  listQuestGuideMedia,
  listQuestSteps,
  searchQuests,
  listProfessionPanelConfigRows
};
