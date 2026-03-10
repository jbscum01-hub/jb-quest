const { getPool } = require('../pool');

async function insertReviewLog({
  submissionId,
  actionType,
  actionBy,
  remark
}) {
  const pool = getPool();

  await pool.query(
    `
    INSERT INTO tb_quest_submission_review_log
    (
      submission_id,
      action_type,
      action_by,
      action_remark
    )
    VALUES ($1,$2,$3,$4)
    `,
    [
      submissionId,
      actionType,
      actionBy,
      remark || null
    ]
  );
}

module.exports = {
  insertReviewLog
};
