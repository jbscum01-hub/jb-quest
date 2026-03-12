const { getPool, withTransaction } = require('../pool');

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

async function findCategoryByCode(categoryCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT category_id, category_code, category_name, sort_order
    FROM public.tb_quest_master_category
    WHERE category_code = $1
      AND is_active = TRUE
    LIMIT 1
    `,
    [categoryCode]
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
           q.category_id,
           q.display_order,
           q.is_active,
           q.is_step_quest,
           q.requires_ticket,
           q.is_repeatable,
           c.category_code,
           p.profession_code,
           p.profession_name_th,
           p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    JOIN public.tb_quest_master_category c
      ON c.category_id = q.category_id
    WHERE p.profession_code = $1
      AND q.quest_level = $2
    ORDER BY q.display_order ASC, q.quest_code ASC
    `,
    [professionCode, level]
  );
  return result.rows;
}

async function findActiveMainQuestsByProfession(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, p.profession_code, p.profession_name_th, p.profession_name_en, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    JOIN public.tb_quest_master_category c
      ON c.category_id = q.category_id
    WHERE p.profession_code = $1
      AND q.is_active = TRUE
      AND q.is_repeatable = FALSE
      AND c.category_code = 'MAIN'
    ORDER BY q.quest_level ASC, q.display_order ASC, q.quest_code ASC
    `,
    [professionCode]
  );
  return result.rows;
}

async function findRepeatableQuestsByProfession(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, p.profession_code, p.profession_name_th, p.profession_name_en, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    JOIN public.tb_quest_master_category c
      ON c.category_id = q.category_id
    WHERE p.profession_code = $1
      AND q.is_active = TRUE
      AND (q.is_repeatable = TRUE OR c.category_code = 'REPEATABLE')
    ORDER BY q.quest_level ASC, q.display_order ASC, q.quest_code ASC
    `,
    [professionCode]
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
           q.display_order,
           q.is_active,
           q.is_step_quest,
           q.requires_ticket,
           c.category_code,
           p.profession_code,
           p.profession_name_th
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    JOIN public.tb_quest_master_category c
      ON c.category_id = q.category_id
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
    SELECT q.*, c.category_code, c.category_name,
           p.profession_code, p.profession_name_th, p.profession_name_en, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    JOIN public.tb_quest_master_category c
      ON c.category_id = q.category_id
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
    `SELECT * FROM public.tb_quest_master_requirement WHERE requirement_id = $1 LIMIT 1`,
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
    `SELECT * FROM public.tb_quest_master_reward WHERE reward_id = $1 LIMIT 1`,
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

async function findQuestGuideMedia(questId, client) {
  return findQuestGuideImages(questId, client);
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

async function findQuestStepById(stepId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT s.*, q.quest_code, q.quest_name, q.quest_level,
           p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master_step s
    JOIN public.tb_quest_master q ON q.quest_id = s.quest_id
    LEFT JOIN public.tb_quest_master_profession p ON p.profession_id = q.profession_id
    WHERE s.step_id = $1
    LIMIT 1
    `,
    [stepId]
  );
  return result.rows[0] || null;
}

async function findStepRequirements(stepId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_requirement
    WHERE step_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [stepId]
  );
  return result.rows;
}

async function findStepRewards(stepId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE step_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [stepId]
  );
  return result.rows;
}

async function findStepGuideImages(stepId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_media
    WHERE step_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY display_order ASC, created_at ASC
    `,
    [stepId]
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

async function getStepDetailBundle(stepId, client) {
  const step = await findQuestStepById(stepId, client);
  if (!step) return null;

  const [requirements, rewards, images] = await Promise.all([
    findStepRequirements(stepId, client),
    findStepRewards(stepId, client),
    findStepGuideImages(stepId, client)
  ]);

  return { step, requirements, rewards, images };
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
        input_label = NULLIF($2, ''),
        required_quantity = $3,
        display_text = NULL,
        admin_display_text = NULL,
        updated_by = $4,
        updated_at = NOW()
    WHERE requirement_id = $1
    RETURNING *
    `,
    [requirementId, payload.itemName, payload.requiredQuantity, updatedBy]
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
      requirement_id, quest_id, step_id, requirement_type,
      item_name, required_quantity, input_label,
      is_required, sort_order, is_active,
      created_at, updated_at
    )
    VALUES
    (
      gen_random_uuid(), $1, NULL, 'SCUM_ITEM',
      NULLIF($2, ''), $3, NULLIF($2, ''),
      TRUE, $4, TRUE,
      NOW(), NOW()
    )
    RETURNING *
    `,
    [questId, payload.itemName, payload.requiredQuantity, nextOrder]
  );
  return result.rows[0] || null;
}

async function normalizeRewardUpdate(db, rewardType, rewardName, rewardAmount) {
  return {
    rewardType,
    rewardName: rewardName || null,
    rewardAmount: rewardAmount ? Number(rewardAmount) : null
  };
}

async function updateQuestReward(rewardId, payload, updatedBy, client) {
  const db = getDb(client);
  const normalized = await normalizeRewardUpdate(db, payload.rewardType, payload.rewardName, payload.rewardAmount);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_reward
    SET reward_type = $2,
        reward_item_name = CASE WHEN $2 = 'SCUM_ITEM' THEN NULLIF($3::varchar, '') ELSE NULL END,
        reward_display_text = NULLIF($4::text, ''),
        reward_quantity = CASE WHEN $2 = 'SCUM_ITEM' THEN $5::integer ELSE NULL END,
        reward_value_number = CASE WHEN $2 IN ('SCUM_MONEY', 'FAME_POINT') THEN $5::integer ELSE NULL END,
        discord_role_name = CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3::varchar, '') ELSE NULL END,
        reward_value_text = CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3::varchar, '') ELSE NULL END,
        updated_by = $6,
        updated_at = NOW()
    WHERE reward_id = $1
    RETURNING *
    `,
    [rewardId, normalized.rewardType, normalized.rewardName, payload.rewardDisplayText, normalized.rewardAmount, updatedBy]
  );
  return result.rows[0] || null;
}

async function addQuestReward(questId, payload, updatedBy, client) {
  const db = getDb(client);
  const normalized = await normalizeRewardUpdate(db, payload.rewardType, payload.rewardName, payload.rewardAmount);
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
      reward_id, quest_id, step_id, reward_type,
      reward_value_text, reward_value_number,
      reward_item_name, reward_quantity,
      discord_role_name, reward_cycle_type,
      reward_display_text, grant_on,
      sort_order, is_active, created_at, updated_at
    )
    VALUES
    (
      gen_random_uuid(), $1, NULL, $2,
      CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3::varchar, '') ELSE NULL END,
      CASE WHEN $2 IN ('SCUM_MONEY', 'FAME_POINT') THEN $4::integer ELSE NULL END,
      CASE WHEN $2 = 'SCUM_ITEM' THEN NULLIF($3::varchar, '') ELSE NULL END,
      CASE WHEN $2 = 'SCUM_ITEM' THEN $4::integer ELSE NULL END,
      CASE WHEN $2 = 'DISCORD_ROLE' THEN NULLIF($3::varchar, '') ELSE NULL END,
      'ONE_TIME', NULLIF($5::text, ''), 'QUEST_COMPLETE',
      $6, TRUE, NOW(), NOW()
    )
    RETURNING *
    `,
    [questId, normalized.rewardType, normalized.rewardName, normalized.rewardAmount, payload.rewardDisplayText, nextOrder]
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
      AND step_id IS NULL
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
      media_id, quest_id, step_id, media_type,
      media_url, media_title, media_description,
      display_order, is_active, created_at, updated_at
    )
    VALUES
    (
      gen_random_uuid(), $1, NULL, 'GUIDE_IMAGE',
      $2, NULLIF($3, ''), NULLIF($4, ''),
      $5, TRUE, NOW(), NOW()
    )
    RETURNING *
    `,
    [questId, payload.imageUrl, payload.imageTitle, payload.imageDescription, nextOrder]
  );
  return result.rows[0] || null;
}

async function deactivateQuestGuideImage(mediaId, actorId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_media
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE media_id = $1
    RETURNING *
    `,
    [mediaId]
  );
  return result.rows[0] || null;
}

async function findAvailableDependencyQuests(questId, client) {
  const quest = await findQuestById(questId, client);
  if (!quest) return [];
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.quest_id, q.quest_code, q.quest_name, q.quest_level, q.display_order,
           p.profession_code, p.profession_name_th
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p ON p.profession_id = q.profession_id
    WHERE q.is_active = TRUE
      AND q.quest_id <> $1
      AND q.profession_id = $2
      AND COALESCE(q.quest_level, 0) <= COALESCE($3, 0)
    ORDER BY q.quest_level ASC, q.display_order ASC, q.quest_code ASC
    LIMIT 25
    `,
    [questId, quest.profession_id, quest.quest_level]
  );
  return result.rows;
}

async function replaceQuestDependency(questId, selectedQuestId, updatedBy, client) {
  return withTransaction(async (tx) => {
    await tx.query(
      `
      UPDATE public.tb_quest_master_dependency
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE quest_id = $1
        AND is_active = TRUE
      `,
      [questId]
    );

    if (!selectedQuestId) {
      await tx.query(
        `
        UPDATE public.tb_quest_master
        SET unlock_mode = 'NONE',
            updated_at = NOW(),
            updated_by = $2
        WHERE quest_id = $1
        `,
        [questId, updatedBy]
      );
      return null;
    }

    await tx.query(
      `
      INSERT INTO public.tb_quest_master_dependency
      (
        dependency_id, quest_id, dependency_type, required_quest_id,
        condition_operator, sort_order, is_active, created_at, updated_at
      )
      VALUES
      (
        gen_random_uuid(), $1, 'PREVIOUS_QUEST', $2,
        'AND', 1, TRUE, NOW(), NOW()
      )
      `,
      [questId, selectedQuestId]
    );

    await tx.query(
      `
      UPDATE public.tb_quest_master
      SET unlock_mode = 'PREVIOUS_QUEST',
          updated_at = NOW(),
          updated_by = $2
      WHERE quest_id = $1
      `,
      [questId, updatedBy]
    );

    return selectedQuestId;
  });
}

async function createQuest(payload, actorId, client) {
  const db = getDb(client);
  const profession = await findProfessionByCode(payload.professionCode, client);
  if (!profession) throw new Error('ไม่พบสายอาชีพที่เลือก');

  const categoryCode = payload.categoryCode || (payload.isRepeatable ? 'REPEATABLE' : 'MAIN');
  const category = await findCategoryByCode(categoryCode, client);
  if (!category) throw new Error(`ไม่พบหมวดเควส ${categoryCode}`);

  const orderResult = await db.query(
    `
    SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
    FROM public.tb_quest_master
    WHERE profession_id = $1
      AND quest_level = $2
    `,
    [profession.profession_id, payload.questLevel]
  );
  const nextOrder = Number(orderResult.rows[0]?.next_order || 1);

  const result = await db.query(
    `
    INSERT INTO public.tb_quest_master
    (
      quest_id, quest_code, quest_name, quest_description,
      category_id, profession_id, quest_level, display_order,
      is_step_quest, requires_ticket, requires_admin_approval,
      is_repeatable, unlock_mode, panel_title, panel_description,
      button_label, admin_note, is_active,
      created_at, updated_at, created_by, updated_by
    )
    VALUES
    (
      gen_random_uuid(), $1, $2, NULLIF($3, ''),
      $4, $5, $6, $7,
      $8, $9, TRUE,
      $10, CASE WHEN $11 THEN 'PREVIOUS_QUEST' ELSE 'NONE' END,
      NULLIF($12, ''), NULLIF($13, ''),
      COALESCE(NULLIF($14, ''), 'ส่งเควส'), NULLIF($15, ''), TRUE,
      NOW(), NOW(), $16, $16
    )
    RETURNING quest_id
    `,
    [
      payload.questCode,
      payload.questName,
      payload.questDescription,
      category.category_id,
      profession.profession_id,
      payload.questLevel,
      nextOrder,
      !!payload.isStepQuest,
      !!payload.requiresTicket,
      !!payload.isRepeatable,
      !!payload.dependencyQuestId,
      payload.panelTitle || payload.questName,
      payload.panelDescription || payload.questDescription,
      payload.buttonLabel || 'ส่งเควส',
      payload.adminNote || null,
      actorId
    ]
  );

  const questId = result.rows[0]?.quest_id;
  if (payload.dependencyQuestId) {
    await replaceQuestDependency(questId, payload.dependencyQuestId, actorId, client);
  }
  return questId;
}

async function createQuestStep(questId, payload, actorId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_master_step
    (
      step_id, quest_id, step_no, step_title, step_description,
      requires_text_input, requires_attachment, requires_admin_approval,
      allow_resubmit, success_message, failure_message,
      is_active, created_at, updated_at
    )
    VALUES
    (
      gen_random_uuid(), $1, $2, $3, NULLIF($4, ''),
      $5, $6, $7,
      $8, NULLIF($9, ''), NULLIF($10, ''),
      TRUE, NOW(), NOW()
    )
    RETURNING *
    `,
    [
      questId,
      payload.stepNo,
      payload.stepTitle,
      payload.stepDescription,
      payload.requiresTextInput,
      payload.requiresAttachment,
      payload.requiresAdminApproval,
      payload.allowResubmit,
      payload.successMessage,
      payload.failureMessage
    ]
  );
  return result.rows[0] || null;
}

async function updateQuestStep(stepId, payload, actorId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_step
    SET step_no = $2,
        step_title = $3,
        step_description = NULLIF($4, ''),
        requires_text_input = $5,
        requires_attachment = $6,
        requires_admin_approval = $7,
        allow_resubmit = $8,
        success_message = NULLIF($9, ''),
        failure_message = NULLIF($10, ''),
        updated_at = NOW()
    WHERE step_id = $1
    RETURNING *
    `,
    [
      stepId,
      payload.stepNo,
      payload.stepTitle,
      payload.stepDescription,
      payload.requiresTextInput,
      payload.requiresAttachment,
      payload.requiresAdminApproval,
      payload.allowResubmit,
      payload.successMessage,
      payload.failureMessage
    ]
  );
  return result.rows[0] || null;
}

async function updateQuestStepActive(stepId, isActive, actorId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_step
    SET is_active = $2,
        updated_at = NOW()
    WHERE step_id = $1
    RETURNING *
    `,
    [stepId, isActive]
  );
  return result.rows[0] || null;
}

async function addStepGuideImage(stepId, payload, actorId, client) {
  const step = await findQuestStepById(stepId, client);
  if (!step) throw new Error('ไม่พบ Step ที่เลือก');
  const db = getDb(client);
  const orderResult = await db.query(
    `
    SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
    FROM public.tb_quest_master_media
    WHERE step_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    `,
    [stepId]
  );
  const nextOrder = Number(orderResult.rows[0]?.next_order || 1);
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_master_media
    (
      media_id, quest_id, step_id, media_type,
      media_url, media_title, media_description,
      display_order, is_active, created_at, updated_at
    )
    VALUES
    (
      gen_random_uuid(), $1, $2, 'GUIDE_IMAGE',
      $3, NULLIF($4, ''), NULLIF($5, ''),
      $6, TRUE, NOW(), NOW()
    )
    RETURNING *
    `,
    [step.quest_id, stepId, payload.imageUrl, payload.imageTitle, payload.imageDescription, nextOrder]
  );
  return result.rows[0] || null;
}

async function deactivateStepGuideImage(mediaId, actorId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_media
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE media_id = $1
    RETURNING *
    `,
    [mediaId]
  );
  return result.rows[0] || null;
}

module.exports = {
  listActiveProfessions,
  findProfessionByCode,
  findQuestsByProfessionAndLevel,
  findActiveMainQuestsByProfession,
  findRepeatableQuestsByProfession,
  searchQuests,
  findQuestById,
  findQuestDependencies,
  findQuestRequirements,
  findQuestRequirementById,
  findQuestRewards,
  findQuestRewardById,
  findQuestGuideImages,
  findQuestGuideMedia,
  findQuestSteps,
  findQuestStepById,
  findStepGuideImages,
  getQuestDetailBundle,
  getStepDetailBundle,
  updateQuestActive,
  updateQuestDescription,
  updateQuestRequirement,
  addQuestRequirement,
  updateQuestReward,
  addQuestReward,
  addQuestGuideImage,
  deactivateQuestGuideImage,
  findAvailableDependencyQuests,
  replaceQuestDependency,
  createQuest,
  createQuestStep,
  updateQuestStep,
  updateQuestStepActive,
  addStepGuideImage,
  deactivateStepGuideImage
};
