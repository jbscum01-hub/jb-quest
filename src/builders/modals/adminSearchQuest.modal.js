const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildAdminSearchQuestModal() {
  return new ModalBuilder()
    .setCustomId('quest:admin:search_submit')
    .setTitle('ค้นหาเควส')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('search_text')
          .setLabel('ชื่อเควส หรือ quest code')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder('เช่น MEDIC_LV1 หรือ แพทย์')
      )
    );
}

module.exports = {
  buildAdminSearchQuestModal
};
