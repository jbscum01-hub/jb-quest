const { EmbedBuilder } = require('discord.js');

function buildLegendaryClaimPanelEmbed(bundle) {
  const { quest } = bundle;
  const cooldownDays = Number(quest.legendary_claim_cooldown_days || 7);

  return new EmbedBuilder()
    .setColor(0xeb459e)
    .setTitle(`👑 เคลมรางวัล ${quest.panel_title || quest.quest_name || quest.quest_code}`)
    .setDescription(
      [
        quest.panel_description || quest.quest_description || '-',
        '',
        'วิธีใช้งาน',
        '• ผ่านเควสครั้งแรกให้แอดมินอนุมัติก่อน',
        '• เมื่อผ่านครั้งแรก ระบบจะให้รางวัลทันทีและนับเป็นครั้งแรก',
        `• หลังจากนั้นจะเคลมซ้ำได้ทุก ${cooldownDays} วันจากพาเนลนี้`,
        '• ถ้ายังไม่ครบเวลา ระบบจะแจ้งเวลาที่เคลมได้อีกครั้ง'
      ].join('\n')
    )
    .addFields(
      { name: 'คูลดาวน์การเคลม', value: `${cooldownDays} วัน`, inline: true },
      { name: 'ประเภท', value: 'Legendary Claim Panel', inline: true }
    )
    .setFooter({ text: `SCUM Quest System • Claim • ${quest.quest_code}` })
    .setTimestamp();
}

module.exports = {
  buildLegendaryClaimPanelEmbed
};
