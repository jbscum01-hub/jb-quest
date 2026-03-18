const { EmbedBuilder } = require('discord.js');

function formatRequirement(row) {
  if (row.item_name && row.required_quantity) return `• ${row.item_name} x${row.required_quantity}`;
  if (row.item_name) return `• ${row.item_name}`;
  return `• ${row.requirement_type || 'เงื่อนไข'}`;
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

function buildQuestStatusLines(quest, runtime = {}) {
  const lines = [];
  if (quest.category_code === 'TIMED') {
    lines.push(`สถานะ: ${runtime.acceptingSubmissions ? 'เปิดรับ' : (quest.is_active ? 'หมดเวลา/ปิดรับ' : 'ปิดใช้งาน')}`);
    lines.push(`ประเภท: TIMED`);
    if (quest.start_at) lines.push(`เริ่ม: ${new Date(quest.start_at).toLocaleString('th-TH')}`);
    if (quest.end_at) lines.push(`สิ้นสุด: ${new Date(quest.end_at).toLocaleString('th-TH')}`);
    if (Number(quest.submission_limit_count || 0) > 0) {
      lines.push(`ส่งได้: ${quest.submission_limit_count} ครั้ง${Number(quest.submission_limit_period_days || 0) > 0 ? ` / ${quest.submission_limit_period_days} วัน` : ''}`);
    }
  } else {
    lines.push(`สถานะ: ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`);
    lines.push(`ประเภท: LEGENDARY`);
    lines.push(`รับรางวัลรายสัปดาห์: ${Number(quest.weekly_claim_limit || 1)} ครั้ง`);
  }
  return lines;
}

function buildGlobalQuestPanelEmbed(bundle, runtime = {}) {
  const { quest, requirements = [], rewards = [] } = bundle;
  const color = quest.category_code === 'LEGENDARY' ? 0xeb459e : 0x57f287;
  const icon = quest.category_code === 'LEGENDARY' ? '👑' : '✨';
  const title = `${icon} ${quest.panel_title || quest.quest_name || quest.quest_code}`;
  const desc = quest.panel_description || quest.quest_description || '-';

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .addFields(
      { name: 'รายละเอียด', value: buildQuestStatusLines(quest, runtime).join('\n'), inline: false },
      { name: 'ของที่ต้องส่ง / เงื่อนไข', value: requirements.length ? requirements.map(formatRequirement).join('\n') : 'ไม่มี', inline: false },
      { name: 'รางวัล', value: rewards.length ? rewards.map(formatReward).join('\n') : 'ไม่มี', inline: false }
    )
    .setFooter({ text: `SCUM Quest System • ${quest.quest_code}` })
    .setTimestamp();
}

module.exports = { buildGlobalQuestPanelEmbed };
