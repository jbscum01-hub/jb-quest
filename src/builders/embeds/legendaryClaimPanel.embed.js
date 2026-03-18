const { EmbedBuilder } = require('discord.js');

function formatReward(row) {
  if (row.reward_display_text) return `• ${row.reward_display_text}`;
  if (row.reward_item_name && row.reward_quantity) return `• ${row.reward_item_name} x${row.reward_quantity}`;
  if (row.reward_type === 'SCUM_MONEY' && row.reward_value_number) return `• เงิน ${row.reward_value_number}`;
  if (row.reward_type === 'FAME_POINT' && row.reward_value_number) return `• Fame ${row.reward_value_number}`;
  if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_name) return `• ยศ ${row.discord_role_name}`;
  return `• ${row.reward_type}`;
}

function buildLegendaryClaimPanelEmbed(bundle) {
  const { quest, rewards = [], images = [] } = bundle;
  const cooldownDays = Number(quest.legendary_claim_cooldown_days || quest.duration_days || 7);

  const embed = new EmbedBuilder()
    .setColor(0xF1C40F)
    .setTitle(`👑 เคลมตำนาน • ${quest.panel_title || quest.quest_name}`)
    .setDescription(
      quest.panel_description ||
        quest.quest_description ||
        'กดปุ่มด้านล่างเพื่อดูสถานะและเคลมรางวัลของเควสตำนานนี้'
    )
    .addFields(
      {
        name: 'วิธีใช้งาน',
        value: [
          '• ต้องผ่านเควสนี้ครั้งแรกก่อน',
          '• ตอนแอดมินอนุมัติครั้งแรก ระบบจะให้รางวัลทันที',
          '• หลังจากนั้นกดเคลมจากพาเนลนี้ได้ตามเวลา',
          '• ส่งเควสซ้ำได้เฉพาะกรณีแอดมินขอแก้ไขเท่านั้น'
        ].join('\n'),
        inline: false
      },
      {
        name: 'คูลดาวน์การเคลม',
        value: `ทุก ${cooldownDays} วัน หลังจากเคลมล่าสุด`,
        inline: false
      },
      {
        name: 'รางวัลต่อรอบ',
        value: rewards.length ? rewards.map(formatReward).join('\n') : 'ไม่มี',
        inline: false
      }
    )
    .setFooter({ text: `Legendary Claim Panel • ${quest.quest_code}` })
    .setTimestamp();

  const firstImageUrl = images.find((image) => image?.media_url)?.media_url || null;
  if (firstImageUrl) embed.setImage(firstImageUrl);

  return embed;
}

module.exports = {
  buildLegendaryClaimPanelEmbed
};
