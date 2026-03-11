const { buildReviewRevisionModal } = require('../../builders/modals/reviewRevision.modal');
const { reviewSubmission } = require('../../services/review.service');
const {
  buildRequirementEmbedBySubmissionId,
  buildRewardEmbedBySubmissionId
} = require('../../services/reviewView.service');
const { updateSubmissionMirrors } = require('../../services/submissionMessage.service');

async function handleReviewButton(interaction, parsed) {
  const { action, extra } = parsed;
  const submissionId = extra;

  if (action === 'inspect') {
    const embed = await buildRequirementEmbedBySubmissionId(submissionId);
    await interaction.reply({
      embeds: [embed],
      flags: 64
    });
    return;
  }

  if (action === 'reward') {
    const embed = await buildRewardEmbedBySubmissionId(submissionId);
    await interaction.reply({
      embeds: [embed],
      flags: 64
    });
    return;
  }

  if (action === 'revision') {
    const modal = buildReviewRevisionModal(submissionId);
    await interaction.showModal(modal);
    return;
  }

  if (action === 'approve') {
    await interaction.deferUpdate();

    await reviewSubmission({
      submissionId,
      action: 'approve',
      reviewerDiscordId: interaction.user.id,
      reviewerDiscordTag: interaction.user.tag,
      reviewNote: null
    });

    await updateSubmissionMirrors({
      client: interaction.client,
      submissionId,
      action: 'approve',
      reviewerId: interaction.user.id,
      reviewNote: '-'
    });

    return;
  }

  await interaction.reply({
    content: '❌ ไม่พบ action นี้',
    flags: 64
  });
}

module.exports = {
  handleReviewButton
};
