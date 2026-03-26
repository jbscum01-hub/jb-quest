const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');

function safeValue(value, fallback = '') {
  return String(value ?? fallback).slice(0, 4000);
}

function buildAdminEditRewardModal(reward) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:admin_modal:edit_reward:${reward.reward_id}`)
    .setTitle('แก้รางวัล');

  const displayText = new TextInputBuilder()
    .setCustomId('reward_display_text')
    .setLabel('ข้อความแสดงผล')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setValue(safeValue(reward.reward_display_text));

  const commandText = new TextInputBuilder()
    .setCustomId('reward_spawn_command_template')
    .setLabel('คำสั่งไอเทม')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setValue(safeValue(reward.reward_spawn_command_template));

  const roleId = new TextInputBuilder()
    .setCustomId('discord_role_id')
    .setLabel('Discord Role ID (ถ้ามี)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(reward.discord_role_id));

  const sortOrder = new TextInputBuilder()
    .setCustomId('sort_order')
    .setLabel('ลำดับแสดงผล')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(safeValue(reward.sort_order ?? '1'));

  modal.addComponents(
    new ActionRowBuilder().addComponents(displayText),
    new ActionRowBuilder().addComponents(commandText),
    new ActionRowBuilder().addComponents(roleId),
    new ActionRowBuilder().addComponents(sortOrder)
  );

  return modal;
}

module.exports = { buildAdminEditRewardModal };
