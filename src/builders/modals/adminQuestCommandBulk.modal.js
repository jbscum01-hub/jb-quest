const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestCommandBulkModal(bundle) {
  const quest = bundle.quest;
  const itemReward = (bundle.rewards || []).find((item) => item.reward_type === 'SCUM_ITEM') || null;
  const lines = itemReward?.reward_spawn_command_template || '';

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:cmdbulk:${quest.quest_id}`)
    .setTitle('แก้คำสั่งไอเทม (ยกชุด)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bulk_command_lines')
          .setLabel('วางคำสั่งไอเทมทั้งก้อน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setPlaceholder('#spawnitem PhoenixTears 3\n#spawnitem EmergencyBandagePack 10')
          .setValue(lines.slice(0, 4000))
      )
    );
}

module.exports = { buildQuestCommandBulkModal };
