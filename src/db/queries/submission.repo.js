const { getPool } = require('../pool');

async function createSubmission({
  playerId,
  professionId,
  questId,
  submissionType,
  ingameName,
  submissionText
}) {
  const pool = getPool();

  const result = await pool.query(
    `
    INSERT INTO tb_quest_submission
    (
      player_id,
      profession_id,
      quest_id,
      submission_type,
      player_ingame_name,
      submission_text
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [
      playerId,
      professionId,
      questId,
      submissionType,
      ingameName,
      submissionText
    ]
  );

  return result.rows[0];
}

async function findSubmissionById(submissionId) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT *
    FROM tb_quest_submission
    WHERE submission_id = $1
    LIMIT 1
    `,
    [submissionId]
  );

  return result.rows[0] || null;
}

async function updateSubmissionStatus(submissionId, status) {
  const pool = getPool();

  await pool.query(
    `
    UPDATE tb_quest_submission
    SET submission_status = $1,
        reviewed_at = NOW()
    WHERE submission_id = $2
    `,
    [status, submissionId]
  );
}

module.exports = {
  createSubmission,
  findSubmissionById,
  updateSubmissionStatus
};
