const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRewardBulkModal(bundle) {
  const quest = bundle.quest;
  const itemReward = (bundle.rewards || []).find((item) => item.reward_type === 'SCUM_ITEM') || null;
  const lines = itemReward?.reward_display_text || '';

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:rewbulk:${quest.quest_id}`)
    .setTitle('แก้รางวัลไอเทม (ยกชุด)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bulk_reward_lines')
          .setLabel('วางข้อความรางวัลไอเทมทั้งก้อน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setPlaceholder('Phoenix Tears x3\nEmergency Bandage Pack x10')
          .setValue(lines.slice(0, 4000))
      )
    );
}

module.exports = { buildQuestRewardBulkModal };
