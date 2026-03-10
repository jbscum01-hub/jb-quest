const { getPool } = require('../pool');

async function findSubmissionById(submissionId) {
  const query = `
    SELECT
      qs.id,
      qs.player_profile_id,
      qs.quest_id,
      qs.submission_type,
      qs.submission_state,
      qs.profession_code,
      qs.title,
      qs.description,
      qs.proof_text,
      qs.submitted_by_discord_id,
      qs.submitted_by_discord_tag,
      qs.created_at,
      qs.updated_at,
      qp.discord_user_id,
      qp.discord_username,
      qp.ingame_name,
      qm.quest_code,
      qm.quest_name,
      qm.quest_name_th,
      qm.quest_category,
      qm.profession_code AS quest_profession_code,
      qm.level_no,
      qm.is_step_quest,
      qm.requires_ticket,
      qm.requires_admin_approval
    FROM public.tb_quest_submission qs
    INNER JOIN public.tb_quest_player_profile qp
      ON qp.id = qs.player_profile_id
    INNER JOIN public.tb_quest_master qm
      ON qm.id = qs.quest_id
    WHERE qs.id = $1
    LIMIT 1
  `;

  const result = await getPool().query(query, [submissionId]);
  return result.rows[0] || null;
}

async function updateSubmissionState({
  submissionId,
  submissionState
}) {
  const query = `
    UPDATE public.tb_quest_submission
    SET
      submission_state = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      player_profile_id,
      quest_id,
      submission_type,
      submission_state,
      profession_code,
      title,
      description,
      proof_text,
      submitted_by_discord_id,
      submitted_by_discord_tag,
      created_at,
      updated_at
  `;

  const result = await getPool().query(query, [
    submissionId,
    submissionState
  ]);

  return result.rows[0] || null;
}

async function insertSubmissionReviewLog({
  submissionId,
  actionType,
  reviewerDiscordId,
  reviewerDiscordTag,
  reviewNote
}) {
  const query = `
    INSERT INTO public.tb_quest_submission_review_log
    (
      submission_id,
      action_type,
      reviewer_discord_id,
      reviewer_discord_tag,
      review_note,
      created_at
    )
    VALUES
    (
      $1, $2, $3, $4, $5, NOW()
    )
    RETURNING
      id,
      submission_id,
      action_type,
      reviewer_discord_id,
      reviewer_discord_tag,
      review_note,
      created_at
  `;

  const result = await getPool().query(query, [
    submissionId,
    actionType,
    reviewerDiscordId,
    reviewerDiscordTag,
    reviewNote
  ]);

  return result.rows[0];
}

module.exports = {
  findSubmissionById,
  updateSubmissionState,
  insertSubmissionReviewLog
};
