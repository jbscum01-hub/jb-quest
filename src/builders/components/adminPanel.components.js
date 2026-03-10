const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildAdminPanelButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quest:admin:deploy_panels')
      .setLabel('Deploy Panels')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('quest:admin:refresh_panels')
      .setLabel('Refresh Panels')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('quest:admin:sync_quests')
      .setLabel('Sync Quest')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('quest:admin:system_status')
      .setLabel('System Status')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row];
}

module.exports = {
  buildAdminPanelButtons
};
