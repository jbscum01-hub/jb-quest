const { EmbedBuilder } = require('discord.js');

function buildProfessionPanelEmbed(professionCode) {
  return new EmbedBuilder()
    .setTitle(`📜 กระดานภารกิจสาย ${professionCode}`)
    .setDescription(
      [
        'ยินดีต้อนรับสู่กระดานภารกิจประจำสายอาชีพ',
        '',
        'คุณสามารถดำเนินการได้จากปุ่มด้านล่าง',
        '• ดูเควสปัจจุบัน',
        '• ส่งเควสหลัก',
        '• ส่งเควสซ้ำ',
        '',
        'โปรดตรวจสอบรายละเอียดเควสและเตรียมหลักฐานให้พร้อมก่อนส่ง'
      ].join('\n')
    )
    .setFooter({
      text: 'SCUM Quest System'
    })
    .setTimestamp(new Date());
}

module.exports = {
  buildProfessionPanelEmbed
};
