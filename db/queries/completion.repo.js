const { getPool } = require('../pool');

async function insertCompletionLog({
  playerId,
  professionId,
  questId,
  submissionId,
  completionType
}) {

  const result = await getPool().query(
    `
    INSERT INTO tb_quest_completion_log
    (
      player_id,
      profession_id,
      quest_id,
      submission_id,
      completion_type,
      completed_at
    )
    VALUES ($1,$2,$3,$4,$5,NOW())
    RETURNING *
    `,
    [
      playerId,
      professionId,
      questId,
      submissionId,
      completionType
    ]
  );

  return result.rows[0];
}

module.exports = {
  insertCompletionLog
};
