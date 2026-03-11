const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const { buildReviewRevisionModal } = require('../../builders/modals/reviewRevision.modal');
const { reviewSubmission } = require('../../services/review.service');

function getFieldValue(embed, fieldName) {
  const field = embed.fields?.find((f) => f.name === fieldName);
  return field ? field.value : '-';
}

function extractDescriptionValue(description, label) {
  const regex = new RegExp(`${label}:\\s*(.*)`);
  const match = description.match(regex);
  return match ? match[1].trim() : '-';
}

function getValueFromEmbed(originalEmbed, fieldName, descriptionLabel) {
  if (originalEmbed.fields?.length) {
    return getFieldValue(originalEmbed, fieldName);
  }

  const description = originalEmbed?.data?.description || originalEmbed?.description || '';
  return extractDescriptionValue(description, descriptionLabel);
}

function buildDisabledRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('review_done_inspect')
      .setLabel('🔎 ตรวจสอบ')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId('review_done_approve')
      .setLabel('✅ อนุมัติ')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId('review_done_revision')
      .setLabel('📝 ขอแก้ไข')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('review_done_reject')
      .setLabel('❌ ปฏิเสธ')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId('review_done_reward')
      .setLabel('🎁 ดูรางวัล')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  return [row1, row2];
}

function buildResultEmbed(originalEmbed, action, reviewerId, reviewNote = '-') {
  const submissionId = getValueFromEmbed(originalEmbed, 'Submission ID', 'Submission ID');
  const player = getValueFromEmbed(originalEmbed, 'ผู้เล่น', 'ผู้เล่น');
  const ingameName = getValueFromEmbed(originalEmbed, 'ชื่อในเกม', 'ชื่อในเกม');
  const profession = getValueFromEmbed(originalEmbed, 'สายอาชีพ', 'สายอาชีพ');
  const quest = getValueFromEmbed(originalEmbed, 'เควส', 'เควส');

  let title = '🛠️ ผลการตรวจเควส';
  let color = 0x5865f2;
  let note = reviewNote || '-';

  if (action === 'approve') {
    title = '🛠️ ผลการตรวจเควส: อนุมัติ';
    color = 0x57f287;
    note = '-';
  }

  if (action === 'revision') {
    title = '🛠️ ผลการตรวจเควส: ขอแก้ไข';
    color = 0xfee75c;
  }

  if (action === 'reject') {
    title = '🛠️ ผลการตรวจเควส: ปฏิเสธ';
    color = 0xed4245;
    note = reviewNote || '-';
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .addFields(
      { name: 'Submission ID', value: submissionId || '-' },
      { name: 'ผู้เล่น', value: player || '-' },
      { name: 'ชื่อในเกม', value: ingameName || '-' },
      { name: 'สายอาชีพ', value: profession || '-' },
      { name: 'เควส', value: quest || '-' },
      { name: 'ผู้ตรวจ', value: `<@${reviewerId}>` },
      { name: 'หมายเหตุ', value: note || '-' }
    )
    .setTimestamp();

  if (originalEmbed.image?.url) {
    embed.setImage(originalEmbed.image.url);
  } else if (originalEmbed.data?.image?.url) {
    embed.setImage(originalEmbed.data.image.url);
  }

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
    const inspectEmbed = EmbedBuilder.from(originalEmbed).setTitle('🔎 ตรวจสอบ Submission');

    await interaction.reply({
      embeds: [inspectEmbed],
      flags: 64
    });
    return;
  }

  if (action === 'reward') {
    await interaction.reply({
      content: `🎁 ดูรางวัลของ Submission ${submissionId}`,
      flags: 64
    });
    return;
  }

  if (action === 'revision') {
    const modal = buildReviewRevisionModal(submissionId);
    await interaction.showModal(modal);
    return;
  }

  if (action === 'approve' || action === 'reject') {
    const reviewResult = await reviewSubmission({
      submissionId,
      action,
      reviewerDiscordId: interaction.user.id,
      reviewerDiscordTag: interaction.user.tag,
      reviewNote: null
    });

    const resultEmbed = buildResultEmbed(
      originalEmbed,
      action,
      interaction.user.id,
      reviewResult.submission?.review_remark || '-'
    );

    await interaction.update({
      embeds: [resultEmbed],
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
  buildResultEmbed,
  buildDisabledRows
};
