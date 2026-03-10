const { getPool } = require('../pool');

async function findPlayerByDiscordId(discordUserId) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT *
    FROM tb_quest_player_profile
    WHERE discord_user_id = $1
    LIMIT 1
    `,
    [discordUserId]
  );

  return result.rows[0] || null;
}

async function createPlayerProfile({
  discordUserId,
  discordUsername,
  discordDisplayName,
  ingameName
}) {
  const pool = getPool();

  const result = await pool.query(
    `
    INSERT INTO tb_quest_player_profile
    (
      discord_user_id,
      discord_username,
      discord_display_name,
      ingame_name
    )
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
    [
      discordUserId,
      discordUsername,
      discordDisplayName,
      ingameName
    ]
  );

  return result.rows[0];
}

module.exports = {
  findPlayerByDiscordId,
  createPlayerProfile
};
