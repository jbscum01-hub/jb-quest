const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestDescriptionModal(quest) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:qdesc:${quest.quest_id}`)
    .setTitle(`แก้คำอธิบาย · ${quest.quest_code}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_name').setLabel('ชื่อเควส').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(255).setValue(quest.quest_name || '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('quest_description').setLabel('คำอธิบายเควส').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000).setValue(quest.quest_description || '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('panel_description').setLabel('คำอธิบายหน้า Panel').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(4000).setValue(quest.panel_description || '')
      )
    );
}

module.exports = { buildQuestDescriptionModal };
