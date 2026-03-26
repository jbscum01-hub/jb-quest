const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRequirementBulkModal(bundle) {
  const quest = bundle.quest;
  const lines = (bundle.requirements || [])
    .map((item) => item.display_text || '')
    .filter(Boolean)
    .join('\n');

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:reqbulk:${quest.quest_id}`)
    .setTitle('แก้ของที่ต้องส่ง (ยกชุด)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bulk_requirement_lines')
          .setLabel('ใส่ 1 บรรทัดต่อ 1 รายการ')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setPlaceholder('Rags x60\nVitamin Pills x10')
          .setValue(lines.slice(0, 4000))
      )
    );
}

module.exports = { buildQuestRequirementBulkModal };
