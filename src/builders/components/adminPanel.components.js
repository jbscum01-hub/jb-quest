const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildAdminPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:deploy_panels')
        .setLabel('สร้างพาเนล')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:refresh_panels')
        .setLabel('รีเฟรชพาเนล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:sync_quests')
        .setLabel('ซิงก์เควส')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:system_status')
        .setLabel('สถานะระบบ')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildAdminPanelButtons
};
