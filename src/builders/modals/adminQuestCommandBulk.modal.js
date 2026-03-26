const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestCommandBulkModal(bundle) {
  const quest = bundle.quest;
  const lines = (bundle.rewards || [])
    .filter((item) => item.reward_type === 'SCUM_ITEM')
    .map((item) => item.reward_spawn_command_template || '')
    .filter(Boolean)
    .join('\n');

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:cmdbulk:${quest.quest_id}`)
    .setTitle('แก้คำสั่งไอเทม (ยกชุด)')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('bulk_command_lines')
          .setLabel('ใส่ 1 บรรทัดต่อ 1 คำสั่ง')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(4000)
          .setPlaceholder('#spawnitem PhoenixTears 3\n#spawnitem EmergencyBandagePack 10')
          .setValue(lines.slice(0, 4000))
      )
    );
}

module.exports = { buildQuestCommandBulkModal };
