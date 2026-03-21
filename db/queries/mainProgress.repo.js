const { getPool } = require('../pool');

async function findPlayerProfession(playerId, professionId, client = getPool()) {
  const result = await client.query(
    `
    SELECT *
    FROM public.tb_quest_player_profession
    WHERE player_id = $1
      AND profession_id = $2
    LIMIT 1
    `,
    [playerId, professionId]
  );

  return result.rows[0] || null;
}

async function upsertPlayerProfession(
  { playerId, professionId, currentMainQuestId = null, currentMainLevel = null, isUnlocked = true },
  client = getPool()
) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_player_profession
    (player_id, profession_id, current_main_quest_id, current_main_level, is_unlocked, unlocked_at)
    VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN NOW() ELSE NULL END)
    ON CONFLICT (player_id, profession_id)
    DO UPDATE SET
      current_main_quest_id = COALESCE(EXCLUDED.current_main_quest_id, public.tb_quest_player_profession.current_main_quest_id),
      current_main_level = COALESCE(EXCLUDED.current_main_level, public.tb_quest_player_profession.current_main_level),
      is_unlocked = EXCLUDED.is_unlocked,
      unlocked_at = COALESCE(public.tb_quest_player_profession.unlocked_at, EXCLUDED.unlocked_at),
      updated_at = NOW()
    RETURNING *
    `,
    [playerId, professionId, currentMainQuestId, currentMainLevel, isUnlocked]
  );

  return result.rows[0];
}

async function setCurrentMainQuest(playerId, professionId, questId, questLevel, client = getPool()) {
  const result = await client.query(
    `
    UPDATE public.tb_quest_player_profession
    SET current_main_quest_id = $3,
        current_main_level = $4,
        updated_at = NOW()
    WHERE player_id = $1
      AND profession_id = $2
    RETURNING *
    `,
    [playerId, professionId, questId, questLevel]
  );

  return result.rows[0] || null;
}

async function markProfessionCompleted(playerId, professionId, client = getPool()) {
  const result = await client.query(
    `
    UPDATE public.tb_quest_player_profession
    SET current_main_quest_id = NULL,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE player_id = $1
      AND profession_id = $2
    RETURNING *
    `,
    [playerId, professionId]
  );

  return result.rows[0] || null;
}

async function findMainProgress(playerId, professionId, questId, client = getPool()) {
  const result = await client.query(
    `
    SELECT *
    FROM public.tb_quest_player_main_progress
    WHERE player_id = $1
      AND profession_id = $2
      AND quest_id = $3
    LIMIT 1
    `,
    [playerId, professionId, questId]
  );

  return result.rows[0] || null;
}

async function upsertMainProgress(
  { playerId, professionId, questId, progressStatus, reviewedBy = null, reviewRemark = null, incrementSubmission = false },
  client = getPool()
) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_player_main_progress
    (
      player_id,
      profession_id,
      quest_id,
      progress_status,
      first_available_at,
      last_submitted_at,
      reviewed_by,
      review_remark,
      submission_count
    )
    VALUES (
      $1,
      $2,
      $3,
      $4::varchar(30),
      CASE WHEN $4::varchar(30) = 'AVAILABLE' THEN NOW() ELSE NULL END,
      CASE WHEN $4::varchar(30) = 'PENDING_REVIEW' THEN NOW() ELSE NULL END,
      $5,
      $6,
      CASE WHEN $7 THEN 1 ELSE 0 END
    )
    ON CONFLICT (player_id, profession_id, quest_id)
    DO UPDATE SET
      progress_status = $4::varchar(30),
      first_available_at = CASE
        WHEN public.tb_quest_player_main_progress.first_available_at IS NULL
         AND $4::varchar(30) = 'AVAILABLE'
        THEN NOW()
        ELSE public.tb_quest_player_main_progress.first_available_at
      END,
      last_submitted_at = CASE
        WHEN $4::varchar(30) = 'PENDING_REVIEW'
        THEN NOW()
        ELSE public.tb_quest_player_main_progress.last_submitted_at
      END,
      last_reviewed_at = CASE
        WHEN $5 IS NOT NULL
          OR $6 IS NOT NULL
          OR $4::varchar(30) IN ('COMPLETED', 'REVISION_REQUIRED')
        THEN NOW()
        ELSE public.tb_quest_player_main_progress.last_reviewed_at
      END,
      last_completed_at = CASE
        WHEN $4::varchar(30) = 'COMPLETED'
        THEN NOW()
        ELSE public.tb_quest_player_main_progress.last_completed_at
      END,
      reviewed_by = COALESCE($5, public.tb_quest_player_main_progress.reviewed_by),
      review_remark = COALESCE($6, public.tb_quest_player_main_progress.review_remark),
      submission_count = public.tb_quest_player_main_progress.submission_count + CASE WHEN $7 THEN 1 ELSE 0 END,
      updated_at = NOW()
    RETURNING *
    `,
    [playerId, professionId, questId, progressStatus, reviewedBy, reviewRemark, incrementSubmission]
  );

  return result.rows[0];
}

async function findRepeatableState(playerId, professionId, questId, client = getPool()) {
  const result = await client.query(
    `
    SELECT *
    FROM public.tb_quest_player_repeatable_state
    WHERE player_id = $1
      AND profession_id = $2
      AND quest_id = $3
    LIMIT 1
    `,
    [playerId, professionId, questId]
  );

  return result.rows[0] || null;
}

async function upsertRepeatableState(
  { playerId, professionId, questId, stateStatus, reviewedBy = null, reviewRemark = null, nextAvailableAt = null, incrementRepeat = false },
  client = getPool()
) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_player_repeatable_state
    (
      player_id,
      profession_id,
      quest_id,
      state_status,
      last_submitted_at,
      reviewed_by,
      review_remark,
      next_available_at,
      repeat_count
    )
    VALUES (
      $1,
      $2,
      $3,
      $4::varchar(30),
      CASE WHEN $4::varchar(30) = 'PENDING_REVIEW' THEN NOW() ELSE NULL END,
      $5,
      $6,
      $7,
      CASE WHEN $8 THEN 1 ELSE 0 END
    )
    ON CONFLICT (player_id, profession_id, quest_id)
    DO UPDATE SET
      state_status = $4::varchar(30),
      last_submitted_at = CASE
        WHEN $4::varchar(30) = 'PENDING_REVIEW'
        THEN NOW()
        ELSE public.tb_quest_player_repeatable_state.last_submitted_at
      END,
      last_reviewed_at = CASE
        WHEN $5 IS NOT NULL
          OR $6 IS NOT NULL
          OR $4::varchar(30) IN ('COOLDOWN', 'REVISION_REQUIRED')
        THEN NOW()
        ELSE public.tb_quest_player_repeatable_state.last_reviewed_at
      END,
      last_completed_at = CASE
        WHEN $4::varchar(30) = 'COOLDOWN'
        THEN NOW()
        ELSE public.tb_quest_player_repeatable_state.last_completed_at
      END,
      next_available_at = COALESCE($7, public.tb_quest_player_repeatable_state.next_available_at),
      reviewed_by = COALESCE($5, public.tb_quest_player_repeatable_state.reviewed_by),
      review_remark = COALESCE($6, public.tb_quest_player_repeatable_state.review_remark),
      repeat_count = public.tb_quest_player_repeatable_state.repeat_count + CASE WHEN $8 THEN 1 ELSE 0 END,
      updated_at = NOW()
    RETURNING *
    `,
    [playerId, professionId, questId, stateStatus, reviewedBy, reviewRemark, nextAvailableAt, incrementRepeat]
  );

  return result.rows[0];
}
async function findCompletedMainQuestIds(playerId, professionId, client = getPool()) {
  const result = await client.query(
    `
    SELECT quest_id
    FROM public.tb_quest_player_main_progress
    WHERE player_id = $1
      AND profession_id = $2
      AND progress_status = 'COMPLETED'
    `,
    [playerId, professionId]
  );

  return result.rows.map((row) => row.quest_id);
}
module.exports = {
  findPlayerProfession,
  upsertPlayerProfession,
  setCurrentMainQuest,
  markProfessionCompleted,
  findMainProgress,
  upsertMainProgress,
  findRepeatableState,
  upsertRepeatableState,
  findCompletedMainQuestIds
};
