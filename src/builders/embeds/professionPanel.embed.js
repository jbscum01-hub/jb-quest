const { EmbedBuilder } = require('discord.js');
const { QUEST_COLORS } = require('../../utils/questColor.util');

const PROFESSION_META = {
  MEDIC: { title: 'แพทย์', icon: '🩺' },
  FARMER: { title: 'FARMER', icon: '🌾' },
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
    .setTitle(`${meta.icon} กระดานภารกิจสาย ${meta.title}`)
    .setDescription([
      'ยินดีต้อนรับสู่กระดานภารกิจประจำสายอาชีพ',
      '',
      'ใช้ปุ่มด้านล่างเพื่อดูเควสหรือส่งเควส',
      '• ดูเควสปัจจุบัน',
      '• ส่งเควสหลัก'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

module.exports = {
  buildProfessionPanelEmbed
};
