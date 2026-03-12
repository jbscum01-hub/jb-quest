const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildAdminPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:create_panels')
        .setLabel('สร้างพาเนลผู้เล่น')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:refresh_panels')
        .setLabel('รีเฟรชพาเนลผู้เล่น')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:repair_panels')
        .setLabel('ซ่อมพาเนลที่หาย')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:refresh_current_quest')
        .setLabel('รีเฟรชเควสปัจจุบัน')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_status')
        .setLabel('ตรวจสอบสถานะพาเนล')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('จัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

module.exports = {
  buildAdminPanelButtons
};
