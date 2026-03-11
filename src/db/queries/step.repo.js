const { getPool } = require('../pool');

async function findQuestSteps(questId) {
  const result = await getPool().query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
    ORDER BY step_order ASC
    `,
    [questId]
  );

  return result.rows;
}

async function createStepProgress({
  playerId,
  professionId,
  questId,
  stepId
}) {
  const result = await getPool().query(
    `
    INSERT INTO public.tb_quest_player_step_progress
    (
      player_id,
      profession_id,
      quest_id,
      step_id,
      step_status
    )
    VALUES ($1,$2,$3,$4,'ACTIVE')
    RETURNING *
    `,
    [
      playerId,
      professionId,
      questId,
      stepId
    ]
  );

  return result.rows[0];
}

async function updateStepStatus(
  stepProgressId,
  status
) {
  const result = await getPool().query(
    `
    UPDATE public.tb_quest_player_step_progress
    SET step_status = $2,
        updated_at = NOW()
    WHERE step_progress_id = $1
    RETURNING *
    `,
    [
      stepProgressId,
      status
    ]
  );

  return result.rows[0];
}

module.exports = {
  findQuestSteps,
  createStepProgress,
  updateStepStatus
};
