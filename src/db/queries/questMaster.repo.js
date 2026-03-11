const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findQuestById(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT
      q.quest_id,
      q.quest_code,
      q.quest_name,
      q.quest_description,
      q.panel_title,
      q.panel_description,
      q.button_label,
      q.quest_level,
      q.is_active,
      q.is_step_quest,
      q.requires_ticket,
      q.is_repeatable,
      q.display_order,
      q.profession_id,
      p.profession_code,
      p.profession_name_th,
      p.profession_name_en
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p
      ON q.profession_id = p.profession_id
    WHERE q.quest_id = $1
    LIMIT 1
    `,
    [questId]
  );

  return result.rows[0] || null;
}

async function findQuestRequirements(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT
      requirement_id,
      quest_id,
      step_id,
      requirement_type,
      item_code,
      item_name,
      item_spawn_name,
      required_quantity,
      input_label,
      display_text,
      admin_display_text,
      is_required,
      sort_order,
      is_active
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findQuestRewards(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT
      reward_id,
      quest_id,
      step_id,
      reward_type,
      reward_value_text,
      reward_value_number,
      reward_item_code,
      reward_item_name,
      reward_item_spawn_name,
      reward_quantity,
      discord_role_id,
      discord_role_name,
      reward_cycle_type,
      reward_display_text,
      grant_on,
      sort_order,
      is_active
    FROM public.tb_quest_master_reward
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
    SELECT
      media_id,
      quest_id,
      step_id,
      media_type,
      media_url,
      media_title,
      media_description,
      display_order,
      is_active
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY display_order ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

module.exports = {
  findQuestById,
  findQuestRequirements,
  findQuestRewards,
  findQuestGuideMedia
};
