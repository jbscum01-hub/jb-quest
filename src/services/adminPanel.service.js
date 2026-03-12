const {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseQuestEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestListEmbed,
  buildQuestDetailEmbed,
  buildQuestImageManagerEmbed,
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
  buildQuestDetailButtons,
  buildQuestImageManagerButtons
} = require('../builders/components/adminPanel.components');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const { findProfessionConfig } = require('../db/queries/discordConfig.repo');
const {
  listActiveProfessions,
  findProfessionByCode,
  findQuestsByProfessionAndLevel,
  searchQuests,
  getQuestDetailBundle,
  updateQuestActive,
  addQuestGuideImage,
  deactivateQuestGuideImage
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

async function renderQuestImageManager(interaction, questId, index = 0) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }

  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), Math.max(bundle.images.length - 1, 0));
  await updateOrReply(interaction, {
    embeds: [buildQuestImageManagerEmbed(bundle, safeIndex)],
    components: buildQuestImageManagerButtons(questId, safeIndex, bundle.images.length)
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

async function addQuestImageFromModal(interaction, questId) {
  const imageUrl = interaction.fields.getTextInputValue('image_url').trim();
  const imageTitle = interaction.fields.getTextInputValue('image_title')?.trim();
  const imageDescription = interaction.fields.getTextInputValue('image_description')?.trim();

  await addQuestGuideImage(
    questId,
    { imageUrl, imageTitle, imageDescription },
    interaction.user.id
  );

  const refreshed = await getQuestDetailBundle(questId);
  await interaction.reply({
    content: '✅ เพิ่มรูปตัวอย่างเรียบร้อยแล้ว',
    embeds: [buildQuestImageManagerEmbed(refreshed, Math.max(refreshed.images.length - 1, 0))],
    components: [
      ...buildQuestImageManagerButtons(questId, Math.max(refreshed.images.length - 1, 0), refreshed.images.length)
    ],
    ephemeral: true
  });
}

async function removeQuestImageAndRender(interaction, questId, index = 0) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle || !bundle.images.length) {
    await interaction.reply({ content: 'ไม่พบรูปตัวอย่างให้ลบ', ephemeral: true });
    return;
  }

  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), bundle.images.length - 1);
  const currentImage = bundle.images[safeIndex];

  await deactivateQuestGuideImage(currentImage.media_id, interaction.user.id);
  const refreshed = await getQuestDetailBundle(questId);
  const nextIndex = Math.min(safeIndex, Math.max(refreshed.images.length - 1, 0));

  await interaction.update({
    embeds: [buildQuestImageManagerEmbed(refreshed, nextIndex)],
    components: buildQuestImageManagerButtons(questId, nextIndex, refreshed.images.length)
  });

  await interaction.followUp({
    content: '🗑️ ลบรูปตัวอย่างนี้เรียบร้อยแล้ว',
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
  renderQuestImageManager,
  renderQuestSearchResults,
  renderPanelStatus,
  toggleQuestActiveAndRender,
  addQuestImageFromModal,
  removeQuestImageAndRender
};
