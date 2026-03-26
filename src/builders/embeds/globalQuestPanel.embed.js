const { EmbedBuilder } = require('discord.js');

function bulletifyMultiline(value, fallback = '• ไม่มี') {
  const lines = String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length ? lines.map((line) => `• ${line}`).join('\n') : fallback;
}

function formatReward(row) {
  if (row.reward_type === 'SCUM_ITEM' && row.reward_display_text) return bulletifyMultiline(row.reward_display_text);
  if (row.reward_type === 'DISCORD_ROLE') {
    if (row.reward_display_text) return bulletifyMultiline(row.reward_display_text);
    if (row.discord_role_id) return `• Role ID: ${row.discord_role_id}`;
  }
  return null;
}

function buildGlobalQuestPanelEmbed({ quest, requirements = [], rewards = [], imageUrl = null }) {
  const requirement = (requirements || []).find((row) => row.step_id == null && row.display_text);
  const requirementText = requirement ? bulletifyMultiline(requirement.display_text) : 'ไม่มี';
  const rewardText = (rewards || [])
    .filter((row) => ['SCUM_ITEM', 'DISCORD_ROLE'].includes(row.reward_type))
    .map(formatReward)
    .filter(Boolean)
    .join('\n') || 'ไม่มี';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(quest.quest_name || quest.quest_code)
    .setDescription(quest.quest_description || quest.panel_description || '-')
    .addFields(
      { name: 'สิ่งที่ต้องส่ง', value: requirementText, inline: false },
      { name: 'รางวัล', value: rewardText, inline: false }
    );

  if (imageUrl) embed.setImage(imageUrl);
  return embed;
}

module.exports = { buildGlobalQuestPanelEmbed };
