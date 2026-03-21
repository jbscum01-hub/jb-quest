
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

function buildAdminPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('admin_edit_fame').setLabel('⭐ แก้ Fame').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin_view_quest').setLabel('👁️ ดูเควส').setStyle(ButtonStyle.Success),
    )
  ];
}

module.exports = { buildAdminPanelButtons };
