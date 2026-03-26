const { EmbedBuilder } = require('discord.js');

function splitBlock(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinBlock(text, fallback = 'ไม่มี') {
  const lines = splitBlock(text);
  return lines.length ? lines.join('\n') : fallback;
}

function pickImageUrl(images = []) {
  return images.find((img) => img?.media_url)?.media_url || null;
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

function buildSpecialLimitText(quest) {
  const count = Number(quest?.submission_limit_count || 0);
  const days = Number(quest?.submission_limit_period_days || 0);
  if (count > 0 && days > 0) return `ส่งได้ ${count} ครั้ง / ${days} วัน`;
  if (count > 0) return `ส่งได้ ${count} ครั้ง`;
  return null;
}

function buildLegendaryLimitText(quest) {
  const weekly = Number(quest?.weekly_claim_limit || 0);
  const cooldownDays = Number(quest?.legendary_claim_cooldown_days || quest?.duration_days || 0);
  if (weekly > 0 && cooldownDays > 0) return `เคลมได้ ${weekly} ครั้ง / ${cooldownDays} วัน`;
  if (weekly > 0) return `เคลมได้ ${weekly} ครั้ง`;
  if (cooldownDays > 0) return `เคลมได้ 1 ครั้ง / ${cooldownDays} วัน`;
  return null;
}

function buildSpecialDescription(quest, requirements, rewards, runtime) {
  const parts = [
    '═════════════════════════════════',
    '🌸 SPECIAL QUEST',
    '═════════════════════════════════',
    '',
    'ภารกิจพิเศษแบบจำกัดเวลา',
    'ทำสำเร็จแล้วกดส่งเควสเพื่อตรวจสอบกับทีมงาน',
  ];

  const startText = formatThaiDateTime(runtime?.startsAt || quest?.start_at);
  const endText = formatThaiDateTime(runtime?.endsAt || quest?.end_at);
  if (startText !== '-' || endText !== '-') {
    parts.push('', '⏰ ระยะเวลา', `เริ่ม: ${startText}`, `สิ้นสุด: ${endText}`);
  }

  const limitText = buildSpecialLimitText(quest);
  if (limitText) {
    parts.push('', '🔁 จำกัดการส่ง', limitText);
  }

  const detailText = String(quest?.quest_description || quest?.panel_description || '').trim();
  if (detailText) {
    parts.push('', '📍 รายละเอียด', detailText);
  }

  parts.push('', '📦 สิ่งที่ต้องส่ง', requirements || 'ไม่มี');
  parts.push('', '🎁 รางวัล', rewards || 'ไม่มี');
  parts.push('', '━━━━━━━━━━━━━━━━━━', 'กดปุ่มด้านล่างเพื่อดูรายละเอียดหรือส่งเควส', '━━━━━━━━━━━━━━━━━━');
  return parts.join('\n');
}

function buildLegendaryDescription(quest, requirements, rewards) {
  const parts = [
    '═════════════════════════════════',
    '👑 LEGENDARY QUEST',
    '═════════════════════════════════',
    '',
    'ภารกิจระดับตำนาน',
    'ผ่านการอนุมัติแล้วสามารถเคลมตามรอบที่กำหนด',
  ];

  const detailText = String(quest?.quest_description || quest?.panel_description || '').trim();
  if (detailText) {
    parts.push('', '📍 รายละเอียด', detailText);
  }

  parts.push('', '📦 สิ่งที่ต้องส่ง', requirements || 'ไม่มี');
  parts.push('', '🎁 รางวัล', rewards || 'ไม่มี');

  const limitText = buildLegendaryLimitText(quest);
  if (limitText) {
    parts.push('', '🕒 การเคลม', limitText);
  }

  parts.push('', '━━━━━━━━━━━━━━━━━━', 'กดปุ่มด้านล่างเพื่อดูรายละเอียดหรือส่งเควส', '━━━━━━━━━━━━━━━━━━');
  return parts.join('\n');
}

function buildDefaultDescription(quest, requirements, rewards) {
  const title = quest?.panel_title || quest?.quest_name || quest?.quest_code || '-';
  const detailText = String(quest?.quest_description || quest?.panel_description || '-').trim();
  return [title, '', '📍 รายละเอียด', detailText, '', '📦 สิ่งที่ต้องส่ง', requirements || 'ไม่มี', '', '🎁 รางวัล', rewards || 'ไม่มี'].join('\n');
}

function buildGlobalQuestPanelEmbed(bundle, runtime = {}) {
  const { quest, requirements = [], rewards = [], images = [] } = bundle || {};

  const requirementText = requirements.map((row) => row?.display_text || '').filter(Boolean).join('\n');
  const rewardText = rewards.map((row) => row?.reward_display_text || '').filter(Boolean).join('\n');

  const categoryCode = String(quest?.category_code || '').toUpperCase();
  let description = buildDefaultDescription(quest, joinBlock(requirementText), joinBlock(rewardText));
  let color = 0x5865f2;

  if (categoryCode === 'TIMED') {
    color = 0xff66cc;
    description = buildSpecialDescription(quest, joinBlock(requirementText), joinBlock(rewardText), runtime);
  } else if (categoryCode === 'LEGENDARY') {
    color = 0xf1c40f;
    description = buildLegendaryDescription(quest, joinBlock(requirementText), joinBlock(rewardText));
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description)
    .setFooter({ text: 'SCUM Quest System' });

  const imageUrl = pickImageUrl(images);
  if (imageUrl) embed.setImage(imageUrl);

  return embed;
}

module.exports = { buildGlobalQuestPanelEmbed };
