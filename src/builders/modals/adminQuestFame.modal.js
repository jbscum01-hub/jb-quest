const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestFameModal(quest) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:qfame:${quest.quest_id}`)
    .setTitle(`แก้ Fame ขั้นต่ำ · ${quest.quest_code}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('fame_required_display')
          .setLabel('Fame ขั้นต่ำ')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder('เว้นว่างหรือ 0 = ไม่จำกัด')
          .setValue(quest.fame_required_display != null ? String(quest.fame_required_display) : '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('fame_note')
          .setLabel('ข้อความท้าย embed (ไม่บังคับ)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100)
          .setPlaceholder('เช่น SCUM Quest System')
          .setValue(String(quest.fame_note || ''))
      )
    );
}

module.exports = { buildQuestFameModal };
