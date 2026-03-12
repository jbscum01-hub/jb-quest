const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findQuestById(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th, p.profession_name_en, p.icon_emoji
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

async function listActiveProfessions(client) {
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

async function findQuestsByProfessionAndLevel(professionCode, questLevel, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND COALESCE(q.quest_level, 0) = COALESCE($2, 0)
    ORDER BY q.display_order ASC, q.created_at ASC
    `,
    [professionCode, questLevel]
  );

  return result.rows;
}

async function searchQuests(keyword, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.quest_code ILIKE $1
       OR q.quest_name ILIKE $1
    ORDER BY q.is_active DESC, q.updated_at DESC, q.created_at DESC
    LIMIT 25
    `,
    [`%${keyword}%`]
  );

  return result.rows;
}

async function findQuestDependencies(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT d.*, rq.quest_code AS required_quest_code, rq.quest_name AS required_quest_name
    FROM public.tb_quest_master_dependency d
    LEFT JOIN public.tb_quest_master rq ON d.required_quest_id = rq.quest_id
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

async function updateQuestActive(questId, isActive, updatedBy, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master
    SET is_active = $2,
        updated_by = $3,
        updated_at = NOW()
    WHERE quest_id = $1
    RETURNING *
    `,
    [questId, isActive, updatedBy]
  );

  return result.rows[0] || null;
}

async function getQuestDetailBundle(questId, client) {
  const quest = await findQuestById(questId, client);
  if (!quest) {
    return null;
  }

  const [dependencies, requirements, rewards, images, steps] = await Promise.all([
    findQuestDependencies(questId, client),
    findQuestRequirements(questId, client),
    findQuestRewards(questId, client),
    findQuestGuideMedia(questId, client),
    findQuestSteps(questId, client)
  ]);

  return {
    quest,
    dependencies,
    requirements,
    rewards,
    images,
    steps
  };
}

module.exports = {
  findQuestById,
  findProfessionByCode,
  listActiveProfessions,
  findCurrentMainQuestByProfession,
  findActiveMainQuestsByProfession,
  findQuestsByProfessionAndLevel,
  searchQuests,
  findQuestDependencies,
  findNextMainQuestByProfession,
  findRepeatableQuestsByProfession,
  findQuestRequirements,
  findQuestGuideMedia,
  findQuestRewards,
  findQuestSteps,
  updateQuestActive,
  getQuestDetailBundle
};
