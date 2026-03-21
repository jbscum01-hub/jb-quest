const { getPool } = require('../pool');

async function insertReviewLog({ submissionId, actionType, actionBy, actionRemark = null }, client = getPool()) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_submission_review_log
    (submission_id, action_type, action_by, action_remark)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [submissionId, actionType, actionBy, actionRemark]
  );

  return result.rows[0];
}

async function insertCompletionLog(
  { playerId, professionId, questId, submissionId, completedBy, completionType, repeatRoundNo = null, remark = null },
  client = getPool()
) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_completion_log
    (player_id, profession_id, quest_id, submission_id, completed_by, completion_type, repeat_round_no, remark)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [playerId, professionId, questId, submissionId, completedBy, completionType, repeatRoundNo, remark]
  );

  return result.rows[0];
}

module.exports = {
  insertReviewLog,
  insertCompletionLog
};
