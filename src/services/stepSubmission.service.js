const { getPool } = require('../db/pool');

async function insertStepSubmission({
  userId,
  ticketId,
  stepNo,
  text,
  attachment
}) {
  const db = getPool();

  const ticket = await db.query(`
    SELECT * FROM tb_quest_ticket
    WHERE ticket_id=$1
  `, [ticketId]);

  const t = ticket.rows[0];

  const submission = await db.query(`
    INSERT INTO tb_quest_submission
    (
      player_id,
      profession_id,
      quest_id,
      submission_type,
      submission_text,
      submission_status,
      ticket_id,
      step_id
    )
    VALUES ($1,$2,$3,'STEP',$4,'PENDING_REVIEW',$5,NULL)
    RETURNING *
  `, [
    t.player_id,
    t.profession_id,
    t.quest_id,
    text,
    ticketId
  ]);

  if (attachment) {
    await db.query(`
      INSERT INTO tb_quest_submission_attachment
      (
        submission_id,
        file_url,
        file_name,
        file_type
      )
      VALUES ($1,$2,$3,$4)
    `, [
      submission.rows[0].submission_id,
      attachment.url,
      attachment.name,
      attachment.contentType
    ]);
  }

  return submission.rows[0];
}

module.exports = {
  insertStepSubmission
};
