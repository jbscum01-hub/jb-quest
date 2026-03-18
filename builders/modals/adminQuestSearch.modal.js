const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildQuestSearchModal() {
  const keywordInput = new TextInputBuilder()
    .setCustomId('keyword')
    .setLabel('ชื่อเควส หรือ โค้ดเควส')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('เช่น MEDIC_LV6 หรือ แพทย์ระดับตำนาน')
    .setRequired(true)
    .setMaxLength(100);

  return new ModalBuilder()
    .setCustomId(buildCustomId('admin_modal', 'quest_search'))
    .setTitle('ค้นหาเควส')
    .addComponents(new ActionRowBuilder().addComponents(keywordInput));
}

module.exports = {
  buildQuestSearchModal
};
