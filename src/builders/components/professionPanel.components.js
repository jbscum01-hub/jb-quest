const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildProfessionPanelComponents(professionCode) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('panel', 'view_current', professionCode))
        .setLabel('ดูเควสปัจจุบัน')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('panel', 'submit_main', professionCode))
        .setLabel('ส่งเควส')
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

module.exports = {
  buildProfessionPanelComponents
};
