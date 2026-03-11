const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function findQuestSteps(questId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY step_no ASC, created_at ASC
    `,
    [questId]
  );

  return result.rows;
}

async function findFirstQuestStep(questId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY step_no ASC, created_at ASC
    LIMIT 1
    `,
    [questId]
  );

  return result.rows[0] || null;
}

async function findNextQuestStep(questId, currentStepNo, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
      AND step_no > $2
    ORDER BY step_no ASC, created_at ASC
    LIMIT 1
    `,
    [questId, currentStepNo]
  );

  return result.rows[0] || null;
}

async function findStepById(stepId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE step_id = $1
    LIMIT 1
    `,
    [stepId]
  );

  return result.rows[0] || null;
}

async function createTicketStepProgress({
  ticketId,
  questId,
  stepId,
  stepNo
}, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    INSERT INTO public.tb_quest_ticket_step_progress
    (
      ticket_id,
      quest_id,
      step_id,
      step_no,
      step_status
    )
    VALUES ($1, $2, $3, $4, 'ACTIVE')
    RETURNING *
    `,
    [ticketId, questId, stepId, stepNo]
  );

  return result.rows[0];
}

async function findCurrentTicketStepProgress(ticketId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT tsp.*,
           s.step_title,
           s.step_description,
           s.requires_text_input,
           s.requires_attachment,
           s.requires_admin_approval,
           s.allow_resubmit,
           s.success_message,
           s.failure_message
    FROM public.tb_quest_ticket_step_progress tsp
    JOIN public.tb_quest_master_step s
      ON tsp.step_id = s.step_id
    WHERE tsp.ticket_id = $1
      AND tsp.step_status IN ('ACTIVE', 'SUBMITTED')
    ORDER BY tsp.step_no ASC, tsp.created_at ASC
    LIMIT 1
    `,
    [ticketId]
  );

  return result.rows[0] || null;
}

async function updateTicketStepProgressStatus({
  ticketStepProgressId,
  status,
  reviewedBy = null,
  reviewRemark = null,
  incrementAttempt = false,
  markSubmitted = false
}, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    UPDATE public.tb_quest_ticket_step_progress
    SET step_status = $2::varchar(30),
        submitted_at = CASE
          WHEN $6::boolean THEN NOW()
          ELSE submitted_at
        END,
        reviewed_at = CASE
          WHEN $3::varchar(100) IS NOT NULL
            OR $4::varchar(2000) IS NOT NULL
            OR $2::varchar(30) IN ('APPROVED', 'REJECTED', 'CANCELLED')
          THEN NOW()
          ELSE reviewed_at
        END,
        reviewed_by = COALESCE($3::varchar(100), reviewed_by),
        review_remark = COALESCE($4::varchar(2000), review_remark),
        attempt_count = attempt_count + CASE
          WHEN $5::boolean THEN 1
          ELSE 0
        END,
        updated_at = NOW()
    WHERE ticket_step_progress_id = $1
    RETURNING *
    `,
    [
      ticketStepProgressId,
      status,
      reviewedBy,
      reviewRemark,
      incrementAttempt,
      markSubmitted
    ]
  );

  return result.rows[0] || null;
}

async function countQuestSteps(questId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT COUNT(*)::int AS total_steps
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    `,
    [questId]
  );

  return result.rows[0]?.total_steps || 0;
}

module.exports = {
  findQuestSteps,
  findFirstQuestStep,
  findNextQuestStep,
  findStepById,
  createTicketStepProgress,
  findCurrentTicketStepProgress,
  updateTicketStepProgressStatus,
  countQuestSteps
};
