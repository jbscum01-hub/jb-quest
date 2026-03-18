const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildLegendaryClaimPanelComponents(quest) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('panel', 'legendary_claim_detail', quest.quest_id))
        .setLabel('ดูรายละเอียด')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('panel', 'legendary_claim', quest.quest_id))
        .setLabel('เคลม')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

module.exports = {
  buildLegendaryClaimPanelComponents
};
