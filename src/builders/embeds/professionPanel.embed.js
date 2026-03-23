const { EmbedBuilder } = require('discord.js');
const { QUEST_COLORS } = require('../../utils/questColor.util');

const PROFESSION_META = {
  MEDIC: { title: 'แพทย์', icon: '🩺' },
  FARMER: { title: 'เกษตรกร', icon: '🌾' },
  SOLDIER: { title: 'ทหาร', icon: '🪖' },
  FISHER: { title: 'ตกปลา', icon: '🎣' },
  HUNTER: { title: 'ล่าสัตว์', icon: '🦌' },
  EXPLORER: { title: 'สำรวจ', icon: '🧭' },
  CHEF: { title: 'เชฟ', icon: '👨‍🍳' },
  ENGINEER: { title: 'วิศวกร', icon: '🔧' },
  AVIATION: { title: 'การบิน', icon: '🛩️' }
};

function getProfessionMeta(professionCode) {
  return PROFESSION_META[professionCode] || { title: professionCode, icon: '📘' };
}

function buildProfessionPanelEmbed(professionCode) {
  const meta = getProfessionMeta(professionCode);
  const color = QUEST_COLORS[professionCode] || QUEST_COLORS.DEFAULT;

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`📜 กระดานเควสสาย ${meta.icon} ${meta.title}`)
    .setDescription([
      'ยินดีต้อนรับสู่ระบบเควสสายอาชีพ',
      '',
      '📖 เควสในสายนี้',
      '• เควสหลัก Lv.1–Lv.5',
      '• เควส Lv.6 (แบบ Step / Ticket)',
      '',
      '🧭 วิธีทำเควส',
      '• กด “ดูเควสปัจจุบัน”',
      '• ทำเควสให้ครบตามที่กำหนด',
      '• กด “ส่งเควส” เพื่อส่งตรวจ',
      '',
      '🧩 เควส Lv.6 ทำยังไง',
      '• เมื่อกดส่ง ระบบจะเปิด Ticket ให้อัตโนมัติ',
      '• ทำตามขั้นตอนใน Ticket ให้ครบ',
      '• ส่งหลักฐานตามที่กำหนด',
      '',
      '📌 หมายเหตุ',
      '• ต้องผ่าน Lv.ก่อนหน้า ถึงจะปลดล็อค Lv.ถัดไป',
      '• รางวัลจะได้รับหลังแอดมินอนุมัติ',
      '',
      '━━━━━━━━━━━━━━━━━━'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

module.exports = {
  buildProfessionPanelEmbed
};
