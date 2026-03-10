const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

function buildReviewCardComponents(submissionId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`quest:review:approve:${submissionId}`)
      .setLabel('อนุมัติ')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`quest:review:revision:${submissionId}`)
      .setLabel('ขอแก้ไข')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`quest:review:reject:${submissionId}`)
      .setLabel('ปฏิเสธ')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`quest:review:reward:${submissionId}`)
      .setLabel('แจกของรางวัล')
      .setStyle(ButtonStyle.Primary)
  );

  return [row];
}

module.exports = {
  buildReviewCardComponents
};
