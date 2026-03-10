const { getPool } = require('../pool');

async function findMainProgressByPlayerProfileId(playerProfileId, professionCode) {
  const query = `
    SELECT
      id,
      player_profile_id,
      profession_code,
      current_quest_id,
      quest_state,
      last_submission_id,
      completed_at,
      updated_at
    FROM public.tb_quest_player_main_progress
    WHERE player_profile_id = $1
      AND profession_code = $2
    LIMIT 1
  `;

  const result = await getPool().query(query, [playerProfileId, professionCode]);
  return result.rows[0] || null;
}

async function updateMainProgressAfterApprove({
  playerProfileId,
  professionCode,
  currentQuestId,
  submissionId
}) {
  const query = `
    UPDATE public.tb_quest_player_main_progress
    SET
      current_quest_id = $3,
      quest_state = 'COMPLETED',
      last_submission_id = $4,
      completed_at = NOW(),
      updated_at = NOW()
    WHERE player_profile_id = $1
      AND profession_code = $2
    RETURNING
      id,
      player_profile_id,
      profession_code,
      current_quest_id,
      quest_state,
      last_submission_id,
      completed_at,
      updated_at
  `;

  const result = await getPool().query(query, [
    playerProfileId,
    professionCode,
    currentQuestId,
    submissionId
  ]);

  return result.rows[0] || null;
}

async function updateMainProgressToRevision({
  playerProfileId,
  professionCode,
  currentQuestId,
  submissionId
}) {
  const query = `
    UPDATE public.tb_quest_player_main_progress
    SET
      current_quest_id = $3,
      quest_state = 'REVISION_REQUIRED',
      last_submission_id = $4,
      updated_at = NOW()
    WHERE player_profile_id = $1
      AND profession_code = $2
    RETURNING
      id,
      player_profile_id,
      profession_code,
      current_quest_id,
      quest_state,
      last_submission_id,
      completed_at,
      updated_at
  `;

  const result = await getPool().query(query, [
    playerProfileId,
    professionCode,
    currentQuestId,
    submissionId
  ]);

  return result.rows[0] || null;
}

async function updateMainProgressToRejected({
  playerProfileId,
  professionCode,
  currentQuestId,
  submissionId
}) {
  const query = `
    UPDATE public.tb_quest_player_main_progress
    SET
      current_quest_id = $3,
      quest_state = 'REJECTED',
      last_submission_id = $4,
      updated_at = NOW()
    WHERE player_profile_id = $1
      AND profession_code = $2
    RETURNING
      id,
      player_profile_id,
      profession_code,
      current_quest_id,
      quest_state,
      last_submission_id,
      completed_at,
      updated_at
  `;

  const result = await getPool().query(query, [
    playerProfileId,
    professionCode,
    currentQuestId,
    submissionId
  ]);

  return result.rows[0] || null;
}

module.exports = {
  findMainProgressByPlayerProfileId,
  updateMainProgressAfterApprove,
  updateMainProgressToRevision,
  updateMainProgressToRejected
};
