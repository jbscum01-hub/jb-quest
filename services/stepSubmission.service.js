const { EmbedBuilder } = require('discord.js');
const { getPool } = require('../db/pool');
const { findTicketById } = require('../db/queries/ticket.repo');
const { findCurrentTicketStepProgress } = require('../db/queries/step.repo');

async function insertStepSubmission({
  client,
  userId,
  ticketId,
  stepNo,
  characterName,
  text,
  screenshot
}) {
  const db = getPool();

  const ticket = await findTicketById(ticketId, db);
  if (!ticket) {
    throw new Error('ไม่พบ Ticket');
  }

  if (ticket.discord_user_id !== userId) {
    throw new Error('เฉพาะเจ้าของ Ticket เท่านั้นที่ส่ง Step ได้');
  }

  const currentStep = await findCurrentTicketStepProgress(ticketId, db);
  if (!currentStep) {
    throw new Error('ไม่พบ Step ปัจจุบัน');
  }

  if (Number(currentStep.step_no) !== Number(stepNo)) {
    throw new Error('Step ที่ส่งไม่ตรงกับ Step ปัจจุบัน');
  }

  if (currentStep.step_status !== 'ACTIVE') {
    throw new Error('Step นี้ถูกส่งแล้วหรือกำลังรอแอดมินตรวจ');
  }

  const submissionResult = await db.query(
    `
    INSERT INTO public.tb_quest_submission
    (
      player_id,
      profession_id,
      quest_id,
      submission_type,
      player_ingame_name,
      submission_text,
      submission_status,
      ticket_id,
      step_id
    )
    VALUES ($1, $2, $3, 'STEP', $4, $5, 'PENDING_REVIEW', $6, $7)
    RETURNING *
    `,
    [
      ticket.player_id,
      ticket.profession_id,
      ticket.quest_id,
      characterName,
      text || null,
      ticketId,
      currentStep.step_id
    ]
  );

  const submission = submissionResult.rows[0];

  if (screenshot) {
    await db.query(
      `
      INSERT INTO public.tb_quest_submission_attachment
      (
        submission_id,
        file_url,
        file_name,
        file_type
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        submission.submission_id,
        screenshot,
        'step-proof',
        'image/url'
      ]
    );
  }

  await db.query(
    `
    UPDATE public.tb_quest_ticket_step_progress
    SET step_status = 'SUBMITTED',
        submitted_at = NOW(),
        attempt_count = attempt_count + 1,
        updated_at = NOW()
    WHERE ticket_step_progress_id = $1
    `,
    [currentStep.ticket_step_progress_id]
  );

  await db.query(
    `
    UPDATE public.tb_quest_ticket
    SET ticket_status = 'WAITING_ADMIN',
        updated_at = NOW()
    WHERE ticket_id = $1
    `,
    [ticketId]
  );

  const channel = await client.channels.fetch(ticket.discord_channel_id).catch(() => null);

  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(0x2b82ff)
      .setTitle(`📨 Step ${currentStep.step_no} Submission`)
      .setDescription(
        [
          `ผู้เล่น: <@${ticket.discord_user_id}>`,
          `ชื่อในเกม: ${characterName}`,
          `เควส: ${ticket.quest_name || '-'}`,
          `Step: ${currentStep.step_no} - ${currentStep.step_title || '-'}`,
          `รายละเอียด: ${text || '-'}`,
          `ผู้ตรวจ: -`,
          `หมายเหตุ: -`
        ].join('\n')
      )
      .setTimestamp();

    if (screenshot) {
      embed.setImage(screenshot);
    }

    await channel.send({ embeds: [embed] });
  }

  return submission;
}

module.exports = {
  insertStepSubmission
};
