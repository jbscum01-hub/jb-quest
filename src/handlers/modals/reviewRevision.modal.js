const { reviewSubmission } = require('../../services/review.service');
const { buildResultEmbed, buildDisabledRows } = require('../buttons/review.button');

async function handleReviewRevisionModal(interaction, parsed) {
  await interaction.deferReply({ flags: 64 });

  try {
    const submissionId = parsed.extra;
    const reviewNote =
      interaction.fields.getTextInputValue('review_note');

    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 50 });

    const targetMessage = messages.find((msg) =>
      msg.author?.id === interaction.client.user.id &&
      msg.components?.some((row) =>
        row.components?.some((btn) =>
          btn.customId === `quest:review:revision:${submissionId}`
        )
      )
    );

    if (!targetMessage) {
      await interaction.editReply({
        content: '❌ ไม่พบข้อความ submission ที่ต้องการอัปเดต'
      });
      return;
    }

    const originalEmbed = targetMessage.embeds?.[0];

    if (!originalEmbed) {
      await interaction.editReply({
        content: '❌ ไม่พบ embed เดิมของ submission'
      });
      return;
    }

    const reviewResult = await reviewSubmission({
      submissionId,
      action: 'revision',
      reviewerDiscordId: interaction.user.id,
      reviewerDiscordTag: interaction.user.tag,
      reviewNote
    });

    const resultEmbed = buildResultEmbed(
      originalEmbed,
      'revision',
      interaction.user.id,
      reviewResult.submission?.review_remark || reviewNote
    );

    await targetMessage.edit({
      embeds: [resultEmbed],
      components: buildDisabledRows()
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
