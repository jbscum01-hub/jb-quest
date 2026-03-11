const { getPool } = require('../db/pool');

async function claimLegendary({
  playerId,
  professionId,
  questId
}) {

  const existing = await getPool().query(
    `
    SELECT *
    FROM tb_quest_player_legendary_claim
    WHERE player_id = $1
      AND profession_id = $2
      AND DATE_TRUNC('week', claimed_at) =
          DATE_TRUNC('week', NOW())
    `,
    [
      playerId,
      professionId
    ]
  );

  if (existing.rows.length) {
    throw new Error(
      "คุณรับ Legendary ไปแล้วสัปดาห์นี้"
    );
  }

  const result = await getPool().query(
    `
    INSERT INTO tb_quest_player_legendary_claim
    (
      player_id,
      profession_id,
      quest_id,
      claimed_at
    )
    VALUES ($1,$2,$3,NOW())
    RETURNING *
    `,
    [
      playerId,
      professionId,
      questId
    ]
  );

  return result.rows[0];
}

module.exports = {
  claimLegendary
};
