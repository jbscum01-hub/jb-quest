const { EmbedBuilder } = require('discord.js');

function formatReward(row) {
  if (row.reward_display_text) return `• ${row.reward_display_text}`;
  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_id) return `• Role ID: ${row.discord_role_id}`;
  return null;
}

function buildLegendaryClaimPanelEmbed({ quest, rewards = [], stateText = '-' }) {
  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(quest.quest_name || quest.quest_code)
    .setDescription(quest.quest_description || quest.panel_description || '-')
    .addFields(
      { name: 'รางวัล', value: rewards.map(formatReward).filter(Boolean).join('\n') || 'ไม่มี', inline: false },
      { name: 'สถานะเคลม', value: stateText, inline: false }
    );
}

module.exports = { buildLegendaryClaimPanelEmbed };
