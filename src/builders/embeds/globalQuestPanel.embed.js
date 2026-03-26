const { EmbedBuilder } = require('discord.js');

function formatRequirement(row) {
  if (row.requirement_type === 'INGAME_NAME') return '• ระบุชื่อตัวละคร';
  if (row.requirement_type === 'IMAGE') return '• ส่งภาพหลักฐาน';
  if (row.display_text) return `• ${row.display_text}`;
  return null;
}

function formatReward(row) {
  if (row.reward_display_text) return `• ${row.reward_display_text}`;
  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_id) return `• Role ID: ${row.discord_role_id}`;
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
