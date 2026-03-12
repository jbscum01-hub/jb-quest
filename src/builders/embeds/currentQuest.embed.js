const { EmbedBuilder } = require('discord.js');

function formatRequirement(row) {
  const name = row.item_name || row.input_label || row.requirement_type || 'ไม่ระบุรายการ';
  const qty = row.required_quantity ? ` x${row.required_quantity}` : '';
  return `• ${name}${qty}`;
}

function formatReward(row) {
  if (row.reward_display_text) return `• ${row.reward_display_text}`;
  if (row.reward_type === 'SCUM_ITEM') {
    return `• ${row.reward_item_name || 'ไอเทม'}${row.reward_quantity ? ` x${row.reward_quantity}` : ''}`;
  }
  if (row.reward_type === 'SCUM_MONEY') return `• เงิน ${row.reward_value_number || 0}`;
  if (row.reward_type === 'FAME_POINT') return `• Fame ${row.reward_value_number || 0}`;
  if (row.reward_type === 'DISCORD_ROLE') return `• ยศ ${row.discord_role_name || row.reward_value_text || '-'}`;
  return `• ${row.reward_type}`;
}

function buildCurrentQuestEmbed({ professionCode, profession, quest, requirements = [], rewards = [], guideMedia = [], isRepeatable = false, completedAllMain = false }) {
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
    .setDescription(quest.quest_description || quest.panel_description || '-')
    .addFields(
      {
        name: 'รายละเอียด',
        value: [
          `สายอาชีพ: ${quest.profession_name_th || quest.profession_code || professionCode}`,
          `เลเวล: ${quest.quest_level || '-'}${quest.is_step_quest ? ' · Step Quest' : ''}`,
          `ใช้ Ticket: ${quest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`,
          `จำนวนรูปตัวอย่าง: ${guideMedia.length} รูป`
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

function buildCurrentQuestImageEmbeds(guideMedia = [], questName = '', maxImages = 8) {
  return guideMedia
    .filter((item) => item?.media_url)
    .slice(0, maxImages)
    .map((item, index) => new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🖼️ รูปตัวอย่าง ${index + 1}${questName ? ` · ${questName}` : ''}`)
      .setDescription(item.media_title || item.media_description || 'รูปตัวอย่างเควส')
      .setImage(item.media_url)
      .setFooter({ text: 'SCUM Quest System · Quest Guide Image' })
    );
}

module.exports = {
  buildCurrentQuestEmbed,
  buildCurrentQuestImageEmbeds
};
