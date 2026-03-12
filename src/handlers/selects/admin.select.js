const adminService = require('../../services/adminPanel.service');
const adminRepo = require('../../db/queries/adminPanel.repo');

async function handleAdminSelects(interaction) {
  if (!interaction.isStringSelectMenu()) return false;
  const customId = interaction.customId || '';
  if (!customId.startsWith('admin:')) return false;

  if (customId === 'admin:master:select_profession') {
    const professionId = interaction.values[0];
    await interaction.update(await adminService.buildBrowseLevelPayload(professionId));
    return true;
  }

  if (customId.startsWith('admin:master:select_level:')) {
    const professionId = customId.split(':')[3];
    const level = Number(interaction.values[0]);
    await interaction.update(await adminService.buildBrowseQuestPayload(professionId, level));
    return true;
  }

  if (customId.startsWith('admin:master:select_quest:')) {
    const [, , , professionId, levelText] = customId.split(':');
    const questId = interaction.values[0];
    await interaction.update(await adminService.buildQuestDetailPayload(questId, {
      professionId,
      level: Number(levelText)
    }));
    return true;
  }

  if (customId === 'admin:master:select_search_result') {
    const questId = interaction.values[0];
    const quest = await adminRepo.findQuestDetailById(questId);
    await interaction.update(await adminService.buildQuestDetailPayload(questId, {
      professionId: quest?.profession_id,
      level: quest?.quest_level
    }));
    return true;
  }

  return false;
}

module.exports = { handleAdminSelects };
