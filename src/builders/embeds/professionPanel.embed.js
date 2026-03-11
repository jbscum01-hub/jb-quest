const { EmbedBuilder } = require('discord.js');

function buildProfessionPanelEmbed(professionCode) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📜 กระดานภารกิจสาย ${professionCode}`)
    .setDescription([
      'ยินดีต้อนรับสู่กระดานภารกิจประจำสายอาชีพ',
      '',
      'ใช้ปุ่มด้านล่างเพื่อดูเควสหรือส่งเควส',
      '• ดูเควสปัจจุบัน',
      '• ส่งเควสหลัก',
      '• ส่งเควสซ้ำ'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

module.exports = {
  buildProfessionPanelEmbed
};
