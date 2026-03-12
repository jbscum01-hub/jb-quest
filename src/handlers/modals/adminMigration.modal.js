const {
  parseYesNo,
  migrateMainQuestUpToLevel,
  migrateSingleQuest,
  buildMigrationHistoryEmbed
} = require('../../services/questMigration.service');

async function handleAdminMigrationModal(interaction) {
  const parts = interaction.customId.split(':');

  // รูปแบบที่คาด:
  // qmig:modal:migrate_single:<questId>
  // qmig:modal:migrate_upto:<professionCode>|<level>
  // qmig:modal:migrate_history:<professionCode>

  const mode = parts[2];
  const extra = parts.slice(3).join(':') || '';

  if (mode === 'migrate_upto') {
    const [professionCode, levelText] = extra.split('|');

    const embed = await migrateMainQuestUpToLevel({
      client: interaction.client,
      guildId: interaction.guildId,
      rawDiscordUserId: interaction.fields.getTextInputValue('discord_user_id'),
      professionCode,
      uptoLevel: Number(levelText),
      ingameName: interaction.fields.getTextInputValue('ingame_name')?.trim(),
      note: interaction.fields.getTextInputValue('note')?.trim(),
      grantRoleNow: parseYesNo(
        interaction.fields.getTextInputValue('grant_role_now'),
        false
      ),
      adminTag: interaction.user.tag
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    return;
  }

  if (mode === 'migrate_single') {
    const questId = extra;

    const embed = await migrateSingleQuest({
      client: interaction.client,
      guildId: interaction.guildId,
      rawDiscordUserId: interaction.fields.getTextInputValue('discord_user_id'),
      questId,
      ingameName: interaction.fields.getTextInputValue('ingame_name')?.trim(),
      note: interaction.fields.getTextInputValue('note')?.trim(),
      grantRoleNow: parseYesNo(
        interaction.fields.getTextInputValue('grant_role_now'),
        false
      ),
      autoFillPrevious: parseYesNo(
        interaction.fields.getTextInputValue('auto_fill_previous'),
        true
      ),
      adminTag: interaction.user.tag
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    return;
  }

  if (mode === 'migrate_history') {
    const professionCode = extra;

    const embed = await buildMigrationHistoryEmbed({
      rawDiscordUserId: interaction.fields.getTextInputValue('discord_user_id'),
      professionCode
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    return;
  }

  throw new Error(`Unsupported admin migration modal: ${interaction.customId}`);
}

module.exports = { handleAdminMigrationModal };
