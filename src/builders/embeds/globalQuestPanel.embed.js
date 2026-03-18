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

function formatThaiDateTime(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function buildTimedStatusLines(quest, runtime = {}) {
  const lines = [];
  lines.push(`สถานะ: ${runtime.acceptingSubmissions ? 'เปิดรับ' : (quest.is_active ? 'หมดเวลา/ปิดรับ' : 'ปิดใช้งาน')}`);

  if (Number(quest.submission_limit_count || 0) > 0) {
    lines.push(`ส่งได้: ${quest.submission_limit_count} ครั้ง${Number(quest.submission_limit_period_days || 0) > 0 ? ` / ${quest.submission_limit_period_days} วัน` : ''}`);
  }

  return lines;
}

function buildTimedWindowLines(quest) {
  const startAt = formatThaiDateTime(quest.start_at);
  const endAt = formatThaiDateTime(quest.end_at);

  return [
    `เริ่ม: ${startAt}`,
    `สิ้นสุด: ${endAt}`
  ].join('\n');
}

function buildLegendaryStatusLines(quest) {
  return [
    `สถานะ: ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
    `ประเภท: LEGENDARY`,
    `รับรางวัลรายสัปดาห์: ${Number(quest.weekly_claim_limit || 1)} ครั้ง`
  ];
}

function buildGlobalQuestPanelEmbed(bundle, runtime = {}) {
  const { quest, requirements = [], rewards = [], images = [] } = bundle;
  const color = quest.category_code === 'LEGENDARY' ? 0xeb459e : 0x57f287;
  const icon = quest.category_code === 'LEGENDARY' ? '👑' : '✨';
  const title = `${icon} ${quest.panel_title || quest.quest_name || quest.quest_code}`;
  const desc = quest.panel_description || quest.quest_description || '-';

  const fields = [];

  if (quest.category_code === 'TIMED') {
    fields.push({ name: 'รายละเอียด', value: buildTimedStatusLines(quest, runtime).join('\n'), inline: false });
    fields.push({ name: '🕒 ระยะเวลาเควส', value: buildTimedWindowLines(quest), inline: false });
  } else {
    fields.push({ name: 'รายละเอียด', value: buildLegendaryStatusLines(quest).join('\n'), inline: false });
  }

  fields.push(
    { name: 'ของที่ต้องส่ง / เงื่อนไข', value: requirements.length ? requirements.map(formatRequirement).join('\n') : 'ไม่มี', inline: false },
    { name: 'รางวัล', value: rewards.length ? rewards.map(formatReward).join('\n') : 'ไม่มี', inline: false }
  );

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .addFields(fields)
    .setFooter({ text: `SCUM Quest System • ${quest.quest_code}` })
    .setTimestamp();

  const firstImageUrl = images.find((image) => image?.media_url)?.media_url || null;
  if (firstImageUrl) embed.setImage(firstImageUrl);

  return embed;
}

module.exports = { buildGlobalQuestPanelEmbed };
