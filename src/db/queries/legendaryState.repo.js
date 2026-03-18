const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findLegendaryStateByPlayerAndQuest({ playerId, questId }, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_player_legendary_state
    WHERE player_id = $1
      AND quest_id = $2
    LIMIT 1
    `,
    [playerId, questId]
  );

  return result.rows[0] || null;
}

async function lockLegendaryStateByPlayerAndQuest({ playerId, questId }, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_player_legendary_state
    WHERE player_id = $1
      AND quest_id = $2
    FOR UPDATE
    `,
    [playerId, questId]
  );

  return result.rows[0] || null;
}

async function insertLegendaryState({
  playerId,
  questId,
  professionId = null,
  claimStatus = 'LOCKED',
  isUnlocked = false,
  firstSubmissionId = null,
  unlockedAt = null,
  lastClaimedAt = null,
  nextClaimAvailableAt = null,
  claimCount = 0,
  lastReviewedBy = null,
  lastReviewRemark = null
}, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_player_legendary_state
    (
      player_id,
      profession_id,
      quest_id,
      is_unlocked,
      unlocked_at,
      last_claimed_at,
      next_claim_available_at,
      claim_count,
      claim_status,
      last_reviewed_by,
      last_review_remark,
      first_submission_id
    )
    VALUES
    (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12
    )
    RETURNING *
    `,
    [
      playerId,
      professionId,
      questId,
      isUnlocked,
      unlockedAt,
      lastClaimedAt,
      nextClaimAvailableAt,
      claimCount,
      claimStatus,
      lastReviewedBy,
      lastReviewRemark,
      firstSubmissionId
    ]
  );

  return result.rows[0];
}

async function updateLegendaryState({
  legendaryStateId,
  professionId,
  claimStatus,
  isUnlocked,
  firstSubmissionId,
  unlockedAt,
  lastClaimedAt,
  nextClaimAvailableAt,
  claimCount,
  lastReviewedBy,
  lastReviewRemark
}, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_player_legendary_state
    SET profession_id = COALESCE($2, profession_id),
        claim_status = COALESCE($3, claim_status),
        is_unlocked = COALESCE($4, is_unlocked),
        first_submission_id = COALESCE($5, first_submission_id),
        unlocked_at = COALESCE($6, unlocked_at),
        last_claimed_at = COALESCE($7, last_claimed_at),
        next_claim_available_at = COALESCE($8, next_claim_available_at),
        claim_count = COALESCE($9, claim_count),
        last_reviewed_by = COALESCE($10, last_reviewed_by),
        last_review_remark = COALESCE($11, last_review_remark),
        updated_at = NOW()
    WHERE legendary_state_id = $1
    RETURNING *
    `,
    [
      legendaryStateId,
      professionId,
      claimStatus,
      isUnlocked,
      firstSubmissionId,
      unlockedAt,
      lastClaimedAt,
      nextClaimAvailableAt,
      claimCount,
      lastReviewedBy,
      lastReviewRemark
    ]
  );

  return result.rows[0] || null;
}

module.exports = {
  findLegendaryStateByPlayerAndQuest,
  lockLegendaryStateByPlayerAndQuest,
  insertLegendaryState,
  updateLegendaryState
};
