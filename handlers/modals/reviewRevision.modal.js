const { reviewSubmission } = require('../../services/review.service');
const { notifyRevision } = require('../../services/questNotification.service');
const { updateSubmissionMirrors } = require('../../services/submissionMessage.service');

async function handleReviewRevisionModal(interaction, parsed) {
  await interaction.deferReply({ flags: 64 });

  try {
    const submissionId = parsed.extra;
    const reviewNote = interaction.fields.getTextInputValue('review_note');

    const reviewResult = await reviewSubmission({
      submissionId,
      action: 'revision',
      reviewerDiscordId: interaction.user.id,
      reviewerDiscordTag: interaction.user.tag,
      reviewNote
    });

    await updateSubmissionMirrors({
      client: interaction.client,
      submissionId,
      action: 'revision',
      reviewerId: interaction.user.id,
      reviewNote
    });

    await notifyRevision({
      client: interaction.client,
      submission: reviewResult.submission,
      reviewerId: interaction.user.id,
      reviewNote
    });

    await interaction.editReply({
      content: '✅ บันทึกการขอแก้ไขเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error(error);

    await interaction.editReply({
      content: `❌ ${error.message || 'เกิดข้อผิดพลาดระหว่างบันทึกการขอแก้ไข'}`
    });
  }
}

module.exports = {
  handleReviewRevisionModal
};
