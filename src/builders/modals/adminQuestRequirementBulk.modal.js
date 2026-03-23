const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRequirementBulkModal(bundle) {
  const quest = bundle.quest;
  const lines = (bundle.requirements || [])
    .map((item) => {
      const name = item.item_name || item.input_label || '';
      const qty = item.required_quantity || '';
      const spawn = item.item_spawn_command_template || '';
      const display = item.display_text || '';
      return [name, qty, spawn, display].filter((v, idx) => idx < 2 || v).join('|');
    })
    .join('\n');

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:reqbulk:${quest.quest_id}`)
    .setTitle('แก้ของที่ต้องส่ง (ยกชุด)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bulk_requirement_lines')
          .setLabel('รูปแบบ: ชื่อ|จำนวน|คำสั่ง|ข้อความแสดงผล')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setPlaceholder('Rag|60|#spawnitem Rag 60|Rag x60\nVitamin Pills|10')
          .setValue(lines.slice(0, 4000))
      )
    );
}

module.exports = { buildQuestRequirementBulkModal };
