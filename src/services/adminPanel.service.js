const {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildProfessionPickerEmbed,
  buildLevelPickerEmbed,
  buildQuestPickerEmbed,
  buildQuestDetailEmbed,
  buildQuestRequirementsEmbed,
  buildQuestRewardsEmbed,
  buildQuestDependenciesEmbed,
  buildQuestImagesEmbed,
  buildPanelStatusEmbed,
  buildSearchResultsEmbed
} = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminHomeComponents,
  buildPanelManagementComponents,
  buildMasterHomeComponents,
  buildProfessionSelectComponents,
  buildLevelSelectComponents,
  buildQuestSelectComponents,
  buildQuestDetailComponents,
  buildRequirementSelectComponents,
  buildRewardSelectComponents,
  buildSearchResultComponents,
  buildImageViewerComponents
} = require('../builders/components/adminPanel.components');
const {
  findActiveProfessions,
  findProfessionById,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findQuestDetailById,
  findQuestRequirements,
  findQuestRewards,
  findQuestDependencies,
  findQuestGuideMedia,
  searchQuests,
  findPanelStatusRows
} = require('../db/queries/adminPanel.repo');

async function buildAdminHomePayload() {
  return {
    embeds: [buildAdminHomeEmbed()],
    components: buildAdminHomeComponents()
  };
}

async function buildPanelManagementPayload() {
  return {
    embeds: [buildPanelManagementEmbed()],
    components: buildPanelManagementComponents()
  };
}

async function buildMasterHomePayload() {
  return {
    embeds: [buildMasterHomeEmbed()],
    components: buildMasterHomeComponents()
  };
}

async function buildProfessionPickerPayload() {
  const professions = await findActiveProfessions();
  return {
    embeds: [buildProfessionPickerEmbed(professions)],
    components: buildProfessionSelectComponents(professions)
  };
}

async function buildLevelPickerPayload(professionId) {
  const profession = await findProfessionById(professionId);
  const levels = await findQuestLevelsByProfession(professionId);
  return {
    embeds: [buildLevelPickerEmbed(profession, levels)],
    components: buildLevelSelectComponents(professionId, levels)
  };
}

async function buildQuestPickerPayload(professionId, level) {
  const profession = await findProfessionById(professionId);
  const quests = await findQuestsByProfessionAndLevel(professionId, level);
  return {
    embeds: [buildQuestPickerEmbed(profession, level, quests)],
    components: buildQuestSelectComponents(professionId, level, quests)
  };
}

async function buildQuestDetailPayload(questId) {
  const [quest, requirements, rewards, dependencies, images] = await Promise.all([
    findQuestDetailById(questId),
    findQuestRequirements(questId),
    findQuestRewards(questId),
    findQuestDependencies(questId),
    findQuestGuideMedia(questId)
  ]);

  return {
    embeds: [buildQuestDetailEmbed({ quest, requirements, rewards, dependencies, images })],
    components: buildQuestDetailComponents(questId, { isActive: !!quest.is_active })
  };
}

async function buildQuestRequirementsPayload(questId) {
  const [quest, requirements] = await Promise.all([
    findQuestDetailById(questId),
    findQuestRequirements(questId)
  ]);
  return {
    embeds: [buildQuestRequirementsEmbed(quest, requirements)],
    components: buildRequirementSelectComponents(questId, requirements)
  };
}

async function buildQuestRewardsPayload(questId) {
  const [quest, rewards] = await Promise.all([
    findQuestDetailById(questId),
    findQuestRewards(questId)
  ]);
  return {
    embeds: [buildQuestRewardsEmbed(quest, rewards)],
    components: buildRewardSelectComponents(questId, rewards)
  };
}

async function buildQuestDependenciesPayload(questId) {
  const [quest, dependencies] = await Promise.all([
    findQuestDetailById(questId),
    findQuestDependencies(questId)
  ]);
  return {
    embeds: [buildQuestDependenciesEmbed(quest, dependencies)],
    components: buildQuestDetailComponents(questId, { isActive: !!quest.is_active })
  };
}

async function buildQuestImagesPayload(questId, index = 0) {
  const [quest, images] = await Promise.all([
    findQuestDetailById(questId),
    findQuestGuideMedia(questId)
  ]);
  const safeIndex = Math.max(0, Math.min(index, Math.max(images.length - 1, 0)));
  return {
    embeds: [buildQuestImagesEmbed(quest, images, safeIndex)],
    components: buildImageViewerComponents(questId, safeIndex, images.length || 1)
  };
}

async function buildPanelStatusPayload() {
  const rows = await findPanelStatusRows();
  return {
    embeds: [buildPanelStatusEmbed(rows)],
    components: buildPanelManagementComponents()
  };
}

async function buildSearchResultsPayload(query) {
  const quests = await searchQuests(query);
  return {
    embeds: [buildSearchResultsEmbed(query, quests)],
    components: quests.length ? buildSearchResultComponents(quests) : buildMasterHomeComponents()
  };
}

module.exports = {
  buildAdminHomePayload,
  buildPanelManagementPayload,
  buildMasterHomePayload,
  buildProfessionPickerPayload,
  buildLevelPickerPayload,
  buildQuestPickerPayload,
  buildQuestDetailPayload,
  buildQuestRequirementsPayload,
  buildQuestRewardsPayload,
  buildQuestDependenciesPayload,
  buildQuestImagesPayload,
  buildPanelStatusPayload,
  buildSearchResultsPayload
};
