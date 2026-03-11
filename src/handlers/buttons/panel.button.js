const { buildQuestSubmissionModal } = require('../../builders/modals/questSubmission.modal');
const { buildCurrentQuestEmbed } = require('../../builders/embeds/currentQuest.embed');
const { getCurrentQuestSummary, getFirstRepeatableQuest } = require('../../services/panel.service');

async function handlePanelButton(interaction, parsedCustomId) {
  const { action, extra } = parsedCustomId;
  const professionCode = extra;

  if (action === 'view_current') {
    await interaction.deferReply({ ephemeral: true });

    const summary = await getCurrentQuestSummary(interaction.user.id, professionCode);

    const embed = buildCurrentQuestEmbed({
      professionCode,
      quest: summary.quest,
      requirements: summary.requirements,
      rewards: summary.rewards
    });

    await interaction.editReply({
      embeds: [embed]
    });
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
    await interaction.deferReply({ ephemeral: true });

    const repeatable = await getFirstRepeatableQuest(professionCode);

    if (!repeatable.quest) {
      await interaction.editReply({
        content: `ยังไม่มีเควสซ้ำของสาย ${professionCode}`
      });
      return;
    }

    await interaction.deleteReply().catch(() => {});

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
