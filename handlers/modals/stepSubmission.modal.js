const { insertStepSubmission } = require('../../services/stepSubmission.service');

async function handleStepSubmissionModal(interaction, parsed) {
  const [ticketId, stepNo] = parsed.extra.split(':');

  const characterName = interaction.fields.getTextInputValue('character_name');
  const screenshot = interaction.fields.getTextInputValue('screenshot');

  await interaction.deferReply({ flags: 64 });

  await insertStepSubmission({
    client: interaction.client,
    userId: interaction.user.id,
    ticketId,
    stepNo: Number(stepNo),
    characterName,
    text: '',
    screenshot
  });

  await interaction.editReply({
    content: '📨 ส่ง Step เรียบร้อย รอแอดมินตรวจ'
  });
}

module.exports = {
  handleStepSubmissionModal
};
