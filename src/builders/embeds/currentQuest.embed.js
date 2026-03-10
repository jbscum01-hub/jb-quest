const { EmbedBuilder } = require('discord.js');

function buildCurrentQuestEmbed(data) {

  if (!data) {
    return new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('ไม่มีเควสในระบบ');
  }

  const { quest, requirements, rewards } = data;

  const reqText = requirements.map(r => {

    if (r.item_name) {
      return `• ${r.item_name} x${r.required_quantity}`;
    }

    return `• ${r.display_text}`;

  }).join('\n');

  const rewardText = rewards.map(r => {

    if (r.reward_item_name) {
      return `• ${r.reward_item_name} x${r.reward_quantity}`;
    }

    if (r.reward_value_number) {
      return `• ${r.reward_value_number}`;
    }

    return `• ${r.reward_type}`;

  }).join('\n');

  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle(`📜 ${quest.quest_name}`)
    .setDescription(quest.quest_description || '-')
    .addFields(
      { name: 'Requirement', value: reqText || '-', inline:false },
      { name: 'Reward', value: rewardText || '-', inline:false }
    )
    .setFooter({
      text: quest.fame_note || 'SCUM Quest'
    });
}

module.exports = {
  buildCurrentQuestEmbed
};
