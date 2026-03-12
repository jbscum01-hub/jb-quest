const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function buildAdminSearchQuestModal() {
  const modal = new ModalBuilder()
    .setCustomId('quest:admin_modal:search_quest')
    .setTitle('ค้นหาเควส');

  const queryInput = new TextInputBuilder()
    .setCustomId('query')
    .setLabel('ชื่อเควส หรือ Quest Code')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('เช่น MEDIC_LV6 หรือ แพทย์');

  modal.addComponents(new ActionRowBuilder().addComponents(queryInput));
  return modal;
}

module.exports = {
  buildAdminSearchQuestModal
};
