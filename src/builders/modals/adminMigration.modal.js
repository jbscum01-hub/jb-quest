const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

function buildMigrationUpToModal(professionCode, level) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:migrate_upto:${professionCode}|${level}`)
    .setTitle(`Legacy Import · ${professionCode} Lv${level}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('discord_user_id')
          .setLabel('Discord User ID / Mention')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder('123456789012345678 หรือ <@123...>')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ingame_name')
          .setLabel('ชื่อในเกม')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('grant_role_now')
          .setLabel('Grant Role Now? YES / NO')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder('NO')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('note')
          .setLabel('หมายเหตุ')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500)
          .setPlaceholder('LEGACY_IMPORT_FROM_DISCORD')
      )
    );
}

function buildMigrationSingleModal(questId) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:migrate_single:${questId}`)
    .setTitle('Legacy Import · Single Quest')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('discord_user_id')
          .setLabel('Discord User ID / Mention')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder('123456789012345678 หรือ <@123...>')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('ingame_name')
          .setLabel('ชื่อในเกม')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('grant_role_now')
          .setLabel('Grant Role Now? YES / NO')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder('NO')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('auto_fill_previous')
          .setLabel('Auto Fill Previous? YES / NO')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(10)
          .setPlaceholder('YES')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('note')
          .setLabel('หมายเหตุ')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500)
          .setPlaceholder('LEGACY_IMPORT_SINGLE_FROM_DISCORD')
      )
    );
}

function buildMigrationHistoryModal(professionCode) {
  return new ModalBuilder()
    .setCustomId(`quest:admin_modal:migrate_history:${professionCode}`)
    .setTitle(`ดูประวัติย้อนหลัง · ${professionCode}`)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('discord_user_id')
          .setLabel('Discord User ID / Mention')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder('123456789012345678 หรือ <@123...>')
      )
    );
}

module.exports = {
  buildMigrationUpToModal,
  buildMigrationSingleModal,
  buildMigrationHistoryModal
};
