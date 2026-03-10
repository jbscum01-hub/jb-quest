const { getPool } = require('../pool');

async function findPlayerProfileByDiscordUserId(discordUserId) {
  const query = `
    SELECT id, discord_user_id, discord_username, ingame_name, fame_point, is_active
    FROM public.tb_quest_player_profile
    WHERE discord_user_id = $1
    LIMIT 1
  `;

  const result = await getPool().query(query, [discordUserId]);
  return result.rows[0] || null;
}

async function createPlayerProfile({ discordUserId, discordUsername, ingameName = null }) {
  const query = `
    INSERT INTO public.tb_quest_player_profile
    (
      discord_user_id,
      discord_username,
      ingame_name,
      fame_point,
      is_active,
      created_at,
      updated_at
    )
    VALUES
    (
      $1, $2, $3, 0, TRUE, NOW(), NOW()
    )
    RETURNING id, discord_user_id, discord_username, ingame_name, fame_point, is_active
  `;

  const result = await getPool().query(query, [discordUserId, discordUsername, ingameName]);
  return result.rows[0];
}

async function findOrCreatePlayerProfile({ discordUserId, discordUsername, ingameName = null }) {
  const existing = await findPlayerProfileByDiscordUserId(discordUserId);

  if (existing) {
    return existing;
  }

  return createPlayerProfile({
    discordUserId,
    discordUsername,
    ingameName
  });
}

module.exports = {
  findPlayerProfileByDiscordUserId,
  createPlayerProfile,
  findOrCreatePlayerProfile
};
