const {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseProfessionEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestEmbed,
  buildQuestDetailEmbed,
  buildRequirementsEmbed,
  buildRewardsEmbed,
  buildDependenciesEmbed,
  buildImagesEmbed,
  buildPanelStatusEmbed,
  buildSearchResultEmbed,
  buildPlaceholderEditEmbed
} = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminHomeComponents,
  buildPanelManagementComponents,
  buildMasterHomeComponents,
  buildProfessionSelectComponent,
  buildLevelSelectComponent,
  buildQuestSelectComponent,
  buildQuestDetailComponents,
  buildQuestSubViewComponents
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

function buildPayload(embed, components) {
  return { embeds: [embed], components };
}

async function buildAdminHomePayload() {
  return buildPayload(buildAdminHomeEmbed(), buildAdminHomeComponents());
}

async function buildPanelManagementPayload() {
  return buildPayload(buildPanelManagementEmbed(), buildPanelManagementComponents());
}

async function buildMasterHomePayload() {
  return buildPayload(buildMasterHomeEmbed(), buildMasterHomeComponents());
}

async function buildBrowseProfessionPayload() {
  const professions = await findActiveProfessions();
  return buildPayload(buildBrowseProfessionEmbed(), buildProfessionSelectComponent(professions));
}

async function buildBrowseLevelPayload(professionId) {
  const profession = await findProfessionById(professionId);
  const levels = await findQuestLevelsByProfession(professionId);
  return buildPayload(buildBrowseLevelEmbed(profession), buildLevelSelectComponent(professionId, levels));
}

async function buildBrowseQuestPayload(professionId, level) {
  const profession = await findProfessionById(professionId);
  const quests = await findQuestsByProfessionAndLevel(professionId, Number(level));
  return buildPayload(buildBrowseQuestEmbed(profession, level, quests), buildQuestSelectComponent(professionId, level, quests));
}

async function buildQuestDetailPayload(questId) {
  const [quest, requirements, rewards, dependencies, images] = await Promise.all([
    findQuestDetailById(questId),
    findQuestRequirements(questId),
    findQuestRewards(questId),
    findQuestDependencies(questId),
    findQuestGuideMedia(questId)
  ]);

  return buildPayload(
    buildQuestDetailEmbed(quest, {
      requirementCount: requirements.length,
      rewardCount: rewards.length,
      dependencyCount: dependencies.length,
      imageCount: images.length
    }),
    buildQuestDetailComponents(questId)
  );
}

async function buildRequirementsPayload(questId) {
  const [quest, requirements] = await Promise.all([
    findQuestDetailById(questId),
    findQuestRequirements(questId)
  ]);
  return buildPayload(buildRequirementsEmbed(quest, requirements), buildQuestSubViewComponents(questId));
}

async function buildRewardsPayload(questId) {
  const [quest, rewards] = await Promise.all([
    findQuestDetailById(questId),
    findQuestRewards(questId)
  ]);
  return buildPayload(buildRewardsEmbed(quest, rewards), buildQuestSubViewComponents(questId));
}

async function buildDependenciesPayload(questId) {
  const [quest, dependencies] = await Promise.all([
    findQuestDetailById(questId),
    findQuestDependencies(questId)
  ]);
  return buildPayload(buildDependenciesEmbed(quest, dependencies), buildQuestSubViewComponents(questId));
}

async function buildImagesPayload(questId) {
  const [quest, images] = await Promise.all([
    findQuestDetailById(questId),
    findQuestGuideMedia(questId)
  ]);
  return buildPayload(buildImagesEmbed(quest, images), buildQuestSubViewComponents(questId));
}

async function buildPanelStatusPayload() {
  const rows = await findPanelStatusRows();
  return buildPayload(buildPanelStatusEmbed(rows), buildPanelManagementComponents());
}

async function buildSearchResultPayload(query) {
  const rows = await searchQuests(query);

  if (!rows.length) {
    return buildPayload(buildSearchResultEmbed(query, rows), buildMasterHomeComponents());
  }

  if (rows.length === 1) {
    return buildQuestDetailPayload(rows[0].quest_id);
  }

  const components = buildQuestSelectComponent('search', 'search', rows);
  return buildPayload(buildSearchResultEmbed(query, rows), components);
}

async function buildEditPlaceholderPayload(questId) {
  const quest = await findQuestDetailById(questId);
  return buildPayload(buildPlaceholderEditEmbed(quest), buildQuestSubViewComponents(questId));
}

module.exports = {
  buildAdminHomePayload,
  buildPanelManagementPayload,
  buildMasterHomePayload,
  buildBrowseProfessionPayload,
  buildBrowseLevelPayload,
  buildBrowseQuestPayload,
  buildQuestDetailPayload,
  buildRequirementsPayload,
  buildRewardsPayload,
  buildDependenciesPayload,
  buildImagesPayload,
  buildPanelStatusPayload,
  buildSearchResultPayload,
  buildEditPlaceholderPayload
};
