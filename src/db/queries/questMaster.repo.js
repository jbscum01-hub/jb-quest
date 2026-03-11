const { getPool } = require('../pool');

async function findQuestById(questId, client = getPool()) {
  const result = await client.query(
    `
    SELECT q.*, c.category_code, p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.quest_id = $1
    LIMIT 1
    `,
    [questId]
  );

  return result.rows[0] || null;
}

async function findProfessionByCode(professionCode, client = getPool()) {
  const result = await client.query(
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

async function findCurrentMainQuestByProfession(professionCode, client = getPool()) {
  const result = await client.query(
    `
    SELECT q.*, c.category_code, p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND c.category_code = 'MAIN'
      AND q.is_active = TRUE
    ORDER BY q.quest_level ASC, q.display_order ASC, q.created_at ASC
    LIMIT 1
    `,
    [professionCode]
  );

  return result.rows[0] || null;
}

async function findNextMainQuestByProfession(professionCode, currentQuestLevel, client = getPool()) {
  const result = await client.query(
    `
    SELECT q.*, c.category_code, p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND c.category_code = 'MAIN'
      AND q.is_active = TRUE
      AND q.quest_level > $2
    ORDER BY q.quest_level ASC, q.display_order ASC, q.created_at ASC
    LIMIT 1
    `,
    [professionCode, currentQuestLevel || 0]
  );

  return result.rows[0] || null;
}

async function findRepeatableQuestsByProfession(professionCode, client = getPool()) {
  const result = await client.query(
    `
    SELECT q.*, c.category_code, p.profession_code, p.profession_name_th, p.icon_emoji
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

async function findQuestRequirements(questId, client = getPool()) {
  const result = await client.query(
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

async function findQuestRewards(questId, client = getPool()) {
  const result = await client.query(
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

module.exports = {
  findQuestById,
  findProfessionByCode,
  findCurrentMainQuestByProfession,
  findNextMainQuestByProfession,
  findRepeatableQuestsByProfession,
  findQuestRequirements,
  findQuestRewards
};
