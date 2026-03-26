const { EmbedBuilder } = require('discord.js');

function splitBlock(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatRequirement(row) {
  return splitBlock(row.display_text).join('\n') || null;
}

function formatReward(row) {
  if (row.reward_display_text) return splitBlock(row.reward_display_text).join('\n') || null;
  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_id) return `Role ID: ${row.discord_role_id}`;
  return null;
}

function buildGlobalQuestPanelEmbed({ quest, requirements = [], rewards = [], imageUrl = null }) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(quest.quest_name || quest.quest_code)
    .setDescription(quest.quest_description || quest.panel_description || '-')
    .addFields(
      { name: 'สิ่งที่ต้องส่ง', value: requirements.map(formatRequirement).filter(Boolean).join('\n') || 'ไม่มี', inline: false },
      { name: 'รางวัล', value: rewards.map(formatReward).filter(Boolean).join('\n') || 'ไม่มี', inline: false }
    );

  if (imageUrl) embed.setImage(imageUrl);
  return embed;
}

module.exports = { buildGlobalQuestPanelEmbed };
