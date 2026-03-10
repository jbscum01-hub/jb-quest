const { isQuestAdmin } = require('../../utils/permission');
const { reviewSubmission } = require('../../services/review.service');
const { buildReviewResultEmbed } = require('../../builders/embeds/reviewResult.embed');

async function handleReviewButton(interaction, parsedCustomId) {
  const { action, extra } = parsedCustomId;
  const submissionId = extra;
  const allowedActions = ['approve', 'revision', 'reject', 'reward'];

  if (!allowedActions.includes(action)) {
    await interaction.reply({
      content: 'ไม่พบ action review นี้',
      ephemeral: true
    });
    return;
  }

  const isAdmin = await isQuestAdmin(interaction.member);

  if (!isAdmin) {
    await interaction.reply({
      content: 'คุณไม่มีสิทธิ์ใช้งานปุ่มตรวจเควสนี้',
      ephemeral: true
    });
    return;
  }

  if (action === 'reward') {
    await interaction.reply({
      content: `ระบบแจกของรางวัลของ submission #${submissionId} ยังเป็น stub`,
      ephemeral: true
    });
    return;
  }

  const result = await reviewSubmission({
    submissionId,
    action,
    reviewerDiscordId: interaction.user.id,
    reviewerDiscordTag: interaction.user.tag,
    reviewNote: null
  });

  const resultEmbed = buildReviewResultEmbed({
    action,
    submission: result.submission,
    reviewerTag: interaction.user.tag,
    reviewNote: null
  });

  await interaction.update({
    embeds: [resultEmbed],
    components: []
  });
}

module.exports = {
  handleReviewButton
};
