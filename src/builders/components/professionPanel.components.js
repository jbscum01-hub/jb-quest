const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildProfessionPanelComponents(professionCode) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(buildCustomId('panel', 'view_current', professionCode))
      .setLabel('ดูเควสปัจจุบัน')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(buildCustomId('panel', 'submit_main', professionCode))
      .setLabel('ส่งเควสหลัก')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(buildCustomId('panel', 'submit_repeatable', professionCode))
      .setLabel('ส่งเควสซ้ำ')
      .setStyle(ButtonStyle.Success)
  );

  return [row];
}

module.exports = {
  buildProfessionPanelComponents
};
