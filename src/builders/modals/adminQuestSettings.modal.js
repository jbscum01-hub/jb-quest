const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildQuestSettingsModal(quest) {
  const flags = [
    quest.is_step_quest ? 'STEP' : null,
    quest.requires_ticket ? 'TICKET' : null,
    quest.is_repeatable ? 'REPEATABLE' : null
  ].filter(Boolean).join(',');

  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:qset:${quest.quest_id}`)
    .setTitle(`แก้ประเภท/ลิมิต · ${quest.quest_code}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('category_code')
          .setLabel('ประเภทเควส')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20)
          .setPlaceholder('MAIN / REPEATABLE / TIMED / LEGENDARY')
          .setValue(String(quest.category_code || 'MAIN'))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('flags')
          .setLabel('Flags')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100)
          .setPlaceholder('STEP,TICKET,REPEATABLE')
          .setValue(flags)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('repeat_cooldown_days')
          .setLabel('คูลดาวน์ (วัน)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder('0')
          .setValue(String(quest.repeat_cooldown_days || 0))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('submission_limit_count')
          .setLabel('ลิมิตจำนวนครั้งต่อรอบ')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder('เช่น 3')
          .setValue(quest.submission_limit_count != null ? String(quest.submission_limit_count) : '')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('submission_limit_period_days')
          .setLabel('จำนวนวันของรอบ')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder('เช่น 7')
          .setValue(quest.submission_limit_period_days != null ? String(quest.submission_limit_period_days) : '')
      )
    );
}

module.exports = { buildQuestSettingsModal };