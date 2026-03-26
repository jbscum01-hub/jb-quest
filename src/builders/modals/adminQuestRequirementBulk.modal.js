const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRequirementBulkModal(bundle) {
  const quest = bundle.quest;
  const requirementBlock = (bundle.requirements || []).find((item) => item.step_id == null && item.is_active !== false) || null;
  const lines = requirementBlock?.display_text || '';

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:reqbulk:${quest.quest_id}`)
    .setTitle('แก้ของที่ต้องส่ง (ยกชุด)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bulk_requirement_lines')
          .setLabel('วางข้อความของที่ต้องส่งทั้งก้อน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setPlaceholder('Rags x60\nVitamin Pills x10')
          .setValue(lines.slice(0, 4000))
      )
    );
}

module.exports = { buildQuestRequirementBulkModal };
