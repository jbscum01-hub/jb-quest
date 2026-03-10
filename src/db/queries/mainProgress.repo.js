const { getPool } = require('../pool');

async function findPlayerMainProgress(discordUserId, professionCode) {
  const query = `
    SELECT
      pmp.id,
      pmp.player_profile_id,
      pmp.profession_code,
      pmp.current_quest_id,
      pmp.quest_state,
      pmp.last_submission_id,
      pmp.completed_at,
      pmp.updated_at
    FROM public.tb_quest_player_main_progress pmp
    INNER JOIN public.tb_quest_player_profile ppp
      ON ppp.id = pmp.player_profile_id
    WHERE ppp.discord_user_id = $1
      AND pmp.profession_code = $2
    LIMIT 1
  `;

  const result = await getPool().query(query, [discordUserId, professionCode]);
  return result.rows[0] || null;
}

module.exports = {
  findPlayerMainProgress
};
