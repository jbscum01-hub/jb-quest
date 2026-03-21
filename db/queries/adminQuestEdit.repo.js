const { getPool } = require('../pool');

function db() {
  return getPool();
}

async function query(sql, params = []) {
  const result = await db().query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function findActiveProfessions() {
  return query(`
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, profession_code ASC
  `);
}

async function findProfessionById(professionId) {
  return queryOne(
    `
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE profession_id = $1
    LIMIT 1
    `,
    [professionId]
  );
}

async function findQuestLevelsByProfession(professionId) {
  return query(
    `
    SELECT q.quest_level, COUNT(*)::int AS quest_count
    FROM public.tb_quest_master q
    WHERE q.profession_id = $1
    GROUP BY q.quest_level
    ORDER BY q.quest_level ASC NULLS LAST
    `,
    [professionId]
  );
}

async function findQuestsByProfessionAndLevel(professionId, level) {
  return query(
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
}

async function findQuestById(questId) {
  return queryOne(
    `
    SELECT q.*, p.profession_code, p.profession_name_th, c.category_code, c.category_name
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    WHERE q.quest_id = $1
    LIMIT 1
    `,
    [questId]
  );
}

async function findQuestRequirements(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );
}

async function findRequirementById(requirementId) {
  return queryOne(
    `SELECT * FROM public.tb_quest_master_requirement WHERE requirement_id = $1 LIMIT 1`,
    [requirementId]
  );
}

async function findQuestRewards(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );
}

async function findRewardById(rewardId) {
  return queryOne(
    `SELECT * FROM public.tb_quest_master_reward WHERE reward_id = $1 LIMIT 1`,
    [rewardId]
  );
}

async function findQuestDependencies(questId) {
  return query(
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
}

async function findQuestImages(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY display_order ASC, created_at ASC
    `,
    [questId]
  );
}

async function findQuestSteps(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY step_no ASC, created_at ASC
    `,
    [questId]
  );
}

async function updateQuestDescription(questId, actorTag, payload) {
  const before = await findQuestById(questId);
  const after = await queryOne(
    `
    UPDATE public.tb_quest_master
    SET
      quest_name = $2,
      quest_description = $3,
      panel_title = $4,
      panel_description = $5,
      button_label = $6,
      updated_at = now(),
      updated_by = $7
    WHERE quest_id = $1
    RETURNING *
    `,
    [
      questId,
      payload.questName,
      payload.questDescription || null,
      payload.panelTitle || null,
      payload.panelDescription || null,
      payload.buttonLabel || null,
      actorTag
    ]
  );
  return { before, after };
}

async function createQuest(payload, actorTag) {
  const profession = await queryOne(
    `SELECT profession_id FROM public.tb_quest_master_profession WHERE profession_code = $1 LIMIT 1`,
    [payload.professionCode]
  );
  if (!profession) throw new Error('ไม่พบ profession_code');

  const category = await queryOne(
    `SELECT category_id FROM public.tb_quest_master_category WHERE category_code = $1 LIMIT 1`,
    [payload.categoryCode]
  );
  if (!category) throw new Error('ไม่พบ category_code');

  const duplicate = await queryOne(
    `SELECT quest_id FROM public.tb_quest_master WHERE quest_code = $1 LIMIT 1`,
    [payload.questCode]
  );
  if (duplicate) throw new Error('quest_code นี้มีอยู่แล้ว');

  const displayOrderRow = await queryOne(
    `
    SELECT COALESCE(MAX(display_order), 0) + 10 AS next_display_order
    FROM public.tb_quest_master
    WHERE profession_id = $1
      AND quest_level = $2
    `,
    [profession.profession_id, payload.questLevel]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master
    (
      quest_code, quest_name, quest_description, category_id, profession_id,
      quest_level, display_order, is_step_quest, requires_ticket,
      requires_admin_approval, is_repeatable, is_global_quest,
      is_active, created_at, updated_at, created_by, updated_by
    )
    VALUES
    (
      $1, $2, NULL, $3, $4,
      $5, $6, $7, $8,
      TRUE, $9, FALSE,
      TRUE, now(), now(), $10, $10
    )
    RETURNING *
    `,
    [
      payload.questCode,
      payload.questName,
      category.category_id,
      profession.profession_id,
      payload.questLevel,
      Number(displayOrderRow?.next_display_order || 10),
      payload.isStepQuest,
      payload.requiresTicket,
      payload.isRepeatable,
      actorTag
    ]
  );
}

async function addRequirement(questId, payload) {
  const sortRow = await queryOne(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
    `,
    [questId]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master_requirement
    (
      quest_id, requirement_type, item_name, required_quantity,
      display_text, admin_display_text, sort_order,
      is_required, is_active, created_at, updated_at
    )
    VALUES
    (
      $1, $2, $3, $4, $5, $6, $7,
      TRUE, TRUE, now(), now()
    )
    RETURNING *
    `,
    [
      questId,
      payload.requirementType,
      payload.itemName || null,
      payload.requiredQuantity || null,
      payload.displayText || null,
      payload.adminDisplayText || null,
      Number(sortRow?.next_sort_order || 1)
    ]
  );
}

async function updateRequirement(requirementId, payload) {
  const before = await findRequirementById(requirementId);
  const after = await queryOne(
    `
    UPDATE public.tb_quest_master_requirement
    SET
      requirement_type = $2,
      item_name = $3,
      required_quantity = $4,
      display_text = $5,
      admin_display_text = $6,
      updated_at = now()
    WHERE requirement_id = $1
    RETURNING *
    `,
    [
      requirementId,
      payload.requirementType,
      payload.itemName || null,
      payload.requiredQuantity || null,
      payload.displayText || null,
      payload.adminDisplayText || null
    ]
  );
  return { before, after };
}

async function addReward(questId, payload) {
  const sortRow = await queryOne(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
    `,
    [questId]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master_reward
    (
      quest_id, reward_type, reward_display_text, reward_item_name,
      reward_quantity, reward_value_number, discord_role_name,
      sort_order, is_active, created_at, updated_at
    )
    VALUES
    (
      $1, $2, $3, $4, $5, $6, $7,
      $8, TRUE, now(), now()
    )
    RETURNING *
    `,
    [
      questId,
      payload.rewardType,
      payload.rewardDisplayText || null,
      payload.rewardItemName || null,
      payload.rewardQuantity || null,
      payload.rewardValueNumber || null,
      payload.discordRoleName || null,
      Number(sortRow?.next_sort_order || 1)
    ]
  );
}

async function updateReward(rewardId, payload) {
  const before = await findRewardById(rewardId);
  const after = await queryOne(
    `
    UPDATE public.tb_quest_master_reward
    SET
      reward_type = $2,
      reward_display_text = $3,
      reward_item_name = $4,
      reward_quantity = $5,
      reward_value_number = $6,
      discord_role_name = $7,
      updated_at = now()
    WHERE reward_id = $1
    RETURNING *
    `,
    [
      rewardId,
      payload.rewardType,
      payload.rewardDisplayText || null,
      payload.rewardItemName || null,
      payload.rewardQuantity || null,
      payload.rewardValueNumber || null,
      payload.discordRoleName || null
    ]
  );
  return { before, after };
}

async function replaceDependency(questId, payload) {
  const before = await findQuestDependencies(questId);

  await db().query(
    `
    UPDATE public.tb_quest_master_dependency
    SET is_active = FALSE,
        updated_at = now()
    WHERE quest_id = $1
      AND is_active = TRUE
    `,
    [questId]
  );

  let after = [];

  if (payload.dependencyType !== 'NONE') {
    let requiredQuestId = null;
    if (payload.dependencyType === 'PREVIOUS_QUEST') {
      const quest = await queryOne(
        `SELECT quest_id FROM public.tb_quest_master WHERE quest_code = $1 LIMIT 1`,
        [payload.requiredQuestCode]
      );
      if (!quest) throw new Error('ไม่พบ required quest code');
      requiredQuestId = quest.quest_id;
    }

    const row = await queryOne(
      `
      INSERT INTO public.tb_quest_master_dependency
      (
        quest_id, dependency_type, required_quest_id, required_level,
        required_role_id, required_role_name, condition_operator,
        sort_order, is_active, created_at, updated_at
      )
      VALUES
      (
        $1, $2, $3, $4,
        $5, $6, 'AND',
        1, TRUE, now(), now()
      )
      RETURNING *
      `,
      [
        questId,
        payload.dependencyType,
        requiredQuestId,
        payload.requiredLevel || null,
        payload.requiredRoleId || null,
        payload.requiredRoleName || null
      ]
    );
    after = [row];
  }

  return { before, after };
}

async function addImage(questId, payload) {
  const displayRow = await queryOne(
    `
    SELECT COALESCE(MAX(display_order), 0) + 1 AS next_display_order
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
    `,
    [questId]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master_media
    (
      quest_id, media_type, media_url, media_title, media_description,
      display_order, is_active, created_at, updated_at
    )
    VALUES
    (
      $1, 'GUIDE_IMAGE', $2, $3, $4,
      $5, TRUE, now(), now()
    )
    RETURNING *
    `,
    [
      questId,
      payload.mediaUrl,
      payload.mediaTitle || null,
      payload.mediaDescription || null,
      payload.displayOrder || Number(displayRow?.next_display_order || 1)
    ]
  );
}

async function toggleQuestActive(questId, actorTag) {
  const before = await findQuestById(questId);
  const after = await queryOne(
    `
    UPDATE public.tb_quest_master
    SET is_active = NOT is_active,
        updated_at = now(),
        updated_by = $2
    WHERE quest_id = $1
    RETURNING *
    `,
    [questId, actorTag]
  );
  return { before, after };
}

module.exports = {
  findActiveProfessions,
  findProfessionById,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findQuestById,
  findQuestRequirements,
  findRequirementById,
  findQuestRewards,
  findRewardById,
  findQuestDependencies,
  findQuestImages,
  findQuestSteps,
  updateQuestDescription,
  createQuest,
  addRequirement,
  updateRequirement,
  addReward,
  updateReward,
  replaceDependency,
  addImage,
  toggleQuestActive
};
