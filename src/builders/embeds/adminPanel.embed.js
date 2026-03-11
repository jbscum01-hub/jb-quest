const { EmbedBuilder } = require('discord.js');

function buildAdminPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ ศูนย์ควบคุม Quest Admin')
    .setDescription([
      'เลือกหมวดที่ต้องการใช้งานด้านล่าง',
      '',
      '🧩 **จัดการพาเนล**',
      'ใช้สำหรับสร้าง / รีเฟรช / ตรวจสอบพาเนลของแต่ละสายอาชีพ',
      '',
      '📘 **จัดการข้อมูลเควส**',
      'ใช้สำหรับเลือกเควสก่อน แล้วค่อยดูหรือแก้ไขรายละเอียดของเควสนั้น',
      '',
      'ปุ่มทั้งหมดตั้งชื่อภาษาไทย เพื่อลดการกดผิดและลดความสับสน'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

function buildPanelManagementEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧩 จัดการพาเนล')
    .setDescription([
      'ปุ่มแต่ละอันใช้ดังนี้',
      '',
      '• **สร้างพาเนลใหม่** — ใช้ตอนพาเนลยังไม่มี',
      '• **รีเฟรชพาเนล** — ใช้ตอนแก้ข้อความ/ปุ่ม แล้วต้องการอัปเดตพาเนลเดิม',
      '• **ซ่อมพาเนลที่หาย** — ใช้ตอนบางห้องโดนลบข้อความพาเนล',
      '• **รีเฟรชมุมมองเควสปัจจุบัน** — ใช้หลังแก้ master หรือ progress logic',
      '• **สถานะพาเนล** — ใช้ตรวจว่าพาเนลของแต่ละสายยังอยู่ครบหรือไม่'
    ].join('\n'))
    .setFooter({ text: 'Panel Management' })
    .setTimestamp();
}

function buildMasterHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('📘 จัดการข้อมูลเควส')
    .setDescription([
      'ระบบนี้จะ **เลือกเควสก่อนเสมอ** เพื่อให้แอดมินไม่หลงว่ากำลังแก้เควสไหน',
      '',
      'วิธีใช้งาน:',
      '1. กด **เลือกเควสเพื่อดู/แก้ไข**',
      '2. เลือกสายอาชีพ',
      '3. เลือกระดับเควส',
      '4. เลือกเควส',
      '5. เข้าไปดูหรือกดแก้ในหน้า Quest Detail',
      '',
      'หรือกด **สร้างเควสใหม่** เพื่อเพิ่ม master quest ใหม่'
    ].join('\n'))
    .setFooter({ text: 'Master Data / Configuration' })
    .setTimestamp();
}

module.exports = {
  buildAdminPanelEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed
};
