const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRewardModal(questId, reward = null) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:reward:${questId}`)
    .setTitle('แก้รางวัลไอเทม')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reward_display_text')
          .setLabel('ข้อความรางวัลไอเทมทั้งก้อน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setValue(reward?.reward_display_text || '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reward_spawn_command_template')
          .setLabel('คำสั่งไอเทมทั้งก้อน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setValue(reward?.reward_spawn_command_template || '')
      )
    );
}

module.exports = { buildQuestRewardModal };
