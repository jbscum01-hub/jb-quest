const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRequirementModal(questId, requirement = null) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:requirement:${questId}`)
    .setTitle('แก้ของที่ต้องส่ง')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('display_text')
          .setLabel('ข้อความของที่ต้องส่งทั้งก้อน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setValue(requirement?.display_text || '')
      )
    );
}

module.exports = { buildQuestRequirementModal };
