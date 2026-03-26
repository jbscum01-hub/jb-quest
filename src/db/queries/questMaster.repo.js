const { getPool, withTransaction } = require('../pool');

function getDb(client) {
  return client || getPool();
}

let questMasterColumnCache = null;

async function getQuestMasterColumnSet(client) {
  if (questMasterColumnCache) return questMasterColumnCache;
  const db = getDb(client);
  const result = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tb_quest_master'
  `);
  questMasterColumnCache = new Set(result.rows.map((row) => row.column_name));
  return questMasterColumnCache;
}

function parseNullableInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error('ค่าที่ส่งมาต้องเป็นตัวเลขจำนวนเต็ม');
  return parsed;
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
    LEFT JOIN public.tb_quest_master_profession p
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
    LEFT JOIN public.tb_quest_master_profession p
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
    LEFT JOIN public.tb_quest_master_profession p
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

async function findQuestsByCategory(categoryCode, client) {
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
    JOIN public.tb_quest_master_category c
      ON c.category_id = q.category_id
    LEFT JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    WHERE c.category_code = $1
    ORDER BY COALESCE(q.quest_level, 9999) ASC, q.display_order ASC, q.quest_code ASC
    `,
    [categoryCode]
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
    LEFT JOIN public.tb_quest_master_profession p
      ON p.profession_id = q.profession_id
    JOIN public.tb_quest_master_category c
      ON c.category_id = q.category_id
    WHERE q.quest_code ILIKE $1
       OR q.quest_name ILIKE $1
       OR p.profession_code ILIKE $1
       OR p.profession_name_th ILIKE $1
    ORDER BY COALESCE(p.sort_order, 9999) ASC, COALESCE(q.quest_level, 9999) ASC, q.display_order ASC, q.quest_code ASC
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
    LEFT JOIN public.tb_quest_master_profession p
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
  return [];
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

  const [requirements, rewards, images, steps] = await Promise.all([
    findQuestRequirements(questId, client),
    findQuestRewards(questId, client),
    findQuestGuideImages(questId, client),
    findQuestSteps(questId, client)
  ]);

  return { quest, dependencies: [], requirements, rewards, images, steps };
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


async function updateQuestScheduleAndLimits(questId, payload, updatedBy, client) {
  const db = getDb(client);
  const columns = await getQuestMasterColumnSet(client);
  const assignments = [];
  const values = [questId];

  const bind = (fragment, value) => {
    values.push(value);
    assignments.push(fragment.replaceAll('$VALUE', `$${values.length}`));
  };

  const startAt = payload.startAt || null;
  const durationDays = parseNullableInteger(payload.durationDays);
  const submissionLimitCount = parseNullableInteger(payload.submissionLimitCount);
  const submissionLimitPeriodDays = parseNullableInteger(payload.submissionLimitPeriodDays);
  const weeklyClaimLimit = parseNullableInteger(payload.weeklyClaimLimit);

  if (columns.has('start_at')) bind('start_at = $VALUE::timestamp', startAt);
  if (columns.has('duration_days')) bind('duration_days = $VALUE::integer', durationDays);
  if (columns.has('end_at')) {
    if (columns.has('start_at') && columns.has('duration_days')) {
      values.push(startAt);
      const startIdx = values.length;
      values.push(durationDays);
      const durationIdx = values.length;
      assignments.push(`end_at = CASE
          WHEN $${startIdx}::timestamp IS NOT NULL AND $${durationIdx}::integer IS NOT NULL AND $${durationIdx}::integer > 0
            THEN ($${startIdx}::timestamp + (($${durationIdx}::text || ' days')::interval))
          WHEN $${startIdx}::timestamp IS NULL OR $${durationIdx}::integer IS NULL OR $${durationIdx}::integer <= 0
            THEN NULL
          ELSE end_at
        END`);
    } else {
      assignments.push('end_at = NULL');
    }
  }
  if (columns.has('submission_limit_count')) bind('submission_limit_count = $VALUE::integer', submissionLimitCount);
  if (columns.has('submission_limit_period_days')) bind('submission_limit_period_days = $VALUE::integer', submissionLimitPeriodDays);
  if (columns.has('weekly_claim_limit')) {
    if (weeklyClaimLimit === null || weeklyClaimLimit === undefined) {
      assignments.push('weekly_claim_limit = NULL');
    } else {
      bind('weekly_claim_limit = $VALUE::integer', weeklyClaimLimit);
    }
  }

  values.push(updatedBy);
  assignments.push(`updated_by = $${values.length}`);
  assignments.push('updated_at = NOW()');

  const result = await db.query(
    `
    UPDATE public.tb_quest_master
    SET ${assignments.join(',\n        ')}
    WHERE quest_id = $1
    RETURNING *
    `,
    values
  );

  return result.rows[0] || null;
}

async function updateQuestRequirement(requirementId, payload, updatedBy, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_requirement
    SET display_text = NULLIF($2, ''),
        updated_by = $3,
        updated_at = NOW()
    WHERE requirement_id = $1
    RETURNING *
    `,
    [requirementId, payload.displayText, updatedBy]
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
      display_text, is_required, sort_order, is_active,
      created_at, updated_at, created_by, updated_by
    )
    VALUES
    (
      gen_random_uuid(), $1, NULL, 'CUSTOM_TEXT',
      NULLIF($2, ''), TRUE, $3, TRUE,
      NOW(), NOW(), $4, $4
    )
    RETURNING *
    `,
    [questId, payload.displayText, nextOrder, updatedBy]
  );
  return result.rows[0] || null;
}


async function updateQuestReward(rewardId, payload, updatedBy, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master_reward
    SET reward_type = $2::varchar,
        reward_display_text = NULLIF($3::text, ''),
        reward_spawn_command_template = CASE WHEN $2::varchar = 'SCUM_ITEM' THEN NULLIF($4::text, '') ELSE NULL END,
        discord_role_id = CASE WHEN $2::varchar = 'DISCORD_ROLE' THEN NULLIF($5::varchar, '') ELSE NULL END,
        updated_by = $6,
        updated_at = NOW()
    WHERE reward_id = $1
    RETURNING *
    `,
    [rewardId, payload.rewardType, payload.rewardDisplayText, payload.rewardSpawnCommandTemplate || null, payload.discordRoleId || null, updatedBy]
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
      reward_id, quest_id, step_id, reward_type, reward_spawn_command_template,
      discord_role_id, reward_display_text, grant_on, sort_order, is_active,
      created_at, updated_at, created_by, updated_by
    )
    VALUES
    (
      gen_random_uuid(), $1, NULL, $2::varchar,
      CASE WHEN $2::varchar = 'SCUM_ITEM' THEN NULLIF($3::text, '') ELSE NULL END,
      CASE WHEN $2::varchar = 'DISCORD_ROLE' THEN NULLIF($4::varchar, '') ELSE NULL END,
      NULLIF($5::text, ''), 'QUEST_COMPLETE', $6, TRUE,
      NOW(), NOW(), $7, $7
    )
    RETURNING *
    `,
    [questId, payload.rewardType, payload.rewardSpawnCommandTemplate || null, payload.discordRoleId || null, payload.rewardDisplayText, nextOrder, updatedBy]
  );
  return result.rows[0] || null;
}


async function updateQuestFameSettings(questId, payload, updatedBy, client) {
  const db = getDb(client);
  const fameRequiredDisplay = payload.fameRequiredDisplay === null || payload.fameRequiredDisplay === undefined || payload.fameRequiredDisplay === ''
    ? null
    : Number(payload.fameRequiredDisplay);

  const result = await db.query(
    `
    UPDATE public.tb_quest_master
    SET fame_required_display = $2,
        fame_note = NULLIF($3, ''),
        updated_by = $4,
        updated_at = NOW()
    WHERE quest_id = $1
    RETURNING *
    `,
    [questId, fameRequiredDisplay, payload.fameNote || '', updatedBy]
  );
  return result.rows[0] || null;
}

async function replaceQuestRequirementsBulk(questId, items, updatedBy, client) {
  return withTransaction(async (tx) => {
    await tx.query(
      `
      UPDATE public.tb_quest_master_requirement
      SET is_active = FALSE,
          updated_by = $2,
          updated_at = NOW()
      WHERE quest_id = $1
        AND step_id IS NULL
        AND is_active = TRUE
      `,
      [questId, updatedBy]
    );

    let sortOrder = 1;
    for (const item of items) {
      await tx.query(
        `
        INSERT INTO public.tb_quest_master_requirement
        (
          requirement_id, quest_id, step_id, requirement_type,
          display_text, is_required, sort_order, is_active,
          created_at, updated_at, created_by, updated_by
        )
        VALUES
        (
          gen_random_uuid(), $1, NULL, 'CUSTOM_TEXT',
          NULLIF($2, ''), TRUE, $3, TRUE,
          NOW(), NOW(), $4, $4
        )
        `,
        [questId, item.displayText || null, sortOrder, updatedBy]
      );
      sortOrder += 1;
    }
  }, client);
}

async function replaceQuestRewardsBulk(questId, items, updatedBy, client) {
  return withTransaction(async (tx) => {
    await tx.query(
      `
      UPDATE public.tb_quest_master_reward
      SET is_active = FALSE,
          updated_by = $2,
          updated_at = NOW()
      WHERE quest_id = $1
        AND step_id IS NULL
        AND is_active = TRUE
      `,
      [questId, updatedBy]
    );

    let sortOrder = 1;
    for (const item of items) {
      await tx.query(
        `
        INSERT INTO public.tb_quest_master_reward
        (
          reward_id, quest_id, step_id, reward_type, reward_spawn_command_template,
          discord_role_id, reward_display_text, grant_on, sort_order, is_active,
          created_at, updated_at, created_by, updated_by
        )
        VALUES
        (
          gen_random_uuid(), $1, NULL, $2, NULLIF($3, ''),
          NULLIF($4, ''), NULLIF($5, ''), 'QUEST_COMPLETE', $6, TRUE,
          NOW(), NOW(), $7, $7
        )
        `,
        [
          questId,
          item.rewardType,
          item.rewardSpawnCommandTemplate || null,
          item.discordRoleId || null,
          item.rewardDisplayText || null,
          sortOrder,
          updatedBy
        ]
      );
      sortOrder += 1;
    }
  }, client);
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
      AND reward_type IN ('SCUM_ITEM', 'DISCORD_ROLE')
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
  return [];
}

async function replaceQuestDependency(questId, selectedQuestId, updatedBy, client) {
  return null;
}

async function createQuest(payload, actorId, client) {
  const db = getDb(client);
  const categoryCode = payload.categoryCode || (payload.isRepeatable ? 'REPEATABLE' : 'MAIN');
  const category = await findCategoryByCode(categoryCode, client);
  if (!category) throw new Error(`ไม่พบหมวดเควส ${categoryCode}`);

  const isGlobalCategory = ['TIMED', 'LEGENDARY'].includes(categoryCode);
  let profession = null;

  if (payload.professionCode) {
    profession = await findProfessionByCode(payload.professionCode, client);
    if (!profession) throw new Error('ไม่พบสายอาชีพที่เลือก');
  } else if (!isGlobalCategory) {
    throw new Error('ไม่พบสายอาชีพที่เลือก');
  }

  const questLevel = profession ? payload.questLevel : null;

  const orderResult = profession
    ? await db.query(
      `
      SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
      FROM public.tb_quest_master
      WHERE profession_id = $1
        AND quest_level = $2
      `,
      [profession.profession_id, questLevel]
    )
    : await db.query(
      `
      SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
      FROM public.tb_quest_master
      WHERE category_id = $1
        AND profession_id IS NULL
      `,
      [category.category_id]
    );
  const nextOrder = Number(orderResult.rows[0]?.next_order || 1);

  const columns = await getQuestMasterColumnSet(client);
  const insertColumns = [
    'quest_id', 'quest_code', 'quest_name', 'quest_description',
    'category_id', 'profession_id', 'quest_level', 'display_order',
    'is_step_quest', 'requires_ticket', 'requires_admin_approval',
    'is_repeatable', 'unlock_mode', 'panel_title', 'panel_description',
    'button_label', 'admin_note', 'is_active'
  ];
  const placeholders = [
    'gen_random_uuid()', '$1', '$2', "NULLIF($3, '')",
    '$4', '$5', '$6', '$7',
    '$8', '$9', 'TRUE',
    '$10', "'NONE'",
    "NULLIF($11, '')", "NULLIF($12, '')",
    "COALESCE(NULLIF($13, ''), 'ส่งเควส')", "NULLIF($14, '')", 'TRUE'
  ];

  if (columns.has('start_at')) {
    insertColumns.push('start_at');
    placeholders.push('NULL');
  }
  if (columns.has('duration_days')) {
    insertColumns.push('duration_days');
    placeholders.push('NULL');
  }
  if (columns.has('end_at')) {
    insertColumns.push('end_at');
    placeholders.push('NULL');
  }
  if (columns.has('weekly_claim_limit')) {
    insertColumns.push('weekly_claim_limit');
    placeholders.push("CASE WHEN $16 = 'LEGENDARY' THEN 1 ELSE NULL END");
  }

  insertColumns.push('created_at', 'updated_at', 'created_by', 'updated_by');
  placeholders.push('NOW()', 'NOW()', '$15', '$15');

  const result = await db.query(
    `
    INSERT INTO public.tb_quest_master
    (
      ${insertColumns.join(', ')}
    )
    VALUES
    (
      ${placeholders.join(', ')}
    )
    RETURNING quest_id
    `,
    [
      payload.questCode,
      payload.questName,
      payload.questDescription,
      category.category_id,
      profession?.profession_id || null,
      questLevel,
      nextOrder,
      !!payload.isStepQuest,
      !!payload.requiresTicket,
      !!payload.isRepeatable,
      payload.panelTitle || payload.questName,
      payload.panelDescription || payload.questDescription,
      payload.buttonLabel || 'ส่งเควส',
      payload.adminNote || null,
      actorId,
      categoryCode
    ]
  );
  const questId = result.rows[0]?.quest_id;
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
      AND reward_type IN ('SCUM_ITEM', 'DISCORD_ROLE')
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
  findQuestsByCategory,
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
  updateQuestScheduleAndLimits,
  updateQuestRequirement,
  addQuestRequirement,
  replaceQuestRequirementsBulk,
  updateQuestReward,
  addQuestReward,
  replaceQuestRewardsBulk,
  updateQuestFameSettings,
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
