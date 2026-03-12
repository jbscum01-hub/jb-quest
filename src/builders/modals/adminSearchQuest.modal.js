const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildAdminSearchQuestModal() {
  const modal = new ModalBuilder()
    .setCustomId('admin:master:search_submit')
    .setTitle('ค้นหาเควส');

  const input = new TextInputBuilder()
    .setCustomId('query')
    .setLabel('ชื่อเควส หรือ Quest Code')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('เช่น MEDIC_LV1 หรือ แพทย์ Lv.1');

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

module.exports = { buildAdminSearchQuestModal };
