const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function safeValue(value, fallback = '') {
  return String(value ?? fallback).slice(0, 4000);
}

function buildAdminEditRequirementModal(requirement) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:admin_modal:edit_requirement:${requirement.requirement_id}`)
    .setTitle(`แก้ของที่ต้องส่ง`.slice(0, 45));

  const itemName = new TextInputBuilder()
    .setCustomId('item_name')
    .setLabel('ชื่อของ')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(requirement.item_name));

  const qty = new TextInputBuilder()
    .setCustomId('required_quantity')
    .setLabel('จำนวนที่ต้องส่ง')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(requirement.required_quantity ?? '0'));

  const displayText = new TextInputBuilder()
    .setCustomId('display_text')
    .setLabel('ข้อความสำหรับผู้เล่น')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setValue(safeValue(requirement.display_text));

  const adminDisplayText = new TextInputBuilder()
    .setCustomId('admin_display_text')
    .setLabel('ข้อความสำหรับแอดมิน')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setValue(safeValue(requirement.admin_display_text));

  const sortOrder = new TextInputBuilder()
    .setCustomId('sort_order')
    .setLabel('ลำดับแสดงผล')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(requirement.sort_order ?? '1'));

  modal.addComponents(
    new ActionRowBuilder().addComponents(itemName),
    new ActionRowBuilder().addComponents(qty),
    new ActionRowBuilder().addComponents(displayText),
    new ActionRowBuilder().addComponents(adminDisplayText),
    new ActionRowBuilder().addComponents(sortOrder)
  );

  return modal;
}

module.exports = {
  buildAdminEditRequirementModal
};
