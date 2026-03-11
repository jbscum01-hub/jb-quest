const { getPool } = require('../db/pool');

async function grantRewards({
  playerId,
  questId
}) {

  const rewards = await getPool().query(
    `
    SELECT *
    FROM tb_quest_master_reward
    WHERE quest_id = $1
    `,
    [questId]
  );

  for (const reward of rewards.rows) {

    await getPool().query(
      `
      INSERT INTO tb_quest_reward_grant_log
      (
        player_id,
        quest_id,
        reward_type,
        reward_value,
        granted_at
      )
      VALUES ($1,$2,$3,$4,NOW())
      `,
      [
        playerId,
        questId,
        reward.reward_type,
        reward.reward_value_number
      ]
    );

  }

  return rewards.rows;
}

module.exports = {
  grantRewards
};
