const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildLegendaryClaimPanelComponents(questId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('panel', 'legendary_detail', questId))
        .setLabel('📜 ดูรายละเอียด')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('panel', 'legendary_claim', questId))
        .setLabel('🎁 เคลม')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

module.exports = {
  buildLegendaryClaimPanelComponents
};
