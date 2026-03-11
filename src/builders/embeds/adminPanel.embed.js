const { EmbedBuilder } = require('discord.js');

function buildAdminPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ QUEST ADMIN PANEL')
    .setDescription([
      'ระบบควบคุม Quest Bot',
      '',
      '• Deploy Panels',
      '• Refresh Panels',
      '• Sync Quest',
      '• System Status'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

module.exports = {
  buildAdminPanelEmbed
};
