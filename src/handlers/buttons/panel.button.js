const { getCurrentQuestSummary } = require('../../services/panel.service');
const { buildQuestSubmissionModal } = require('../../builders/modals/questSubmission.modal');

async function handlePanelButton(interaction, parsedCustomId) {
  const { action, extra } = parsedCustomId;
  const professionCode = extra;

  if (action === 'view_current') {
    const summary = await getCurrentQuestSummary(professionCode);
    await interaction.reply({ content: summary.text, ephemeral: true });
    return;
  }

  if (action === 'submit_main') {
    const modal = buildQuestSubmissionModal({
      submissionMode: 'MAIN',
      professionCode
    });

    await interaction.showModal(modal);
    return;
  }

  if (action === 'submit_repeatable') {
    const modal = buildQuestSubmissionModal({
      submissionMode: 'REPEATABLE',
      professionCode
    });

    await interaction.showModal(modal);
    return;
  }

  await interaction.reply({
    content: 'ไม่พบ action ของ panel นี้',
    ephemeral: true
  });
}

module.exports = {
  handlePanelButton
};
