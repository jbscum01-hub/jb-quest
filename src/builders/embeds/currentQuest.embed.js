const { EmbedBuilder } = require('discord.js');

function formatRequirement(row) {
  if (row.admin_display_text) return `• ${row.admin_display_text}`;
  if (row.display_text) return `• ${row.display_text}`;
  if (row.item_name && row.required_quantity) return `• ${row.item_name} x${row.required_quantity}`;
  if (row.item_name) return `• ${row.item_name}`;
  if (row.requirement_type === 'IMAGE') return '• ส่งภาพหลักฐาน';
  if (row.requirement_type === 'INGAME_NAME') return '• ระบุชื่อตัวละคร';
  return `• ${row.requirement_type}`;
}

function formatReward(row) {
  if (row.reward_display_text) return `• ${row.reward_display_text}`;
  if (row.reward_item_name && row.reward_quantity) return `• ${row.reward_item_name} x${row.reward_quantity}`;
  if (row.reward_item_name) return `• ${row.reward_item_name}`;
  if (row.reward_type === 'SCUM_MONEY' && row.reward_value_number) return `• เงิน ${row.reward_value_number}`;
  if (row.reward_type === 'FAME_POINT' && row.reward_value_number) return `• Fame ${row.reward_value_number}`;
  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_name) return `• ยศ ${row.discord_role_name}`;
  return `• ${row.reward_type}`;
}

function buildCurrentQuestEmbed({
  professionCode,
  profession,
  quest,
  requirements = [],
  rewards = [],
  isRepeatable = false,
  completedAllMain = false
}) {
  if (!quest && completedAllMain) {
    return new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`✅ ${profession?.profession_name_th || professionCode}`)
      .setDescription('คุณจบเควสหลักทั้งหมดแล้ว รออัปเดตเควสใหม่')
      .setFooter({ text: 'SCUM Quest System' })
      .setTimestamp();
  }

  if (!quest) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle(`ไม่พบเควสของสาย ${professionCode}`)
      .setDescription('กรุณาตรวจสอบข้อมูล quest ในฐานข้อมูล');
  }

  return new EmbedBuilder()
    .setColor(isRepeatable ? 0x57f287 : 0x5865f2)
    .setTitle(`${isRepeatable ? '♻️' : '📜'} ${quest.quest_name}`)
    .setDescription(quest.quest_description || '-')
    .addFields(
      {
        name: 'รายละเอียด',
        value: [
          `สายอาชีพ: ${quest.profession_code || professionCode}`,
          `เลเวล: ${quest.quest_level || '-'}${quest.is_step_quest ? ' Step Quest' : ''}`,
          `Fame ที่แสดง: ${quest.fame_required_display ?? '-'}`
        ].join('\n'),
        inline: false
      },
      {
        name: 'เงื่อนไข',
        value: requirements.length ? requirements.map(formatRequirement).join('\n') : '-',
        inline: false
      },
      {
        name: 'รางวัล',
        value: rewards.length ? rewards.map(formatReward).join('\n') : '-',
        inline: false
      }
    )
    .setFooter({ text: quest.fame_note || 'SCUM Quest System' })
    .setTimestamp();
}

module.exports = {
  buildCurrentQuestEmbed
};
