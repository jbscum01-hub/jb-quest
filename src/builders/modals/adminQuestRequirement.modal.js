const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRequirementModal({ questId, requirement = null, mode = 'edit' }) {
  const customId = mode === 'add'
    ? `quest:admin_modal:add_requirement:${questId}`
    : `quest:admin_modal:edit_requirement:${questId}:${requirement.requirement_id}`;

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(mode === 'add' ? 'เพิ่มของที่ต้องส่ง' : 'แก้ของที่ต้องส่ง')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('item_name')
          .setLabel('ชื่อรายการ')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(255)
          .setValue(requirement?.item_name || requirement?.input_label || '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('required_quantity')
          .setLabel('จำนวนที่ต้องส่ง')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(10)
          .setValue(String(requirement?.required_quantity || 1))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('display_text')
          .setLabel('ข้อความแสดงผลให้ผู้เล่นเห็น')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setValue(requirement?.display_text || '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('admin_display_text')
          .setLabel('ข้อความภายในสำหรับแอดมิน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setValue(requirement?.admin_display_text || '')
      )
    );
}

module.exports = {
  buildQuestRequirementModal
};
