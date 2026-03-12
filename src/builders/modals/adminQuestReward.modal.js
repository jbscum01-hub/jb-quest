const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRewardModal({ questId, reward = null, mode = 'edit' }) {
  const customId = mode === 'add'
    ? `q:rewa:${questId}`
    : `q:rewe:${reward.reward_id}`;

  const rewardName = reward?.reward_item_name || reward?.discord_role_name || reward?.reward_value_text || '';
  const rewardAmount = reward?.reward_quantity || reward?.reward_value_number || 1;

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(mode === 'add' ? 'เพิ่มรางวัล' : 'แก้รางวัล')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reward_type')
          .setLabel('ประเภทรางวัล (SCUM_ITEM / SCUM_MONEY / FAME_POINT / DISCORD_ROLE)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(30)
          .setValue(reward?.reward_type || 'SCUM_ITEM')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reward_name')
          .setLabel('ชื่อรางวัล / ชื่อไอเทม / ชื่อยศ')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(255)
          .setValue(rewardName)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reward_amount')
          .setLabel('จำนวน / มูลค่า')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20)
          .setValue(String(rewardAmount))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reward_display_text')
          .setLabel('ข้อความแสดงผล')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setValue(reward?.reward_display_text || '')
      )
    );
}

module.exports = {
  buildQuestRewardModal
};
