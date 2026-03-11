const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildReviewCardComponents(submissionId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('review', 'inspect', submissionId))
        .setLabel('ตรวจสอบ')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('review', 'approve', submissionId))
        .setLabel('อนุมัติ')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(buildCustomId('review', 'revision', submissionId))
        .setLabel('ขอแก้ไข')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('review', 'reward', submissionId))
        .setLabel('ดูรางวัล')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildReviewCardComponents
};
