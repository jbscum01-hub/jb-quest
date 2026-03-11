const { buildQuestSubmissionModal } = require('../../builders/modals/questSubmission.modal');
const { buildCurrentQuestEmbed } = require('../../builders/embeds/currentQuest.embed');
const { getCurrentQuestSummary, getFirstRepeatableQuest } = require('../../services/panel.service');

async function handlePanelButton(interaction, parsedCustomId) {
  const { action, extra } = parsedCustomId;
  const professionCode = extra;

  if (action === 'view_current') {
    const summary = await getCurrentQuestSummary(interaction.user.id, professionCode);
    const embed = buildCurrentQuestEmbed({
      professionCode,
      quest: summary.quest,
      requirements: summary.requirements,
      rewards: summary.rewards
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
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
    const repeatable = await getFirstRepeatableQuest(professionCode);
    if (!repeatable.quest) {
      await interaction.reply({
        content: `ยังไม่มีเควสซ้ำของสาย ${professionCode}`,
        ephemeral: true
      });
      return;
    }

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
