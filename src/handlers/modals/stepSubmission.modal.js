const { insertStepSubmission } = require('../../services/stepSubmission.service');

async function handleStepSubmissionModal(interaction, parsed) {
  const [ticketId, stepNo] = parsed.extra.split(':');

  const text = interaction.fields.getTextInputValue('step_text');

  const attachment = interaction.message.attachments.first();

  await interaction.deferReply({ flags: 64 });

  await insertStepSubmission({
    client: interaction.client,
    userId: interaction.user.id,
    ticketId,
    stepNo,
    text,
    attachment
  });

  await interaction.editReply({
    content: '📨 ส่ง Step เรียบร้อย รอแอดมินตรวจ'
  });
}

module.exports = {
  handleStepSubmissionModal
};
