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

function buildLegendaryLimitText(quest) {
  const weekly = Number(quest?.weekly_claim_limit || 0);
  const cooldownDays = Number(quest?.legendary_claim_cooldown_days || quest?.duration_days || 0);
  if (weekly > 0 && cooldownDays > 0) return `เคลมได้ ${weekly} ครั้ง / ${cooldownDays} วัน`;
  if (weekly > 0) return `เคลมได้ ${weekly} ครั้ง`;
  if (cooldownDays > 0) return `เคลมได้ 1 ครั้ง / ${cooldownDays} วัน`;
  return null;
}

function buildLegendaryClaimPanelEmbed({ quest, rewards = [], stateText = '-', images = [] }) {
  const rewardText = rewards
    .map((row) => row?.reward_display_text || '')
    .filter(Boolean)
    .join('\n');

  const parts = [
    '═════════════════════════════════',
    '👑 LEGENDARY CLAIM',
    '═════════════════════════════════',
    '',
    String(quest?.quest_name || quest?.quest_code || '-').trim(),
    '',
    '🎁 รางวัล',
    joinBlock(rewardText),
  ];

  const limitText = buildLegendaryLimitText(quest);
  if (limitText) {
    parts.push('', '🕒 การเคลม', limitText);
  }

  parts.push('', '📌 สถานะเคลม', String(stateText || '-').trim());
  parts.push('', '━━━━━━━━━━━━━━━━━━', 'กดปุ่มด้านล่างเพื่อดูรายละเอียดหรือเคลมรางวัล', '━━━━━━━━━━━━━━━━━━');

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setDescription(parts.join('\n'))
    .setFooter({ text: 'SCUM Quest System' });

  const imageUrl = pickImageUrl(images);
  if (imageUrl) embed.setImage(imageUrl);
  return embed;
}

module.exports = { buildLegendaryClaimPanelEmbed };
