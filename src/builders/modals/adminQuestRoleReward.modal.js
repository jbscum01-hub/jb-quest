const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestRoleRewardModal(bundle) {
  const quest = bundle.quest;
  const roleReward = (bundle.rewards || []).find((item) => item.reward_type === 'DISCORD_ROLE') || null;

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:role:${quest.quest_id}`)
    .setTitle('ตั้ง Role Reward')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('role_reward_display_text')
          .setLabel('ข้อความที่จะแสดง (เว้นว่างเพื่อลบ)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(255)
          .setPlaceholder('🩺 ยศแพทย์สนาม')
          .setValue((roleReward?.reward_display_text || '').slice(0, 255))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('discord_role_id')
          .setLabel('Discord Role ID (เว้นว่างเพื่อลบ)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(50)
          .setPlaceholder('123456789012345678')
          .setValue((roleReward?.discord_role_id || '').slice(0, 50))
      )
    );
}

module.exports = { buildQuestRoleRewardModal };
