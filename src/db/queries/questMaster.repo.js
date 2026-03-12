const { getPool, withTransaction } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findQuestById(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, c.category_code, c.category_name, p.profession_code, p.profession_name_th, p.icon_emoji
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
    ORDER BY sort_order ASC, profession_code ASC
    `
  );

  return result.rows;
}

async function listQuestLevelsByProfession(professionCode, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT DISTINCT q.quest_level
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.is_active = TRUE
    ORDER BY q.quest_level ASC
    `,
    [professionCode]
  );

  return result.rows.map((row) => row.quest_level).filter((v) => v !== null);
}

async function listQuestsByProfessionAndLevel(professionCode, level, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.quest_level = $2
    ORDER BY q.display_order ASC, q.created_at ASC
    `,
    [professionCode, level]
  );

  return result.rows;
}

async function searchQuests(keyword, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.*, p.profession_code, p.profession_name_th, p.icon_emoji
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.quest_code ILIKE $1
       OR q.quest_name ILIKE $1
    ORDER BY q.updated_at DESC, q.created_at DESC
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

async function findRequirementById(requirementId, client) {
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

async function findQuestGuideMedia(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND is_active = TRUE
      AND step_id IS NULL
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY display_order ASC, created_at ASC
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
      AND step_id IS NULL
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findRewardById(rewardId, client) {
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
  const [quest, dependencies, requirements, rewards, images, steps] = await Promise.all([
    findQuestById(questId, client),
    findQuestDependencies(questId, client),
    findQuestRequirements(questId, client),
    findQuestRewards(questId, client),
    findQuestGuideMedia(questId, client),
    findQuestSteps(questId, client)
  ]);

  if (!quest) return null;

  return {
    quest,
    dependencies,
    requirements,
    rewards,
    images,
    steps
  };
}

async function getDefaultCategoryId(client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT category_id
    FROM public.tb_quest_master_category
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    LIMIT 1
    `
  );
  return result.rows[0]?.category_id || null;
}

async function createQuest(input, actorId, client) {
  return withTransaction(async (tx) => {
    const profession = await findProfessionByCode(input.professionCode, tx);
    if (!profession) {
      throw new Error(`ไม่พบสายอาชีพ ${input.professionCode}`);
    }

    const categoryId = await getDefaultCategoryId(tx);
    if (!categoryId) {
      throw new Error('ไม่พบ category สำหรับสร้างเควส');
    }

    const questResult = await tx.query(
      `
      INSERT INTO public.tb_quest_master
      (
        quest_code, quest_name, quest_description,
        category_id, profession_id, quest_level,
        display_order, tier_type,
        is_step_quest, requires_ticket, requires_admin_approval,
        is_repeatable, unlock_mode, panel_title, panel_description,
        button_label, admin_note, is_active,
        created_by, updated_by
      )
      VALUES
      (
        $1, $2, $3,
        $4, $5, $6,
        $7, 'NORMAL',
        $8, $9, TRUE,
        $10, CASE WHEN $11 THEN 'PREVIOUS_QUEST' ELSE 'NONE' END, $12, $13,
        $14, $15, TRUE,
        $16, $16
      )
      RETURNING quest_id
      `,
      [
        input.questCode,
        input.questName,
        input.questDescription,
        categoryId,
        profession.profession_id,
        input.questLevel,
        input.displayOrder,
        input.isStepQuest,
        input.requiresTicket,
        input.isRepeatable,
        Boolean(input.dependencyQuestId),
        input.panelTitle || input.questName,
        input.panelDescription || input.questDescription,
        input.buttonLabel || 'ส่งเควส',
        input.adminNote || null,
        actorId || null
      ]
    );

    const questId = questResult.rows[0].quest_id;

    if (input.dependencyQuestId) {
      await tx.query(
        `
        INSERT INTO public.tb_quest_master_dependency
        (
          quest_id, dependency_type, required_quest_id,
          condition_operator, sort_order, is_active,
          created_by, updated_by
        )
        VALUES ($1, 'PREVIOUS_QUEST', $2, 'AND', 1, TRUE, $3, $3)
        `,
        [questId, input.dependencyQuestId, actorId || null]
      );
    }

    return questId;
  });
}

async function updateQuestDescription(questId, input, actorId, client) {
  const db = getDb(client);
  await db.query(
    `
    UPDATE public.tb_quest_master
    SET quest_name = $2,
        quest_description = $3,
        panel_title = $4,
        panel_description = $5,
        button_label = $6,
        admin_note = $7,
        updated_at = NOW(),
        updated_by = $8
    WHERE quest_id = $1
    `,
    [
      questId,
      input.questName,
      input.questDescription,
      input.panelTitle,
      input.panelDescription,
      input.buttonLabel,
      input.adminNote,
      actorId || null
    ]
  );
}

async function toggleQuestActive(questId, actorId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master
    SET is_active = NOT is_active,
        updated_at = NOW(),
        updated_by = $2
    WHERE quest_id = $1
    RETURNING is_active
    `,
    [questId, actorId || null]
  );
  return result.rows[0] || null;
}

async function addRequirement(questId, input, actorId, client) {
  const db = getDb(client);
  await db.query(
    `
    INSERT INTO public.tb_quest_master_requirement
    (
      quest_id, step_id, requirement_type,
      item_code, item_name, required_quantity,
      input_label, display_text, admin_display_text,
      is_required, sort_order, is_active,
      created_at, updated_at, created_by, updated_by
    )
    VALUES
    (
      $1, NULL, $2,
      $3, $4, $5,
      $6, $7, $8,
      TRUE, $9, TRUE,
      NOW(), NOW(), $10, $10
    )
    `,
    [
      questId,
      input.requirementType,
      input.itemCode,
      input.itemName,
      input.requiredQuantity,
      input.inputLabel,
      input.displayText,
      input.adminDisplayText,
      input.sortOrder,
      actorId || null
    ]
  );
}

async function updateRequirement(requirementId, input, actorId, client) {
  const db = getDb(client);
  await db.query(
    `
    UPDATE public.tb_quest_master_requirement
    SET requirement_type = $2,
        item_code = $3,
        item_name = $4,
        required_quantity = $5,
        input_label = $6,
        display_text = $7,
        admin_display_text = $8,
        sort_order = $9,
        updated_at = NOW(),
        updated_by = $10
    WHERE requirement_id = $1
    `,
    [
      requirementId,
      input.requirementType,
      input.itemCode,
      input.itemName,
      input.requiredQuantity,
      input.inputLabel,
      input.displayText,
      input.adminDisplayText,
      input.sortOrder,
      actorId || null
    ]
  );
}

async function addReward(questId, input, actorId, client) {
  const db = getDb(client);
  await db.query(
    `
    INSERT INTO public.tb_quest_master_reward
    (
      quest_id, step_id, reward_type,
      reward_value_text, reward_value_number,
      reward_item_code, reward_item_name,
      reward_quantity, discord_role_id, discord_role_name,
      reward_cycle_type, reward_display_text, grant_on,
      sort_order, is_active, created_at, updated_at,
      created_by, updated_by
    )
    VALUES
    (
      $1, NULL, $2,
      $3, $4,
      $5, $6,
      $7, $8, $9,
      'ONE_TIME', $10, 'QUEST_COMPLETE',
      $11, TRUE, NOW(), NOW(),
      $12, $12
    )
    `,
    [
      questId,
      input.rewardType,
      input.rewardValueText,
      input.rewardValueNumber,
      input.rewardItemCode,
      input.rewardItemName,
      input.rewardQuantity,
      input.discordRoleId,
      input.discordRoleName,
      input.rewardDisplayText,
      input.sortOrder,
      actorId || null
    ]
  );
}

async function updateReward(rewardId, input, actorId, client) {
  const db = getDb(client);
  await db.query(
    `
    UPDATE public.tb_quest_master_reward
    SET reward_type = $2,
        reward_value_text = $3,
        reward_value_number = $4,
        reward_item_code = $5,
        reward_item_name = $6,
        reward_quantity = $7,
        discord_role_id = $8,
        discord_role_name = $9,
        reward_display_text = $10,
        sort_order = $11,
        updated_at = NOW(),
        updated_by = $12
    WHERE reward_id = $1
    `,
    [
      rewardId,
      input.rewardType,
      input.rewardValueText,
      input.rewardValueNumber,
      input.rewardItemCode,
      input.rewardItemName,
      input.rewardQuantity,
      input.discordRoleId,
      input.discordRoleName,
      input.rewardDisplayText,
      input.sortOrder,
      actorId || null
    ]
  );
}

async function replaceQuestDependency(questId, dependencyQuestId, actorId, client) {
  return withTransaction(async (tx) => {
    await tx.query(
      `
      UPDATE public.tb_quest_master_dependency
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $2
      WHERE quest_id = $1
        AND is_active = TRUE
      `,
      [questId, actorId || null]
    );

    if (dependencyQuestId) {
      await tx.query(
        `
        INSERT INTO public.tb_quest_master_dependency
        (
          quest_id, dependency_type, required_quest_id,
          condition_operator, sort_order, is_active,
          created_at, updated_at, created_by, updated_by
        )
        VALUES
        ($1, 'PREVIOUS_QUEST', $2, 'AND', 1, TRUE, NOW(), NOW(), $3, $3)
        `,
        [questId, dependencyQuestId, actorId || null]
      );

      await tx.query(
        `
        UPDATE public.tb_quest_master
        SET unlock_mode = 'PREVIOUS_QUEST',
            updated_at = NOW(),
            updated_by = $2
        WHERE quest_id = $1
        `,
        [questId, actorId || null]
      );
      return;
    }

    await tx.query(
      `
      UPDATE public.tb_quest_master
      SET unlock_mode = 'NONE',
          updated_at = NOW(),
          updated_by = $2
      WHERE quest_id = $1
      `,
      [questId, actorId || null]
    );
  });
}

async function addGuideImage(questId, input, actorId, client) {
  const db = getDb(client);
  await db.query(
    `
    INSERT INTO public.tb_quest_master_media
    (
      quest_id, step_id, media_type,
      media_url, media_title, media_description,
      display_order, is_active, created_at, updated_at,
      created_by, updated_by
    )
    VALUES
    (
      $1, NULL, 'GUIDE_IMAGE',
      $2, $3, $4,
      $5, TRUE, NOW(), NOW(),
      $6, $6
    )
    `,
    [questId, input.mediaUrl, input.mediaTitle, input.mediaDescription, input.displayOrder, actorId || null]
  );
}

async function deactivateGuideImage(mediaId, actorId, client) {
  const db = getDb(client);
  await db.query(
    `
    UPDATE public.tb_quest_master_media
    SET is_active = FALSE,
        updated_at = NOW(),
        updated_by = $2
    WHERE media_id = $1
    `,
    [mediaId, actorId || null]
  );
}

async function listDependencyCandidateQuests(questId, professionCode, questLevel, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT q.quest_id, q.quest_code, q.quest_name
    FROM public.tb_quest_master q
    JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.quest_id <> $2
      AND q.quest_level <= $3
    ORDER BY q.quest_level ASC, q.display_order ASC, q.created_at ASC
    LIMIT 24
    `,
    [professionCode, questId, questLevel || 999]
  );
  return result.rows;
}

module.exports = {
  findQuestById,
  findProfessionByCode,
  listActiveProfessions,
  listQuestLevelsByProfession,
  listQuestsByProfessionAndLevel,
  searchQuests,
  findQuestDependencies,
  findNextMainQuestByProfession,
  findQuestRequirements,
  findRequirementById,
  findQuestGuideMedia,
  findQuestRewards,
  findRewardById,
  findQuestSteps,
  getQuestDetailBundle,
  createQuest,
  updateQuestDescription,
  toggleQuestActive,
  addRequirement,
  updateRequirement,
  addReward,
  updateReward,
  replaceQuestDependency,
  addGuideImage,
  deactivateGuideImage,
  listDependencyCandidateQuests
};
