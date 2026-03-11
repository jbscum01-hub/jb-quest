const { getPool } = require('../pool');

async function findPlayerByDiscordId(discordUserId, client = getPool()) {
  const result = await client.query(
    `
    SELECT *
    FROM public.tb_quest_player_profile
    WHERE discord_user_id = $1
    LIMIT 1
    `,
    [discordUserId]
  );

  return result.rows[0] || null;
}

async function createPlayerProfile(
  { discordUserId, discordUsername, discordDisplayName, ingameName },
  client = getPool()
) {
  const result = await client.query(
    `
    INSERT INTO public.tb_quest_player_profile
    (discord_user_id, discord_username, discord_display_name, ingame_name)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [discordUserId, discordUsername || null, discordDisplayName || null, ingameName || null]
  );

  return result.rows[0];
}

async function updatePlayerNames(
  { playerId, discordUsername, discordDisplayName, ingameName },
  client = getPool()
) {
  const result = await client.query(
    `
    UPDATE public.tb_quest_player_profile
    SET discord_username = COALESCE($2, discord_username),
        discord_display_name = COALESCE($3, discord_display_name),
        ingame_name = COALESCE($4, ingame_name),
        updated_at = NOW()
    WHERE player_id = $1
    RETURNING *
    `,
    [playerId, discordUsername || null, discordDisplayName || null, ingameName || null]
  );

  return result.rows[0] || null;
}

module.exports = {
  findPlayerByDiscordId,
  createPlayerProfile,
  updatePlayerNames
};
