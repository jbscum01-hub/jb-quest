const {
  renderLevelPicker,
  renderQuestList,
  renderQuestDetail,
  showEditRequirementModal,
  showEditRewardModal,
  showCreateQuestModal,
  saveDependencySelection,
  renderStepDetail,
  renderMigrationLevelPicker,
  renderMigrationQuestList
} = require('../../services/adminPanel.service');
const {
  buildMigrationUpToModal,
  buildMigrationSingleModal,
  buildMigrationHistoryModal
} = require('../../builders/modals/adminMigration.modal');
const { findQuestsByProfessionAndLevel } = require('../../db/queries/questMaster.repo');

async function handleAdminSelect(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[2];
  const extra = parts.slice(3).join(':') || null;


  if (action === 'migration_profession_single') {
    return renderMigrationLevelPicker(interaction, interaction.values[0], 'single');
  }

  if (action === 'migration_profession_upto') {
    return renderMigrationLevelPicker(interaction, interaction.values[0], 'upto');
  }

  if (action === 'migration_profession_history') {
    return interaction.showModal(buildMigrationHistoryModal(interaction.values[0]));
  }

  if (action === 'migration_level_upto') {
    return interaction.showModal(buildMigrationUpToModal(extra, Number(interaction.values[0])));
  }

  if (action === 'migration_level_single') {
    return renderMigrationQuestList(interaction, extra, Number(interaction.values[0]));
  }

  if (action === 'migration_quest_single') {
    const questId = interaction.values[0];
    if (questId === 'NO_QUEST') {
      await interaction.reply({ content: 'ไม่พบเควสให้เลือก', ephemeral: true });
      return;
    }
    return interaction.showModal(buildMigrationSingleModal(questId));
  }

  if (action === 'profession') {
    return renderLevelPicker(interaction, interaction.values[0], 'browse');
  }

  if (action === 'create_profession') {
    return renderLevelPicker(interaction, interaction.values[0], 'create');
  }

  if (action === 'level') {
    return renderQuestList(interaction, extra, Number(interaction.values[0]));
  }

  if (action === 'create_level') {
    return showCreateQuestModal(interaction, extra, Number(interaction.values[0]));
  }

  if (action === 'quest') {
    const questId = interaction.values[0];
    if (questId === 'NO_QUEST') {
      await interaction.reply({ content: 'ไม่พบเควสให้เปิดรายละเอียด', ephemeral: true });
      return;
    }
    return renderQuestDetail(interaction, questId);
  }

  if (action === 'edit_requirement') {
    const requirementId = interaction.values[0];
    if (requirementId === 'NO_REQUIREMENT') {
      await interaction.reply({ content: 'ไม่พบรายการของที่ต้องส่ง', ephemeral: true });
      return;
    }
    return showEditRequirementModal(interaction, extra, requirementId);
  }

  if (action === 'edit_reward') {
    const rewardId = interaction.values[0];
    if (rewardId === 'NO_REWARD') {
      await interaction.reply({ content: 'ไม่พบรางวัล', ephemeral: true });
      return;
    }
    return showEditRewardModal(interaction, extra, rewardId);
  }

  if (action === 'dependency') {
    return saveDependencySelection(interaction, extra, interaction.values[0]);
  }

  if (action === 'step') {
    return renderStepDetail(interaction, interaction.values[0]);
  }
}

module.exports = { handleAdminSelect };
