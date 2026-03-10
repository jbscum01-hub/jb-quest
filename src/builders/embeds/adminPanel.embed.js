const { EmbedBuilder } = require('discord.js');

function buildAdminPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ QUEST ADMIN PANEL')
    .setDescription(
`ระบบควบคุม Quest Bot

ใช้ปุ่มด้านล่างเพื่อจัดการระบบ

• Deploy Panel ทั้งหมด
• Refresh Panel
• Sync Quest Data
• ตรวจสอบสถานะระบบ`
    )
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

module.exports = {
  buildAdminPanelEmbed
};
