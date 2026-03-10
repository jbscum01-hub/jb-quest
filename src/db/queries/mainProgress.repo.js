const { getPool } = require('../pool');

async function findMainProgress(playerId, professionId) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT *
    FROM tb_quest_player_main_progress
    WHERE player_id = $1
      AND profession_id = $2
    `,
    [playerId, professionId]
  );

  return result.rows;
}

async function createMainProgress(playerId, professionId, questId) {
  const pool = getPool();

  const result = await pool.query(
    `
    INSERT INTO tb_quest_player_main_progress
    (
      player_id,
      profession_id,
      quest_id,
      progress_status
    )
    VALUES ($1,$2,$3,'AVAILABLE')
    RETURNING *
    `,
    [playerId, professionId, questId]
  );

  return result.rows[0];
}

async function updateProgressStatus(progressId, status) {
  const pool = getPool();

  await pool.query(
    `
    UPDATE tb_quest_player_main_progress
    SET progress_status = $1,
        updated_at = NOW()
    WHERE main_progress_id = $2
    `,
    [status, progressId]
  );
}

module.exports = {
  findMainProgress,
  createMainProgress,
  updateProgressStatus
};
