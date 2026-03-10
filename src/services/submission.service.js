const { getPool } = require('../db/pool');

async function createQuestSubmission({
  playerId,
  professionId,
  questId,
  submissionType,
  ingameName,
  submissionText
}) {

  const pool = getPool();

  const result = await pool.query(`
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
  `,[
    playerId,
    professionId,
    questId,
    submissionType,
    ingameName,
    submissionText
  ]);

  return result.rows[0];
}

module.exports = {
  createQuestSubmission
};
