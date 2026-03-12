const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRequirementModal({ questId, requirement = null, mode = 'edit' }) {
  const customId = mode === 'add'
    ? `quest:admin_modal:reqa:${questId}`
    : `quest:admin_modal:reqe:${requirement.requirement_id}`;

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
      )
    );
}

module.exports = { buildQuestRequirementModal };
