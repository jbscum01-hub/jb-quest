const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

function getFieldValue(embed, fieldName) {
  const field = embed.fields?.find((f) => f.name === fieldName);
  return field ? field.value : '-';
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

function buildResultEmbed(originalEmbed, action, reviewerTag) {
  const submissionId = getFieldValue(originalEmbed, 'Submission ID');
  const playerName = getFieldValue(originalEmbed, 'ผู้เล่น');
  const profession = getFieldValue(originalEmbed, 'สายอาชีพ');
  const questName = getFieldValue(originalEmbed, 'เควส');

  let title = '🛠️ ผลการตรวจเควส';
  let color = 0x5865f2;

  if (action === 'approve') {
    title = '🛠️ ผลการตรวจเควส: อนุมัติ';
    color = 0x57f287;
  }

  if (action === 'revision') {
    title = '🛠️ ผลการตรวจเควส: ขอแก้ไข';
    color = 0xfee75c;
  }

  if (action === 'reject') {
    title = '🛠️ ผลการตรวจเควส: ปฏิเสธ';
    color = 0xed4245;
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .addFields(
      { name: 'Submission ID', value: submissionId || '-' },
      { name: 'ผู้เล่น', value: playerName || '-' },
      { name: 'สายอาชีพ', value: profession || '-' },
      { name: 'เควส', value: questName || '-' },
      { name: 'ผู้ตรวจ', value: reviewerTag || '-' },
      { name: 'หมายเหตุ', value: '-' }
    )
    .setTimestamp();

  if (originalEmbed.image?.url) {
    embed.setImage(originalEmbed.image.url);
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
      content: `🎁 ดูรางวัลของ Submission ${submissionId}\n(ยังไม่ได้เชื่อม reward จริง)`,
      flags: 64
    });
    return;
  }

  if (action === 'approve' || action === 'revision' || action === 'reject') {
    const resultEmbed = buildResultEmbed(originalEmbed, action, interaction.user.tag);

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
  handleReviewButton
};
