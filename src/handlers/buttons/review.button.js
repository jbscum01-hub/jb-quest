const { EmbedBuilder } = require('discord.js');
const { buildReviewRevisionModal } = require('../../builders/modals/reviewRevision.modal');
const { reviewSubmission } = require('../../services/review.service');
const {
  buildRequirementEmbedBySubmissionId,
  buildRewardEmbedBySubmissionId
} = require('../../services/reviewView.service');

function buildDisabledRows() {
  return [];
}

function replaceLine(description, label, value) {
  const pattern = new RegExp(`${label}:\\s*.*`);
  const replacement = `${label}: ${value}`;

  if (pattern.test(description)) {
    return description.replace(pattern, replacement);
  }

  return `${description}\n${replacement}`;
}

function buildUpdatedEmbedFromOriginal(originalEmbed, action, reviewerId, reviewNote = '-') {
  const embed = EmbedBuilder.from(originalEmbed);

  let title = '📩 Quest Submission';
  let color = 0x2b82ff;

  if (action === 'approve') {
    title = '🛠️ ผลการตรวจเควส: อนุมัติ';
    color = 0x57f287;
    reviewNote = '-';
  }

  if (action === 'revision') {
    title = '🛠️ ผลการตรวจเควส: ขอแก้ไข';
    color = 0xfee75c;
  }

  let description = originalEmbed.description || originalEmbed.data?.description || '';

  description = replaceLine(description, 'ผู้ตรวจ', `<@${reviewerId}>`);
  description = replaceLine(description, 'หมายเหตุ', reviewNote || '-');

  embed.setTitle(title);
  embed.setColor(color);
  embed.setDescription(description);
  embed.setTimestamp();

  return embed;
}

async function handleReviewButton(interaction, parsed) {
  const { action, extra } = parsed;
  const submissionId = extra;

  const originalEmbed = interaction.message.embeds?.[0];

  if (!originalEmbed) {
    await interaction.reply({
      content: '❌ ไม่พบข้อมูล submission ในข้อความนี้',
      flags: 64
    });
    return;
  }

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
    const reviewResult = await reviewSubmission({
      submissionId,
      action,
      reviewerDiscordId: interaction.user.id,
      reviewerDiscordTag: interaction.user.tag,
      reviewNote: null
    });

    const updatedEmbed = buildUpdatedEmbedFromOriginal(
      originalEmbed,
      action,
      interaction.user.id,
      reviewResult.submission?.review_remark || '-'
    );

    await interaction.update({
      embeds: [updatedEmbed],
      components: buildDisabledRows()
    });

    return;
  }

  await interaction.reply({
    content: '❌ ไม่พบ action นี้',
    flags: 64
  });
}

module.exports = {
  handleReviewButton,
  buildUpdatedEmbedFromOriginal,
  buildDisabledRows
};
