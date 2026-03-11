const { getPool } = require('../pool');

async function createSubmission(
  { playerId, professionId, questId, submissionType, playerIngameName, submissionText, ticketId = null, stepId = null },
  client = getPool()
) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_submission
    (player_id, profession_id, quest_id, submission_type, player_ingame_name, submission_text, ticket_id, step_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [playerId, professionId, questId, submissionType, playerIngameName || null, submissionText || null, ticketId, stepId]
  );

  return result.rows[0];
}

async function findSubmissionById(submissionId, client = getPool()) {
  const result = await client.query(
    `
    SELECT s.*, p.profession_code, p.profession_name_th, q.quest_code, q.quest_name, q.quest_level,
           c.category_code, q.repeat_cooldown_days, pp.discord_user_id, pp.discord_username, pp.discord_display_name
    FROM public.tb_quest_submission s
    JOIN public.tb_quest_master q ON s.quest_id = q.quest_id
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    LEFT JOIN public.tb_quest_master_profession p ON s.profession_id = p.profession_id
    JOIN public.tb_quest_player_profile pp ON s.player_id = pp.player_id
    WHERE s.submission_id = $1
    LIMIT 1
    `,
    [submissionId]
  );

  return result.rows[0] || null;
}

async function updateSubmissionReview(
  { submissionId, status, reviewedBy, reviewResult, reviewRemark = null },
  client = getPool()
) {
  const result = await client.query(
    `
    UPDATE public.tb_quest_submission
    SET submission_status = $2,
        reviewed_at = NOW(),
        reviewed_by = $3,
        review_result = $4,
        review_remark = $5,
        updated_at = NOW()
    WHERE submission_id = $1
    RETURNING *
    `,
    [submissionId, status, reviewedBy, reviewResult, reviewRemark]
  );

  return result.rows[0] || null;
}

async function insertSubmissionAttachment({ submissionId, fileUrl, fileName = null, fileType = null, discordAttachmentId = null }, client = getPool()) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_submission_attachment
    (submission_id, file_url, file_name, file_type, discord_attachment_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [submissionId, fileUrl, fileName, fileType, discordAttachmentId]
  );

  return result.rows[0];
}

module.exports = {
  createSubmission,
  findSubmissionById,
  updateSubmissionReview,
  insertSubmissionAttachment
};
