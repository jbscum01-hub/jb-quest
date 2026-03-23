const {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseQuestEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestListEmbed,
  buildGlobalQuestListEmbed,
  buildQuestDetailEmbed,
  buildQuestImageEmbeds,
  buildQuestImageManagerEmbed,
  buildRequirementPickerEmbed,
  buildRewardPickerEmbed,
  buildPanelStatusEmbed,
  buildDependencyPickerEmbed,
  buildCreateQuestSummaryEmbed,
  buildStepManagerEmbed,
  buildStepDetailEmbed,
  buildStepImageEmbeds,
  buildStepImageManagerEmbed
} = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminHomeButtons,
  buildPanelManagementButtons,
  buildMasterHomeButtons,
  buildProfessionSelectComponents,
  buildLevelSelectComponents,
  buildQuestSelectComponents,
  buildCategoryQuestSelectComponents,
  buildQuestSearchResultComponents,
  buildQuestDetailButtons,
  buildQuestImageManagerButtons,
  buildRequirementEditSelectComponents,
  buildRewardEditSelectComponents,
  buildDependencySelectComponents,
  buildStepManagerComponents,
  buildStepDetailButtons,
  buildStepImageManagerButtons
} = require('../builders/components/adminPanel.components');
const { buildQuestDescriptionModal } = require('../builders/modals/adminQuestDescription.modal');
const { buildQuestRequirementModal } = require('../builders/modals/adminQuestRequirement.modal');
const { buildQuestRewardModal } = require('../builders/modals/adminQuestReward.modal');
const { buildQuestRequirementBulkModal } = require('../builders/modals/adminQuestRequirementBulk.modal');
const { buildQuestRewardBulkModal } = require('../builders/modals/adminQuestRewardBulk.modal');
const { buildQuestImageModal, buildStepImageModal } = require('../builders/modals/adminQuestImage.modal');
const { buildCreateQuestModal } = require('../builders/modals/adminCreateQuest.modal');
const { buildQuestScheduleModal } = require('../builders/modals/adminQuestSchedule.modal');
const { buildStepModal } = require('../builders/modals/adminStep.modal');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const { findProfessionConfig } = require('../db/queries/discordConfig.repo');
const {
  listActiveProfessions,
  findProfessionByCode,
  findQuestsByProfessionAndLevel,
  findQuestsByCategory,
  searchQuests,
  getQuestDetailBundle,
  updateQuestActive,
  updateQuestDescription,
  updateQuestScheduleAndLimits,
  findQuestRequirementById,
  updateQuestRequirement,
  addQuestRequirement,
  replaceQuestRequirementsBulk,
  findQuestRewardById,
  updateQuestReward,
  addQuestReward,
  replaceQuestRewardsBulk,
  addQuestGuideImage,
  deactivateQuestGuideImage,
  findAvailableDependencyQuests,
  replaceQuestDependency,
  createQuest,
  getStepDetailBundle,
  createQuestStep,
  updateQuestStep,
  updateQuestStepActive,
  addStepGuideImage,
  deactivateStepGuideImage,
  findQuestStepById
} = require('../db/queries/questMaster.repo');
const { getQuestPanelMessageId, deployOrRefreshGlobalQuestPanel } = require('./globalPanel.service');
const { deployOrRefreshLegendaryClaimPanel } = require('./legendaryClaimPanel.service');

async function updateOrReply(interaction, payload) {
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await interaction.update(payload);
    return;
  }

  if (interaction.isModalSubmit()) {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

function buildQuestDetailResponse(bundle) {
  return {
    embeds: [buildQuestDetailEmbed(bundle), ...buildQuestImageEmbeds(bundle)],
    components: buildQuestDetailButtons(bundle.quest, bundle.quest.is_step_quest)
  };
}

function buildStepDetailResponse(bundle) {
  return {
    embeds: [buildStepDetailEmbed(bundle), ...buildStepImageEmbeds(bundle)],
    components: buildStepDetailButtons(bundle.step.step_id, bundle.step.quest_id, bundle.step.is_active)
  };
}

function parsePositiveInteger(raw, fieldName) {
  const value = Number(String(raw || '').trim());
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} ต้องเป็นตัวเลขจำนวนเต็มมากกว่า 0`);
  }
  return value;
}

function parseRewardType(raw) {
  const value = String(raw || '').trim().toUpperCase();
  const allowed = ['SCUM_ITEM', 'SCUM_MONEY', 'FAME_POINT', 'DISCORD_ROLE'];
  if (!allowed.includes(value)) {
    throw new Error(`ประเภทรางวัลต้องเป็น ${allowed.join(' / ')}`);
  }
  return value;
}


function parseBulkLines(raw) {
  return String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function parseRequirementBulkInput(raw) {
  const lines = parseBulkLines(raw);
  return lines.map((line, index) => {
    const parts = line.split('|').map((v) => v.trim());
    const first = (parts[0] || '').toUpperCase();
    const allowed = ['SCUM_ITEM', 'SCUM_MONEY', 'CUSTOM_TEXT', 'TEXT', 'IMAGE', 'INGAME_NAME'];
    const hasType = allowed.includes(first);
    const requirementType = hasType ? first : 'SCUM_ITEM';
    const values = hasType ? parts.slice(1) : parts;
    if (values.length < 2) {
      throw new Error(`ของที่ต้องส่งบรรทัด ${index + 1} ต้องมีอย่างน้อย ชื่อ|จำนวน`);
    }
    const itemName = values[0] || '';
    const requiredQuantity = parsePositiveInteger(values[1], `จำนวนของที่ต้องส่งบรรทัด ${index + 1}`);
    const itemSpawnCommandTemplate = values[2] || (requirementType === 'SCUM_ITEM' ? `#spawnitem ${itemName} ${requiredQuantity}` : null);
    const displayText = values[3] || `${itemName} x${requiredQuantity}`;
    return {
      requirementType,
      itemName,
      itemSpawnName: itemName,
      itemSpawnCommandTemplate,
      requiredQuantity,
      inputLabel: itemName,
      displayText,
      adminDisplayText: displayText
    };
  });
}

function parseRewardBulkInput(raw) {
  const lines = parseBulkLines(raw);
  return lines.map((line, index) => {
    const parts = line.split('|').map((v) => v.trim());
    const first = (parts[0] || '').toUpperCase();
    const allowed = ['SCUM_ITEM', 'SCUM_MONEY', 'FAME_POINT', 'DISCORD_ROLE'];
    const hasType = allowed.includes(first);
    const rewardType = hasType ? first : 'SCUM_ITEM';
    const values = hasType ? parts.slice(1) : parts;

    if (rewardType === 'SCUM_ITEM') {
      if (values.length < 2) throw new Error(`รางวัลบรรทัด ${index + 1} ต้องมีอย่างน้อย ชื่อไอเทม|จำนวน`);
      const rewardItemName = values[0] || '';
      const rewardQuantity = parsePositiveInteger(values[1], `จำนวนรางวัลบรรทัด ${index + 1}`);
      const rewardSpawnCommandTemplate = values[2] || `#spawnitem ${rewardItemName} ${rewardQuantity}`;
      const rewardDisplayText = values[3] || `${rewardItemName} x${rewardQuantity}`;
      return {
        rewardType,
        rewardItemName,
        rewardItemSpawnName: rewardItemName,
        rewardSpawnCommandTemplate,
        rewardQuantity,
        rewardDisplayText,
        rewardValueText: rewardDisplayText,
        rewardValueNumber: null,
        discordRoleId: null,
        discordRoleName: null
      };
    }

    if (rewardType === 'SCUM_MONEY' || rewardType === 'FAME_POINT') {
      if (values.length < 1) throw new Error(`รางวัลบรรทัด ${index + 1} ต้องมีมูลค่าอย่างน้อย 1 ค่า`);
      const rewardValueNumber = parsePositiveInteger(values[0], `มูลค่ารางวัลบรรทัด ${index + 1}`);
      const rewardDisplayText = values[1] || `${rewardType} ${rewardValueNumber}`;
      return {
        rewardType,
        rewardItemName: null,
        rewardItemSpawnName: null,
        rewardSpawnCommandTemplate: null,
        rewardQuantity: null,
        rewardDisplayText,
        rewardValueText: rewardDisplayText,
        rewardValueNumber,
        discordRoleId: null,
        discordRoleName: null
      };
    }

    if (rewardType === 'DISCORD_ROLE') {
      if (values.length < 2) throw new Error(`รางวัลบรรทัด ${index + 1} ต้องมีอย่างน้อย ROLE_ID|ROLE_NAME`);
      const discordRoleId = values[0] || '';
      const discordRoleName = values[1] || '';
      const rewardDisplayText = values[2] || discordRoleName || discordRoleId;
      return {
        rewardType,
        rewardItemName: null,
        rewardItemSpawnName: null,
        rewardSpawnCommandTemplate: null,
        rewardQuantity: null,
        rewardDisplayText,
        rewardValueText: discordRoleName || discordRoleId,
        rewardValueNumber: null,
        discordRoleId,
        discordRoleName
      };
    }

    throw new Error(`ไม่รองรับ reward type บรรทัด ${index + 1}`);
  });
}

function parseFlagSet(raw) {
  return new Set(String(raw || '').toUpperCase().split(',').map((v) => v.trim()).filter(Boolean));
}

function parseStepFlags(raw) {
  const set = parseFlagSet(raw);
  return {
    requiresTextInput: set.has('TEXT'),
    requiresAttachment: set.has('ATTACH'),
    requiresAdminApproval: set.has('APPROVAL'),
    allowResubmit: set.has('RESUBMIT')
  };
}

function parseCreateQuestFlags(raw) {
  const set = parseFlagSet(raw);
  return {
    isStepQuest: set.has('STEP'),
    requiresTicket: set.has('TICKET'),
    isRepeatable: set.has('REPEATABLE')
  };
}

function splitSuccessFailure(raw) {
  const value = String(raw || '');
  const [successMessage, ...rest] = value.split('|');
  return { successMessage: successMessage?.trim() || '', failureMessage: rest.join('|').trim() || '' };
}

async function refreshAdminPanel(message) {
  await message.edit({ embeds: [buildAdminHomeEmbed()], components: buildAdminHomeButtons() });
}

async function renderAdminHome(interaction) {
  await updateOrReply(interaction, { embeds: [buildAdminHomeEmbed()], components: buildAdminHomeButtons() });
}

async function renderPanelManagement(interaction) {
  await updateOrReply(interaction, { embeds: [buildPanelManagementEmbed()], components: buildPanelManagementButtons() });
}

async function renderMasterHome(interaction) {
  await updateOrReply(interaction, { embeds: [buildMasterHomeEmbed()], components: buildMasterHomeButtons() });
}

async function renderProfessionPicker(interaction, mode = 'browse') {
  const professions = await listActiveProfessions();
  const options = professions.slice(0, 25).map((item) => ({
    label: `${item.icon_emoji || '📘'} ${item.profession_name_th}`.slice(0, 100),
    value: item.profession_code,
    description: `${item.profession_code}`.slice(0, 100)
  }));

  await updateOrReply(interaction, {
    embeds: [buildBrowseQuestEmbed(mode)],
    components: buildProfessionSelectComponents(options, mode)
  });
}

async function renderLevelPicker(interaction, professionCode, mode = 'browse') {
  const profession = await findProfessionByCode(professionCode);
  const professionLabel = profession?.profession_name_th || professionCode;

  await updateOrReply(interaction, {
    embeds: [buildBrowseLevelEmbed(professionLabel, mode)],
    components: buildLevelSelectComponents(professionCode, mode)
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

async function renderCategoryQuestList(interaction, categoryCode) {
  const quests = await findQuestsByCategory(categoryCode);
  await updateOrReply(interaction, {
    embeds: [buildGlobalQuestListEmbed(categoryCode, quests)],
    components: buildCategoryQuestSelectComponents(categoryCode, quests)
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

async function enrichBundle(bundle) {
  if (!bundle) return bundle;
  bundle.panelMessageId = ['TIMED', 'LEGENDARY'].includes(bundle.quest.category_code)
    ? await getQuestPanelMessageId(bundle.quest.quest_id)
    : null;
  return bundle;
}

async function renderQuestDetail(interaction, questId) {
  const bundle = await enrichBundle(await getQuestDetailBundle(questId));
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await updateOrReply(interaction, buildQuestDetailResponse(bundle));
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

async function renderRequirementEditor(interaction, questId) {
  return showBulkRequirementModal(interaction, questId);
}

async function renderRewardEditor(interaction, questId) {
  return showBulkRewardModal(interaction, questId);
}

async function renderPanelStatus(interaction) {
  const professions = await listActiveProfessions();
  const statusLines = [];
  for (const profession of professions) {
    const channelConfig = await findProfessionConfig(profession.profession_code, DISCORD_CONFIG_KEYS.QUEST_PANEL);
    const messageConfig = await findProfessionConfig(profession.profession_code, DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE);
    statusLines.push(`${profession.icon_emoji || '📘'} **${profession.profession_name_th}** — channel: ${channelConfig?.config_value || 'ยังไม่ตั้งค่า'} / message: ${messageConfig?.config_value || 'ยังไม่ตั้งค่า'}`);
  }
  await updateOrReply(interaction, { embeds: [buildPanelStatusEmbed(statusLines)], components: buildPanelManagementButtons() });
}

async function toggleQuestActiveAndRender(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await updateQuestActive(questId, !bundle.quest.is_active, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.update(buildQuestDetailResponse(refreshed));
  await interaction.followUp({ content: `✅ ปรับสถานะเควสเป็น ${refreshed.quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} แล้ว`, ephemeral: true });
}

async function showQuestDescriptionModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestDescriptionModal(bundle.quest));
}

async function showEditRequirementModal(interaction, questId, requirementId) {
  const requirement = await findQuestRequirementById(requirementId);
  if (!requirement || requirement.quest_id !== questId) {
    await interaction.reply({ content: 'ไม่พบรายการของที่ต้องส่งนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestRequirementModal({ questId, requirement, mode: 'edit' }));
}

async function showAddRequirementModal(interaction, questId) {
  await interaction.showModal(buildQuestRequirementModal({ questId, mode: 'add' }));
}

async function showEditRewardModal(interaction, questId, rewardId) {
  const reward = await findQuestRewardById(rewardId);
  if (!reward || reward.quest_id !== questId) {
    await interaction.reply({ content: 'ไม่พบรางวัลนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestRewardModal({ questId, reward, mode: 'edit' }));
}

async function showAddRewardModal(interaction, questId) {
  await interaction.showModal(buildQuestRewardModal({ questId, mode: 'add' }));
}

async function showBulkRequirementModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestRequirementBulkModal(bundle));
}

async function showBulkRewardModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestRewardBulkModal(bundle));
}

async function saveQuestDescriptionFromModal(interaction, questId) {
  await updateQuestDescription(questId, {
    questName: interaction.fields.getTextInputValue('quest_name').trim(),
    questDescription: interaction.fields.getTextInputValue('quest_description').trim(),
    panelDescription: interaction.fields.getTextInputValue('panel_description').trim()
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ บันทึกคำอธิบายเควสเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestRequirementFromModal(interaction, requirementId) {
  const requirement = await findQuestRequirementById(requirementId);
  if (!requirement) throw new Error('ไม่พบรายการของที่ต้องส่งนี้');
  await updateQuestRequirement(requirementId, {
    itemName: interaction.fields.getTextInputValue('item_name').trim(),
    requiredQuantity: parsePositiveInteger(interaction.fields.getTextInputValue('required_quantity'), 'จำนวนที่ต้องส่ง')
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(requirement.quest_id));
  await interaction.reply({ content: '✅ บันทึกรายการของที่ต้องส่งเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function addQuestRequirementFromModal(interaction, questId) {
  await addQuestRequirement(questId, {
    itemName: interaction.fields.getTextInputValue('item_name').trim(),
    requiredQuantity: parsePositiveInteger(interaction.fields.getTextInputValue('required_quantity'), 'จำนวนที่ต้องส่ง')
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ เพิ่มรายการของที่ต้องส่งเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestRewardFromModal(interaction, rewardId) {
  const reward = await findQuestRewardById(rewardId);
  if (!reward) throw new Error('ไม่พบรางวัลนี้');
  await updateQuestReward(rewardId, {
    rewardType: parseRewardType(interaction.fields.getTextInputValue('reward_type')),
    rewardName: interaction.fields.getTextInputValue('reward_name').trim(),
    rewardAmount: parsePositiveInteger(interaction.fields.getTextInputValue('reward_amount'), 'จำนวน / มูลค่า'),
    rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim()
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(reward.quest_id));
  await interaction.reply({ content: '✅ บันทึกรางวัลเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function addQuestRewardFromModal(interaction, questId) {
  await addQuestReward(questId, {
    rewardType: parseRewardType(interaction.fields.getTextInputValue('reward_type')),
    rewardName: interaction.fields.getTextInputValue('reward_name').trim(),
    rewardAmount: parsePositiveInteger(interaction.fields.getTextInputValue('reward_amount'), 'จำนวน / มูลค่า'),
    rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim()
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ เพิ่มรางวัลเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestRequirementBulkFromModal(interaction, questId) {
  const items = parseRequirementBulkInput(interaction.fields.getTextInputValue('bulk_requirement_lines'));
  await replaceQuestRequirementsBulk(questId, items, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: `✅ บันทึกของที่ต้องส่งแบบยกชุดเรียบร้อยแล้ว (${items.length} รายการ)`, ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestRewardBulkFromModal(interaction, questId) {
  const items = parseRewardBulkInput(interaction.fields.getTextInputValue('bulk_reward_lines'));
  await replaceQuestRewardsBulk(questId, items, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: `✅ บันทึกรางวัลแบบยกชุดเรียบร้อยแล้ว (${items.length} รายการ)`, ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function addQuestImageFromModal(interaction, questId) {
  await addQuestGuideImage(questId, {
    imageUrl: interaction.fields.getTextInputValue('image_url').trim(),
    imageTitle: interaction.fields.getTextInputValue('image_title')?.trim(),
    imageDescription: interaction.fields.getTextInputValue('image_description')?.trim()
  }, interaction.user.id);

  const refreshed = await getQuestDetailBundle(questId);
  await interaction.reply({ content: '✅ เพิ่มรูปตัวอย่างเรียบร้อยแล้ว', embeds: [buildQuestImageManagerEmbed(refreshed, Math.max(refreshed.images.length - 1, 0))], components: buildQuestImageManagerButtons(questId, Math.max(refreshed.images.length - 1, 0), refreshed.images.length), ephemeral: true });
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
  await interaction.update({ embeds: [buildQuestImageManagerEmbed(refreshed, nextIndex)], components: buildQuestImageManagerButtons(questId, nextIndex, refreshed.images.length) });
  await interaction.followUp({ content: '🗑️ ลบรูปตัวอย่างนี้เรียบร้อยแล้ว', ephemeral: true });
}

async function renderCreateQuestSummary(interaction, professionCode, level) {
  const profession = await findProfessionByCode(professionCode);
  await updateOrReply(interaction, {
    embeds: [buildCreateQuestSummaryEmbed(profession, level)],
    components: [buildMasterHomeButtons()[1]]
  });
}

async function showCreateQuestModal(interaction, professionCode, level) {
  await interaction.showModal(buildCreateQuestModal({ professionCode, level }));
}

async function showCreateGlobalQuestModal(interaction, categoryCode) {
  await interaction.showModal(buildCreateQuestModal({ categoryCode }));
}

async function deployQuestRelatedPanels(client, quest) {
  if (!quest || !['TIMED', 'LEGENDARY'].includes(quest.category_code)) {
    return { questPanel: null, claimPanel: null };
  }

  const questPanel = await deployOrRefreshGlobalQuestPanel(client, quest.quest_id);
  let claimPanel = null;

  if (quest.category_code === 'LEGENDARY') {
    claimPanel = await deployOrRefreshLegendaryClaimPanel(client, quest.quest_id);
  }

  return { questPanel, claimPanel };
}

async function saveCreateQuestFromModal(interaction, context = {}) {
  const { professionCode = null, level = null, categoryCode = null } = context;
  const flags = parseCreateQuestFlags(interaction.fields.getTextInputValue('flags'));
  const dependencyCode = interaction.fields.getTextInputValue('dependency_code').trim().toUpperCase();
  let dependencyQuestId = null;
  if (dependencyCode) {
    const matches = await searchQuests(dependencyCode);
    dependencyQuestId = matches.find((row) => row.quest_code === dependencyCode)?.quest_id || null;
  }

  const finalCategoryCode = categoryCode || (flags.isRepeatable ? 'REPEATABLE' : 'MAIN');
  const questId = await createQuest({
    professionCode,
    questLevel: professionCode ? Number(level) : null,
    categoryCode: finalCategoryCode,
    questCode: interaction.fields.getTextInputValue('quest_code').trim().toUpperCase(),
    questName: interaction.fields.getTextInputValue('quest_name').trim(),
    questDescription: interaction.fields.getTextInputValue('quest_description').trim(),
    isStepQuest: flags.isStepQuest,
    requiresTicket: flags.requiresTicket,
    isRepeatable: flags.isRepeatable,
    dependencyQuestId
  }, interaction.user.id);

  const bundle = await enrichBundle(await getQuestDetailBundle(questId));

  let createMessage = '✅ สร้างเควสเรียบร้อยแล้ว';
  if (['TIMED', 'LEGENDARY'].includes(bundle.quest.category_code)) {
    try {
      const deployed = await deployQuestRelatedPanels(interaction.client, bundle.quest);
      createMessage += deployed.claimPanel
        ? '\n✅ สร้าง/อัปเดตพาเนลเควส + พาเนลเคลมให้แล้วอัตโนมัติ'
        : '\n✅ สร้าง/อัปเดตพาเนลเควสให้แล้วอัตโนมัติ';
    } catch (error) {
      createMessage += `\n⚠️ สร้างเควสสำเร็จ แต่สร้างพาเนลอัตโนมัติไม่สำเร็จ: ${error.message}`;
    }
  }

  await interaction.reply({ content: createMessage, ...buildQuestDetailResponse(bundle), ephemeral: true });
}

async function renderDependencyEditor(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  const quests = await findAvailableDependencyQuests(questId);
  const options = quests.map((item) => ({
    label: `${item.quest_code}`.slice(0, 100),
    value: item.quest_id,
    description: `${item.quest_name}`.slice(0, 100)
  }));

  await interaction.reply({
    embeds: [buildDependencyPickerEmbed(bundle, options)],
    components: buildDependencySelectComponents(questId, options),
    ephemeral: true
  });
}

async function saveDependencySelection(interaction, questId, selectedValue) {
  await replaceQuestDependency(questId, selectedValue === 'NONE' ? null : selectedValue, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.update(buildQuestDetailResponse(refreshed));
  await interaction.followUp({ content: selectedValue === 'NONE' ? '✅ ลบ dependency เรียบร้อยแล้ว' : '✅ เปลี่ยนเควสก่อนหน้าเรียบร้อยแล้ว', ephemeral: true });
}

async function renderStepManager(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await updateOrReply(interaction, { embeds: [buildStepManagerEmbed(bundle)], components: buildStepManagerComponents(questId, bundle.steps) });
}

async function renderStepDetail(interaction, stepId) {
  const bundle = await getStepDetailBundle(stepId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูล Step นี้', ephemeral: true });
    return;
  }
  await updateOrReply(interaction, buildStepDetailResponse(bundle));
}

async function showAddStepModal(interaction, questId) {
  await interaction.showModal(buildStepModal({ questId, mode: 'add' }));
}

async function showEditStepModal(interaction, stepId) {
  const step = await findQuestStepById(stepId);
  if (!step) {
    await interaction.reply({ content: 'ไม่พบข้อมูล Step นี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildStepModal({ step, mode: 'edit' }));
}

async function saveStepFromModal(interaction, mode, id) {
  const flags = parseStepFlags(interaction.fields.getTextInputValue('flags'));
  const { successMessage, failureMessage } = splitSuccessFailure(interaction.fields.getTextInputValue('success_failure'));
  const payload = {
    stepNo: parsePositiveInteger(interaction.fields.getTextInputValue('step_no'), 'หมายเลข Step'),
    stepTitle: interaction.fields.getTextInputValue('step_title').trim(),
    stepDescription: interaction.fields.getTextInputValue('step_description').trim(),
    successMessage,
    failureMessage,
    ...flags
  };

  let stepId = id;
  if (mode === 'add') {
    const created = await createQuestStep(id, payload, interaction.user.id);
    stepId = created.step_id;
  } else {
    await updateQuestStep(id, payload, interaction.user.id);
  }

  const bundle = await getStepDetailBundle(stepId);
  await interaction.reply({ content: mode === 'add' ? '✅ เพิ่ม Step เรียบร้อยแล้ว' : '✅ แก้ไข Step เรียบร้อยแล้ว', ...buildStepDetailResponse(bundle), ephemeral: true });
}

async function toggleStepActiveAndRender(interaction, stepId) {
  const step = await findQuestStepById(stepId);
  if (!step) {
    await interaction.reply({ content: 'ไม่พบข้อมูล Step นี้', ephemeral: true });
    return;
  }
  await updateQuestStepActive(stepId, !step.is_active, interaction.user.id);
  const bundle = await getStepDetailBundle(stepId);
  await interaction.update(buildStepDetailResponse(bundle));
  await interaction.followUp({ content: `✅ ปรับสถานะ Step เป็น ${bundle.step.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} แล้ว`, ephemeral: true });
}

async function renderStepImageManager(interaction, stepId, index = 0) {
  const bundle = await getStepDetailBundle(stepId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูล Step นี้', ephemeral: true });
    return;
  }
  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), Math.max(bundle.images.length - 1, 0));
  await updateOrReply(interaction, {
    embeds: [buildStepImageManagerEmbed(bundle, safeIndex)],
    components: buildStepImageManagerButtons(stepId, bundle.step.quest_id, safeIndex, bundle.images.length)
  });
}

async function addStepImageFromModal(interaction, stepId) {
  await addStepGuideImage(stepId, {
    imageUrl: interaction.fields.getTextInputValue('image_url').trim(),
    imageTitle: interaction.fields.getTextInputValue('image_title')?.trim(),
    imageDescription: interaction.fields.getTextInputValue('image_description')?.trim()
  }, interaction.user.id);
  const refreshed = await getStepDetailBundle(stepId);
  await interaction.reply({ content: '✅ เพิ่มรูป Step เรียบร้อยแล้ว', embeds: [buildStepImageManagerEmbed(refreshed, Math.max(refreshed.images.length - 1, 0))], components: buildStepImageManagerButtons(stepId, refreshed.step.quest_id, Math.max(refreshed.images.length - 1, 0), refreshed.images.length), ephemeral: true });
}

async function removeStepImageAndRender(interaction, stepId, index = 0) {
  const bundle = await getStepDetailBundle(stepId);
  if (!bundle || !bundle.images.length) {
    await interaction.reply({ content: 'ไม่พบรูป Step ให้ลบ', ephemeral: true });
    return;
  }
  const safeIndex = Math.min(Math.max(Number(index) || 0, 0), bundle.images.length - 1);
  const currentImage = bundle.images[safeIndex];
  await deactivateStepGuideImage(currentImage.media_id, interaction.user.id);
  const refreshed = await getStepDetailBundle(stepId);
  const nextIndex = Math.min(safeIndex, Math.max(refreshed.images.length - 1, 0));
  await interaction.update({ embeds: [buildStepImageManagerEmbed(refreshed, nextIndex)], components: buildStepImageManagerButtons(stepId, refreshed.step.quest_id, nextIndex, refreshed.images.length) });
  await interaction.followUp({ content: '🗑️ ลบรูป Step เรียบร้อยแล้ว', ephemeral: true });
}

async function showAddStepImageModal(interaction, stepId) {
  await interaction.showModal(buildStepImageModal(stepId));
}


async function showQuestScheduleModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  if (!['TIMED', 'LEGENDARY'].includes(bundle.quest.category_code)) {
    await interaction.reply({ content: 'เมนูนี้ใช้ได้เฉพาะเควสพิเศษและเควสตำนาน', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestScheduleModal(bundle.quest));
}

async function saveQuestScheduleFromModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) throw new Error('ไม่พบข้อมูลเควสนี้');

  if (bundle.quest.category_code === 'TIMED') {
    await updateQuestScheduleAndLimits(questId, {
      startAt: interaction.fields.getTextInputValue('start_at').trim() || null,
      durationDays: interaction.fields.getTextInputValue('duration_days').trim(),
      submissionLimitCount: interaction.fields.getTextInputValue('submission_limit_count').trim(),
      submissionLimitPeriodDays: interaction.fields.getTextInputValue('submission_limit_period_days').trim()
    }, interaction.user.id);
  } else {
    await updateQuestScheduleAndLimits(questId, {
      weeklyClaimLimit: interaction.fields.getTextInputValue('weekly_claim_limit').trim()
    }, interaction.user.id);
  }

  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ บันทึกเวลา/ลิมิตเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function deployQuestPanelAndRender(interaction, questId) {
  await interaction.deferReply({ flags: 64 });
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) throw new Error('ไม่พบข้อมูลเควสนี้');

  const deployed = await deployQuestRelatedPanels(interaction.client, bundle.quest);
  const messages = [
    deployed.questPanel?.created ? '✅ สร้าง/อัปเดตพาเนลเควสนี้แล้ว' : '✅ รีเฟรชพาเนลเควสนี้แล้ว'
  ];

  if (deployed.claimPanel) {
    messages.push(deployed.claimPanel.created
      ? '✅ สร้าง/อัปเดตพาเนลเคลมตำนานของเควสนี้แล้ว'
      : '✅ รีเฟรชพาเนลเคลมตำนานของเควสนี้แล้ว');
  }

  await interaction.editReply({ content: messages.join('\n') });
}

async function showPlayerQuestPreview(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  const { buildCurrentQuestEmbed, buildCurrentQuestImageEmbeds } = require('../builders/embeds/currentQuest.embed');
  const preview = buildCurrentQuestEmbed({
    professionCode: bundle.quest.profession_code || bundle.quest.category_code,
    profession: { profession_name_th: bundle.quest.profession_name_th, icon_emoji: bundle.quest.icon_emoji },
    quest: bundle.quest,
    requirements: bundle.requirements,
    rewards: bundle.rewards,
    guideMedia: bundle.images,
    completedAllMain: false
  });
  await interaction.reply({ embeds: [preview, ...buildCurrentQuestImageEmbeds(bundle.images, 'รูปตัวอย่างเควส', 8, bundle.quest)], ephemeral: true });
}

module.exports = {
  refreshAdminPanel,
  renderAdminHome,
  renderPanelManagement,
  renderMasterHome,
  renderProfessionPicker,
  renderLevelPicker,
  renderQuestList,
  renderCategoryQuestList,
  renderQuestDetail,
  renderQuestImageManager,
  renderRequirementEditor,
  renderRewardEditor,
  showBulkRequirementModal,
  showBulkRewardModal,
  renderQuestSearchResults,
  renderPanelStatus,
  toggleQuestActiveAndRender,
  showQuestDescriptionModal,
  showEditRequirementModal,
  showAddRequirementModal,
  showEditRewardModal,
  showAddRewardModal,
  saveQuestDescriptionFromModal,
  saveQuestRequirementFromModal,
  addQuestRequirementFromModal,
  saveQuestRequirementBulkFromModal,
  saveQuestRewardFromModal,
  addQuestRewardFromModal,
  saveQuestRewardBulkFromModal,
  addQuestImageFromModal,
  removeQuestImageAndRender,
  showCreateQuestModal,
  showCreateGlobalQuestModal,
  saveCreateQuestFromModal,
  showQuestScheduleModal,
  saveQuestScheduleFromModal,
  deployQuestPanelAndRender,
  showPlayerQuestPreview,
  deployQuestRelatedPanels,
  renderDependencyEditor,
  saveDependencySelection,
  renderStepManager,
  renderStepDetail,
  showAddStepModal,
  showEditStepModal,
  saveStepFromModal,
  toggleStepActiveAndRender,
  renderStepImageManager,
  addStepImageFromModal,
  removeStepImageAndRender,
  showAddStepImageModal
};
