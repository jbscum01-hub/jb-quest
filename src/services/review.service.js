const { getPool } = require('../db/pool');

async function approveSubmission(submissionId, reviewer) {

  const pool = getPool();

  await pool.query(`
    UPDATE tb_quest_submission
    SET submission_status = 'APPROVED',
        reviewed_by = $2,
        reviewed_at = NOW()
    WHERE submission_id = $1
  `,[submissionId, reviewer]);

}

async function rejectSubmission(submissionId, reviewer) {

  const pool = getPool();

  await pool.query(`
    UPDATE tb_quest_submission
    SET submission_status = 'REJECTED',
        reviewed_by = $2,
        reviewed_at = NOW()
    WHERE submission_id = $1
  `,[submissionId, reviewer]);

}

async function requestRevision(submissionId, reviewer) {

  const pool = getPool();

  await pool.query(`
    UPDATE tb_quest_submission
    SET submission_status = 'REVISION_REQUIRED',
        reviewed_by = $2,
        reviewed_at = NOW()
    WHERE submission_id = $1
  `,[submissionId, reviewer]);

}

module.exports = {
  approveSubmission,
  rejectSubmission,
  requestRevision
};
