const {
  buildAdminPanelEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseProfessionEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestListEmbed,
  buildQuestDetailEmbed,
  buildQuestRequirementsEmbed,
  buildQuestRewardsEmbed,
  buildQuestDependenciesEmbed,
  buildQuestImagesEmbed,
  buildPanelStatusEmbed
} = require('../builders/embeds/adminPanel.embed');

const {
  buildAdminPanelButtons,
  buildPanelManagementButtons,
  buildMasterHomeButtons,
  buildProfessionSelect,
  buildLevelSelect,
  buildQuestSelect,
  buildQuestDetailButtons,
  buildQuestViewBackButtons
} = require('../builders/components/adminPanel.components');

const {
  findAllActiveProfessions,
  findQuestById,
  findQuestDependencies,
  findQuestGuideMedia,
  findQuestLevelsByProfession,
  findQuestRequirements,
  findQuestRewards,
  findQuestsByProfessionAndLevel,
  findQuestSteps
} = require('../db/queries/questMaster.repo');

const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId
} = require('./discordConfig.service');

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  });
}

async function renderAdminHome(interaction) {
  await interaction.update({
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  });
}

async function renderPanelManagement(interaction) {
  await interaction.update({
    embeds: [buildPanelManagementEmbed()],
    components: buildPanelManagementButtons()
  });
}

async function renderMasterHome(interaction) {
  await interaction.update({
    embeds: [buildMasterHomeEmbed()],
    components: buildMasterHomeButtons()
  });
}

async function renderBrowseProfession(interaction) {
  const professions = await findAllActiveProfessions();

  await interaction.update({
    embeds: [buildBrowseProfessionEmbed(professions)],
    components: buildProfessionSelect(professions)
  });
}

async function renderBrowseLevels(interaction, professionId) {
  const professions = await findAllActiveProfessions();
  const profession = professions.find((item) => item.profession_id === professionId);

  if (!profession) {
    throw new Error('ไม่พบสายอาชีพ');
  }

  const levels = await findQuestLevelsByProfession(professionId);

  await interaction.update({
    embeds: [buildBrowseLevelEmbed(profession, levels)],
    components: buildLevelSelect(professionId, levels)
  });
}

async function renderBrowseQuestList(interaction, professionId, level) {
  const professions = await findAllActiveProfessions();
  const profession = professions.find((item) => item.profession_id === professionId);

  if (!profession) {
    throw new Error('ไม่พบสายอาชีพ');
  }

  const quests = await findQuestsByProfessionAndLevel(professionId, Number(level));

  await interaction.update({
    embeds: [buildBrowseQuestListEmbed(profession, Number(level), quests)],
    components: buildQuestSelect(professionId, Number(level), quests)
  });
}

async function getQuestDetailPayload(questId) {
  const quest = await findQuestById(questId);
  if (!quest) {
    throw new Error('ไม่พบ quest');
  }

  const [requirements, rewards, dependencies, images, steps] = await Promise.all([
    findQuestRequirements(questId),
    findQuestRewards(questId),
    findQuestDependencies(questId),
    findQuestGuideMedia(questId),
    findQuestSteps(questId)
  ]);

  return {
    quest,
    requirements,
    rewards,
    dependencies,
    images,
    steps
  };
}

async function renderQuestDetail(interaction, questId) {
  const payload = await getQuestDetailPayload(questId);

  await interaction.update({
    embeds: [buildQuestDetailEmbed(payload)],
    components: buildQuestDetailButtons(
      payload.quest.quest_id,
      payload.quest.profession_id,
      payload.quest.quest_level
    )
  });
}

async function renderQuestRequirements(interaction, questId) {
  const { quest, requirements } = await getQuestDetailPayload(questId);

  await interaction.update({
    embeds: [buildQuestRequirementsEmbed(quest, requirements)],
    components: buildQuestViewBackButtons(questId)
  });
}

async function renderQuestRewards(interaction, questId) {
  const { quest, rewards } = await getQuestDetailPayload(questId);

  await interaction.update({
    embeds: [buildQuestRewardsEmbed(quest, rewards)],
    components: buildQuestViewBackButtons(questId)
  });
}

async function renderQuestDependencies(interaction, questId) {
  const { quest, dependencies } = await getQuestDetailPayload(questId);

  await interaction.update({
    embeds: [buildQuestDependenciesEmbed(quest, dependencies)],
    components: buildQuestViewBackButtons(questId)
  });
}

async function renderQuestImages(interaction, questId) {
  const { quest, images } = await getQuestDetailPayload(questId);

  await interaction.update({
    embeds: [buildQuestImagesEmbed(quest, images)],
    components: buildQuestViewBackButtons(questId)
  });
}

async function buildPanelStatusRows() {
  const professions = await findAllActiveProfessions();

  const rows = [];
  for (const profession of professions) {
    const channelId = await getProfessionPanelChannelId(profession.profession_code);
    const messageId = await getProfessionPanelMessageId(profession.profession_code);

    rows.push({
      professionCode: profession.profession_code,
      professionName: profession.profession_name_th,
      icon: profession.icon_emoji,
      channelId,
      messageId,
      status: channelId && messageId ? 'OK' : 'MISSING_CONFIG'
    });
  }

  return rows;
}

async function renderPanelStatus(interaction) {
  const rows = await buildPanelStatusRows();

  await interaction.update({
    embeds: [buildPanelStatusEmbed(rows)],
    components: buildPanelManagementButtons()
  });
}

module.exports = {
  refreshAdminPanel,
  renderAdminHome,
  renderPanelManagement,
  renderMasterHome,
  renderBrowseProfession,
  renderBrowseLevels,
  renderBrowseQuestList,
  renderQuestDetail,
  renderQuestRequirements,
  renderQuestRewards,
  renderQuestDependencies,
  renderQuestImages,
  renderPanelStatus
};
