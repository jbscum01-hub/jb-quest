const { EmbedBuilder } = require('discord.js');

function buildAdminMasterHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🗂️ จัดการข้อมูลเควส')
    .setDescription([
      'เลือกวิธีที่ต้องการจัดการข้อมูลเควส',
      '',
      '• **เรียกดูเควส** : เลือกสายอาชีพ → เลือกเลเวล → เลือกเควส',
      '• **ค้นหาเควส** : ค้นจากชื่อเควสหรือโค้ดเควส',
      '• **สร้างเควส** : สร้าง quest master ใหม่แบบกรอกข้อมูลพื้นฐานก่อน'
    ].join('\n'))
    .setFooter({ text: 'เลือกเควสก่อน แล้วค่อยแก้ข้อมูลของเควสนั้น' })
    .setTimestamp();
}

function buildSimpleInfoEmbed(title, description, color = 0x2b2d31) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

module.exports = {
  buildAdminMasterHomeEmbed,
  buildSimpleInfoEmbed
};
