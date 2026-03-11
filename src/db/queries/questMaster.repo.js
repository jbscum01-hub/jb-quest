const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findQuestById(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT
      q.*,
      c.category_code,
      c.category_name,
      p.profession_code,
      p.profession_name_th,
      p.profession_name_en,
      p.icon_emoji
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.quest_id = $1
    LIMIT 1
    `,
    [questId]
  );

  return result.rows[0] || null;
}

async function findProfessionByCode(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_profession
    WHERE profession_code = $1
      AND is_active = TRUE
    LIMIT 1
    `,
    [professionCode]
  );

  return result.rows[0] || null;
}

async function findAllActiveProfessions(client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_profession
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, profession_name_th ASC
    `
  );

  return result.rows;
}

async function findQuestLevelsByProfession(professionId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT DISTINCT quest_level
    FROM public.tb_quest_master
    WHERE profession_id = $1
      AND is_active = TRUE
      AND quest_level IS NOT NULL
    ORDER BY quest_level ASC
    `,
    [professionId]
  );

  return result.rows.map((row) => row.quest_level);
}

async function findQuestsByProfessionAndLevel(professionId, questLevel, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT
      q.*,
      c.category_code,
      c.category_name,
      p.profession_code,
      p.profession_name_th,
      p.profession_name_en,
      p.icon_emoji
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.profession_id = $1
      AND q.quest_level = $2
    ORDER BY q.display_order ASC, q.created_at ASC
    `,
    [professionId, questLevel]
  );

  return result.rows;
}

async function findCurrentMainQuestByProfession(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.is_repeatable = FALSE
      AND q.is_active = TRUE
      AND q.tier_type = 'NORMAL'
    ORDER BY q.display_order ASC, q.quest_level ASC, q.created_at ASC
    LIMIT 1
    `,
    [professionCode]
  );

  return result.rows[0] || null;
}

async function findActiveMainQuestsByProfession(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.is_repeatable = FALSE
      AND q.is_active = TRUE
      AND q.tier_type = 'NORMAL'
    ORDER BY q.display_order ASC, q.quest_level ASC, q.created_at ASC
    `,
    [professionCode]
  );

  return result.rows;
}

async function findQuestDependencies(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT
      d.*,
      rq.quest_code AS required_quest_code,
      rq.quest_name AS required_quest_name
    FROM public.tb_quest_master_dependency d
    LEFT JOIN public.tb_quest_master rq
      ON d.required_quest_id = rq.quest_id
    WHERE d.quest_id = $1
      AND d.is_active = TRUE
    ORDER BY d.sort_order ASC, d.created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findNextMainQuestByProfession(professionCode, currentLevel, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.is_repeatable = FALSE
      AND q.is_active = TRUE
      AND q.tier_type = 'NORMAL'
      AND COALESCE(q.quest_level, 0) > COALESCE($2, 0)
    ORDER BY q.display_order ASC, q.quest_level ASC, q.created_at ASC
    LIMIT 1
    `,
    [professionCode, currentLevel]
  );

  return result.rows[0] || null;
}

async function findRepeatableQuestsByProfession(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.is_repeatable = TRUE
      AND q.is_active = TRUE
    ORDER BY q.display_order ASC, q.quest_level ASC, q.created_at ASC
    `,
    [professionCode]
  );

  return result.rows;
}

async function findQuestRequirements(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findQuestGuideMedia(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY
      CASE WHEN media_type = 'GUIDE_IMAGE' THEN 0 ELSE 1 END,
      display_order ASC,
      created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findQuestRewards(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findQuestSteps(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY step_no ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

module.exports = {
  findQuestById,
  findProfessionByCode,
  findAllActiveProfessions,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findCurrentMainQuestByProfession,
  findActiveMainQuestsByProfession,
  findQuestDependencies,
  findNextMainQuestByProfession,
  findRepeatableQuestsByProfession,
  findQuestRequirements,
  findQuestGuideMedia,
  findQuestRewards,
  findQuestSteps
};
