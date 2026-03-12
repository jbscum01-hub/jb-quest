const { buildQuestSubmissionModal } = require('../../builders/modals/questSubmission.modal');
const { buildCurrentQuestEmbed, buildCurrentQuestImageEmbeds } = require('../../builders/embeds/currentQuest.embed');
const { getCurrentQuestSummary, getFirstRepeatableQuest } = require('../../services/panel.service');
const { openStepQuestTicket } = require('../../services/stepTicket.service');

async function handlePanelButton(interaction, parsedCustomId) {
  const { action, extra } = parsedCustomId;
  const professionCode = extra;

  if (action === 'view_current') {
    await interaction.deferReply({ flags: 64 });

    const summary = await getCurrentQuestSummary(interaction.user.id, professionCode);

    const embed = buildCurrentQuestEmbed({
      professionCode,
      profession: summary.profession,
      quest: summary.quest,
      requirements: summary.requirements,
      rewards: summary.rewards,
      completedAllMain: summary.completedAllMain
    });

    await interaction.editReply({
      embeds: [embed, ...buildCurrentQuestImageEmbeds(summary.guideMedia, summary.quest?.quest_name)]
    });
    return;
  }

  if (action === 'submit_main') {
    const summary = await getCurrentQuestSummary(interaction.user.id, professionCode);
    const quest = summary?.quest;

    if (!quest) {
      await interaction.reply({
        content: '❌ ไม่พบเควสปัจจุบันของสายนี้',
        flags: 64
      });
      return;
    }

    if (quest.is_step_quest && quest.requires_ticket) {
      await interaction.deferReply({ flags: 64 });

      const result = await openStepQuestTicket({
        client: interaction.client,
        guild: interaction.guild,
        user: interaction.user,
        member: interaction.member,
        professionCode,
        quest
      });

      await interaction.editReply({
        content: result.created
          ? `✅ เปิด Ticket สำหรับ **${quest.quest_name}** เรียบร้อยแล้ว: <#${result.channel.id}>`
          : `ℹ️ คุณมี Ticket ของเควสนี้อยู่แล้ว: <#${result.channel?.id || result.ticket.discord_channel_id}>`
      });
      return;
    }

    const modal = buildQuestSubmissionModal({
      submissionMode: 'MAIN',
      professionCode
    });

    await interaction.showModal(modal);
    return;
  }

  if (action === 'submit_repeatable') {
    await interaction.deferReply({ flags: 64 });

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
    flags: 64
  });
}

module.exports = {
  handlePanelButton
};
