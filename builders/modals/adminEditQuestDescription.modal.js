const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function safeValue(value, fallback = '-') {
  return String(value ?? fallback).slice(0, 4000);
}

function buildAdminEditQuestDescriptionModal(quest) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:admin_modal:edit_description:${quest.quest_id}`)
    .setTitle(`แก้คำอธิบาย ${quest.quest_code || ''}`.slice(0, 45));

  const questName = new TextInputBuilder()
    .setCustomId('quest_name')
    .setLabel('ชื่อเควส')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(safeValue(quest.quest_name, ''));

  const description = new TextInputBuilder()
    .setCustomId('quest_description')
    .setLabel('คำอธิบายเควส')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setValue(safeValue(quest.quest_description || quest.panel_description || '', ''));

  const panelTitle = new TextInputBuilder()
    .setCustomId('panel_title')
    .setLabel('หัวข้อพาเนล')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(quest.panel_title || '', ''));

  const buttonLabel = new TextInputBuilder()
    .setCustomId('button_label')
    .setLabel('ข้อความปุ่ม')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(quest.button_label || '', ''));

  const adminNote = new TextInputBuilder()
    .setCustomId('admin_note')
    .setLabel('โน้ตแอดมิน')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setValue(safeValue(quest.admin_note || '', ''));

  modal.addComponents(
    new ActionRowBuilder().addComponents(questName),
    new ActionRowBuilder().addComponents(description),
    new ActionRowBuilder().addComponents(panelTitle),
    new ActionRowBuilder().addComponents(buttonLabel),
    new ActionRowBuilder().addComponents(adminNote)
  );

  return modal;
}

module.exports = {
  buildAdminEditQuestDescriptionModal
};
