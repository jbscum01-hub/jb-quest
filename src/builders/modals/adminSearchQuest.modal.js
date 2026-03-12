const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function buildAdminSearchQuestModal() {
  const keywordInput = new TextInputBuilder()
    .setCustomId('keyword')
    .setLabel('Quest Code หรือชื่อเควส')
    .setPlaceholder('เช่น MEDIC_LV6 หรือ แพทย์')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  return new ModalBuilder()
    .setCustomId('quest:admin:modal_search_quest')
    .setTitle('ค้นหาเควส')
    .addComponents(
      new ActionRowBuilder().addComponents(keywordInput)
    );
}

module.exports = {
  buildAdminSearchQuestModal
};
