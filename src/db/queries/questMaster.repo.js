const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function listActiveProfessions(client) {
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

async function findProfessionByCode(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE profession_code = $1
    LIMIT 1
    `,
    [professionCode]
  );

  return result.rows[0] || null;
}

async function findQuestsByProfessionAndLevel(professionCode, level, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.quest_id,
           q.quest_code,
           q.quest_name,
           q.quest_level,
           q.profession_id,
           p.profession_code,
           p.profession_name_th,
           p.icon_emoji,
           q.is_active,
           q.display_order
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    WHERE p.profession_code = $1
      AND q.quest_level = $2
    ORDER BY q.display_order ASC, q.quest_code ASC
    `,
    [professionCode, level]
  );

  return result.rows;
}

async function searchQuests(keyword, client) {
  const db = getDb(client);
  const safeKeyword = String(keyword || '').trim();
  const like = `%${safeKeyword}%`;
  const result = await db.query(
    `
    SELECT q.quest_id,
           q.quest_code,
           q.quest_name,
           q.quest_level,
           p.profession_code,
           p.profession_name_th,
           q.is_active
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    WHERE q.quest_code ILIKE $1
       OR q.quest_name ILIKE $1
       OR p.profession_code ILIKE $1
       OR p.profession_name_th ILIKE $1
    ORDER BY p.sort_order ASC, q.quest_level ASC, q.display_order ASC, q.quest_code ASC
    LIMIT 25
    `,
    [like]
  );

  return result.rows;
}

async function findQuestById(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, p.profession_code, p.profession_name_th, p.profession_name_en, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    WHERE q.quest_id = $1
    LIMIT 1
    `,
    [questId]
  );

  return result.rows[0] || null;
}

async function findQuestDependencies(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT d.*,
           rq.quest_code AS required_quest_code,
           rq.quest_name AS required_quest_name
    FROM public.tb_quest_master_dependency d
    LEFT JOIN public.tb_quest_master rq
      ON rq.quest_id = d.required_quest_id
    WHERE d.quest_id = $1
      AND d.is_active = TRUE
    ORDER BY d.sort_order ASC, d.created_at ASC
    `,
    [questId]
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
      AND step_id IS NULL
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findQuestRequirementById(requirementId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_requirement
    WHERE requirement_id = $1
    LIMIT 1
    `,
    [requirementId]
  );

  return result.rows[0] || null;
}

async function findQuestRewards(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND step_id IS NULL
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findQuestRewardById(rewardId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE reward_id = $1
    LIMIT 1
    `,
    [rewardId]
  );

  return result.rows[0] || null;
}

async function findQuestGuideImages(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND step_id IS NULL
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY display_order ASC, created_at ASC
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

async function getQuestDetailBundle(questId, client) {
  const quest = await findQuestById(questId, client);
  if (!quest) return null;

  const [dependencies, requirements, rewards, images, steps] = await Promise.all([
    findQuestDependencies(questId, client),
    findQuestRequirements(questId, client),
    findQuestRewards(questId, client),
    findQuestGuideImages(questId, client),
    findQuestSteps(questId, client)
  ]);

  return { quest, dependencies, requirements, rewards, images, steps };
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

async function updateQuestDescription(questId, payload, updatedBy, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master
    SET quest_name = $2,
        quest_description = NULLIF($3, ''),
        panel_description = NULLIF($4, ''),
        updated_by = $5,
        updated_at = NOW()
    WHERE quest_id = $1
    RETURNING *
    `,
    [questId, payload.questName, payload.questDescription, payload.panelDescription, updatedBy]
  );

  return result.rows[0] || null;
}

async function updateQuestRequirement(requirementId, payload, updatedBy, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_requirement
    SET item_name = NULLIF($2, ''),
        required_quantity = $3,
        display_text = NULLIF($4, ''),
        admin_display_text = NULLIF($5, ''),
        updated_by = $6,
        updated_at = NOW()
    WHERE requirement_id = $1
    RETURNING *
    `,
    [
      requirementId,
      payload.itemName,
      payload.requiredQuantity,
      payload.displayText,
      payload.adminDisplayText,
      updatedBy
    ]
  );

  return result.rows[0] || null;
}

async function addQuestRequirement(questId, payload, updatedBy, client) {
  const db = getDb(client);
  const orderResult = await db.query(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
      AND step_id IS NULL
      AND is_active = TRUE
    `,
    [questId]
  );

  const nextOrder = Number(orderResult.rows[0]?.next_order || 1);
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_master_requirement
    (
      requirement_id,
      quest_id,
      step_id,
      requirement_type,
      item_name,
      required_quantity,
      display_text,
      admin_display_text,
      is_required,
      sort_order,
      is_active,
      created_at,
      updated_at,
      created_by,
      updated_by
    )
    VALUES
    (
      gen_random_uuid(),
      $1,
      NULL,
      'SCUM_ITEM',
      NULLIF($2, ''),
      $3,
      NULLIF($4, ''),
      NULLIF($5, ''),
      TRUE,
      $6,
      TRUE,
      NOW(),
      NOW(),
      $7,
      $7
    )
    RETURNING *
    `,
    [
      questId,
      payload.itemName,
      payload.requiredQuantity,
      payload.displayText ?? payload.itemName,
      payload.adminDisplayText ?? payload.itemName,
      nextOrder,
      updatedBy
    ]
  );

  return result.rows[0] || null;
}

async function updateQuestReward(rewardId, payload, updatedBy, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_reward
    SET reward_type = $2,
        reward_item_name = CASE WHEN $2 = 'SCUM_ITEM' THEN NULLIF($3, '') ELSE reward_item_name END,
        reward_display_text = NULLIF($4, ''),
        reward_quantity = CASE WHEN $2 = 'SCUM_ITEM' THEN $5 ELSE reward_quantity END,
        reward_value_number = CASE WHEN $2 IN ('SCUM_MONEY', 'FAME_POINT') THEN $5 ELSE reward_value_number END,
        discord_role_name = CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3, '') ELSE discord_role_name END,
        reward_value_text = CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3, '') ELSE reward_value_text END,
        updated_by = $6,
        updated_at = NOW()
    WHERE reward_id = $1
    RETURNING *
    `,
    [rewardId, payload.rewardType, payload.rewardName, payload.rewardDisplayText, payload.rewardAmount, updatedBy]
  );

  return result.rows[0] || null;
}

async function addQuestReward(questId, payload, updatedBy, client) {
  const db = getDb(client);
  const orderResult = await db.query(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND step_id IS NULL
      AND is_active = TRUE
    `,
    [questId]
  );

  const nextOrder = Number(orderResult.rows[0]?.next_order || 1);
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_master_reward
    (
      reward_id,
      quest_id,
      step_id,
      reward_type,
      reward_value_text,
      reward_value_number,
      reward_item_name,
      reward_quantity,
      discord_role_name,
      reward_cycle_type,
      reward_display_text,
      grant_on,
      sort_order,
      is_active,
      created_at,
      updated_at,
      created_by,
      updated_by
    )
    VALUES
    (
      gen_random_uuid(),
      $1,
      NULL,
      $2,
      CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3, '') ELSE NULL END,
      CASE WHEN $2 IN ('SCUM_MONEY', 'FAME_POINT') THEN $4 ELSE NULL END,
      CASE WHEN $2 = 'SCUM_ITEM' THEN NULLIF($3, '') ELSE NULL END,
      CASE WHEN $2 = 'SCUM_ITEM' THEN $4 ELSE NULL END,
      CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3, '') ELSE NULL END,
      'ONE_TIME',
      NULLIF($5, ''),
      'QUEST_COMPLETE',
      $6,
      TRUE,
      NOW(),
      NOW(),
      $7,
      $7
    )
    RETURNING *
    `,
    [questId, payload.rewardType, payload.rewardName, payload.rewardAmount, payload.rewardDisplayText, nextOrder, updatedBy]
  );

  return result.rows[0] || null;
}

async function addQuestGuideImage(questId, payload, actorId, client) {
  const db = getDb(client);
  const orderResult = await db.query(
    `
    SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    `,
    [questId]
  );

  const nextOrder = Number(orderResult.rows[0]?.next_order || 1);
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_master_media
    (
      media_id,
      quest_id,
      step_id,
      media_type,
      media_url,
      media_title,
      media_description,
      display_order,
      is_active,
      created_at,
      updated_at,
      created_by,
      updated_by
    )
    VALUES
    (
      gen_random_uuid(),
      $1,
      NULL,
      'GUIDE_IMAGE',
      $2,
      NULLIF($3, ''),
      NULLIF($4, ''),
      $5,
      TRUE,
      NOW(),
      NOW(),
      $6,
      $6
    )
    RETURNING *
    `,
    [questId, payload.imageUrl, payload.imageTitle, payload.imageDescription, nextOrder, actorId]
  );

  return result.rows[0] || null;
}

async function deactivateQuestGuideImage(mediaId, actorId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_media
    SET is_active = FALSE,
        updated_by = $2,
        updated_at = NOW()
    WHERE media_id = $1
    RETURNING *
    `,
    [mediaId, actorId]
  );

  return result.rows[0] || null;
}

module.exports = {
  listActiveProfessions,
  findProfessionByCode,
  findQuestsByProfessionAndLevel,
  searchQuests,
  findQuestById,
  findQuestDependencies,
  findQuestRequirements,
  findQuestRequirementById,
  findQuestRewards,
  findQuestRewardById,
  findQuestGuideImages,
  findQuestSteps,
  getQuestDetailBundle,
  updateQuestActive,
  updateQuestDescription,
  updateQuestRequirement,
  addQuestRequirement,
  updateQuestReward,
  addQuestReward,
  addQuestGuideImage,
  deactivateQuestGuideImage
};
