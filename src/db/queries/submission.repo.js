const { getPool } = require('../pool');

async function createSubmission({
  playerProfileId,
  questId,
  submissionType,
  submissionState,
  professionCode,
  title,
  description,
  proofText,
  submittedByDiscordId,
  submittedByDiscordTag
}) {
  const query = `
    INSERT INTO public.tb_quest_submission
    (
      player_profile_id,
      quest_id,
      submission_type,
      submission_state,
      profession_code,
      title,
      description,
      proof_text,
      submitted_by_discord_id,
      submitted_by_discord_tag,
      created_at,
      updated_at
    )
    VALUES
    (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
    )
    RETURNING
      id,
      player_profile_id,
      quest_id,
      submission_type,
      submission_state,
      profession_code,
      title,
      description,
      proof_text,
      submitted_by_discord_id,
      submitted_by_discord_tag,
      created_at
  `;

  const result = await getPool().query(query, [
    playerProfileId,
    questId,
    submissionType,
    submissionState,
    professionCode,
    title,
    description,
    proofText,
    submittedByDiscordId,
    submittedByDiscordTag
  ]);

  return result.rows[0];
}

module.exports = {
  createSubmission
};
