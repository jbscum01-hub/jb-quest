const {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseQuestEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestListEmbed,
  buildQuestDetailEmbed,
  buildPanelStatusEmbed
} = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminHomeButtons,
  buildPanelManagementButtons,
  buildMasterHomeButtons,
  buildProfessionSelectComponents,
  buildLevelSelectComponents,
  buildQuestSelectComponents,
  buildQuestSearchResultComponents,
  buildQuestDetailButtons
} = require('../builders/components/adminPanel.components');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const { findProfessionConfig } = require('../db/queries/discordConfig.repo');
const {
  listActiveProfessions,
  findProfessionByCode,
  findQuestsByProfessionAndLevel,
  searchQuests,
  getQuestDetailBundle,
  updateQuestActive
} = require('../db/queries/questMaster.repo');

async function updateOrReply(interaction, payload) {
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await interaction.update(payload);
    return;
  }

  if (interaction.isModalSubmit()) {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminHomeEmbed()],
    components: buildAdminHomeButtons()
  });
}

async function renderAdminHome(interaction) {
  await updateOrReply(interaction, {
    embeds: [buildAdminHomeEmbed()],
    components: buildAdminHomeButtons()
  });
}

async function renderPanelManagement(interaction) {
  await updateOrReply(interaction, {
    embeds: [buildPanelManagementEmbed()],
    components: buildPanelManagementButtons()
  });
}

async function renderMasterHome(interaction) {
  await updateOrReply(interaction, {
    embeds: [buildMasterHomeEmbed()],
    components: buildMasterHomeButtons()
  });
}

async function renderProfessionPicker(interaction) {
  const professions = await listActiveProfessions();
  const options = professions.slice(0, 25).map((item) => ({
    label: `${item.icon_emoji || '📘'} ${item.profession_name_th}`.slice(0, 100),
    value: item.profession_code,
    description: `${item.profession_code}`.slice(0, 100)
  }));

  await updateOrReply(interaction, {
    embeds: [buildBrowseQuestEmbed()],
    components: buildProfessionSelectComponents(options)
  });
}

async function renderLevelPicker(interaction, professionCode) {
  const profession = await findProfessionByCode(professionCode);
  const professionLabel = profession?.profession_name_th || professionCode;

  await updateOrReply(interaction, {
    embeds: [buildBrowseLevelEmbed(professionLabel)],
    components: buildLevelSelectComponents(professionCode)
  });
}

async function renderQuestList(interaction, professionCode, level) {
  const profession = await findProfessionByCode(professionCode);
  const quests = await findQuestsByProfessionAndLevel(professionCode, level);
  const professionLabel = profession?.profession_name_th || professionCode;

  await updateOrReply(interaction, {
    embeds: [buildBrowseQuestListEmbed(professionLabel, level, quests)],
    components: buildQuestSelectComponents(professionCode, level, quests)
  });
}

async function renderQuestSearchResults(interaction, keyword) {
  const quests = await searchQuests(keyword);

  const lines = quests.length
    ? quests.map((quest, index) => `${index + 1}. ${quest.quest_code} · ${quest.quest_name} · ${quest.profession_code || '-'} · Lv${quest.quest_level || '-'}`).join('\n')
    : 'ไม่พบเควสที่ตรงกับคำค้น';

  await interaction.reply({
    embeds: [buildBrowseQuestListEmbed('ผลการค้นหา', '-', quests).setDescription(lines)],
    components: buildQuestSearchResultComponents(quests),
    ephemeral: true
  });
}

async function renderQuestDetail(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }

  const quest = bundle.quest;
  await updateOrReply(interaction, {
    embeds: [buildQuestDetailEmbed(bundle)],
    components: buildQuestDetailButtons(quest.quest_id, quest.profession_code, quest.quest_level)
  });
}

async function renderPanelStatus(interaction) {
  const professions = await listActiveProfessions();
  const statusLines = [];

  for (const profession of professions) {
    const channelConfig = await findProfessionConfig(profession.profession_code, DISCORD_CONFIG_KEYS.QUEST_PANEL);
    const messageConfig = await findProfessionConfig(profession.profession_code, DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE);
    statusLines.push(
      `${profession.icon_emoji || '📘'} **${profession.profession_name_th}** — channel: ${channelConfig?.config_value || 'ยังไม่ตั้งค่า'} / message: ${messageConfig?.config_value || 'ยังไม่ตั้งค่า'}`
    );
  }

  await updateOrReply(interaction, {
    embeds: [buildPanelStatusEmbed(statusLines)],
    components: buildPanelManagementButtons()
  });
}

async function toggleQuestActiveAndRender(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }

  await updateQuestActive(questId, !bundle.quest.is_active, interaction.user.id);
  const refreshed = await getQuestDetailBundle(questId);

  await interaction.update({
    embeds: [buildQuestDetailEmbed(refreshed)],
    components: buildQuestDetailButtons(
      refreshed.quest.quest_id,
      refreshed.quest.profession_code,
      refreshed.quest.quest_level
    )
  });

  await interaction.followUp({
    content: `✅ ปรับสถานะเควสเป็น ${refreshed.quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} แล้ว`,
    ephemeral: true
  });
}

module.exports = {
  refreshAdminPanel,
  renderAdminHome,
  renderPanelManagement,
  renderMasterHome,
  renderProfessionPicker,
  renderLevelPicker,
  renderQuestList,
  renderQuestDetail,
  renderQuestSearchResults,
  renderPanelStatus,
  toggleQuestActiveAndRender
};
