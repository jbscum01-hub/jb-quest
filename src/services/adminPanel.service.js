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
const { buildQuestCommandBulkModal } = require('../builders/modals/adminQuestCommandBulk.modal');
const { buildQuestRoleRewardModal } = require('../builders/modals/adminQuestRoleReward.modal');
const { buildQuestFameModal } = require('../builders/modals/adminQuestFame.modal');
const { buildQuestImageModal, buildStepImageModal } = require('../builders/modals/adminQuestImage.modal');
const { buildCreateQuestModal } = require('../builders/modals/adminCreateQuest.modal');
const { buildQuestScheduleModal } = require('../builders/modals/adminQuestSchedule.modal');
const { buildStepModal } = require('../builders/modals/adminStep.modal');
const { buildCurrentQuestEmbed, buildCurrentQuestImageEmbeds } = require('../builders/embeds/currentQuest.embed');
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
  updateQuestFameSettings,
  addQuestGuideImage,
  deactivateQuestGuideImage,
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
  const allowed = ['SCUM_ITEM', 'DISCORD_ROLE'];
  if (!allowed.includes(value)) throw new Error(`ประเภทรางวัลต้องเป็น ${allowed.join(' / ')}`);
  return value;
}

function parseNonNegativeIntegerOrNull(raw, fieldName) {
  const value = String(raw || '').trim();
  if (!value || value === '0') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} ต้องเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป`);
  }
  return parsed;
}

function parseBulkLines(raw) {
  return String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function parseRequirementBulkInput(raw) {
  const lines = parseBulkLines(raw);
  return lines.map((line) => ({ displayText: line }));
}

function parseRewardBulkInput(raw) {
  const lines = parseBulkLines(raw);
  return lines.map((line) => ({ rewardType: 'SCUM_ITEM', rewardDisplayText: line, rewardSpawnCommandTemplate: null, discordRoleId: null }));
}

function parseCommandBulkInput(raw) {
  return parseBulkLines(raw);
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

async function renderCommandEditor(interaction, questId) {
  return showBulkCommandModal(interaction, questId);
}

async function renderRoleRewardEditor(interaction, questId) {
  return showRoleRewardModal(interaction, questId);
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

async function showBulkCommandModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestCommandBulkModal(bundle));
}

async function showRoleRewardModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestRoleRewardModal(bundle));
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

async function showQuestFameModal(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }
  await interaction.showModal(buildQuestFameModal(bundle.quest));
}

async function renderQuestPreview(interaction, questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    await interaction.reply({ content: 'ไม่พบข้อมูลเควสนี้', ephemeral: true });
    return;
  }

  const embed = buildCurrentQuestEmbed({
    professionCode: bundle.quest.profession_code,
    profession: {
      profession_name_th: bundle.quest.profession_name_th,
      icon_emoji: bundle.quest.icon_emoji
    },
    quest: bundle.quest,
    requirements: bundle.requirements,
    rewards: bundle.rewards,
    guideMedia: bundle.images,
    completedAllMain: false
  });

  await interaction.reply({
    embeds: [embed, ...buildCurrentQuestImageEmbeds(bundle.images, 'รูปตัวอย่างเควส', 8, bundle.quest)],
    ephemeral: true
  });
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
    displayText: interaction.fields.getTextInputValue('display_text').trim()
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(requirement.quest_id));
  await interaction.reply({ content: '✅ บันทึกรายการของที่ต้องส่งเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function addQuestRequirementFromModal(interaction, questId) {
  await addQuestRequirement(questId, {
    displayText: interaction.fields.getTextInputValue('display_text').trim()
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ เพิ่มรายการของที่ต้องส่งเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestRewardFromModal(interaction, rewardId) {
  const reward = await findQuestRewardById(rewardId);
  if (!reward) throw new Error('ไม่พบรางวัลนี้');
  await updateQuestReward(rewardId, {
    rewardType: parseRewardType(interaction.fields.getTextInputValue('reward_type')),
    rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
    rewardSpawnCommandTemplate: interaction.fields.fields?.get('reward_spawn_command_template') ? interaction.fields.getTextInputValue('reward_spawn_command_template').trim() : null,
    discordRoleId: interaction.fields.fields?.get('discord_role_id') ? interaction.fields.getTextInputValue('discord_role_id').trim() : null
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(reward.quest_id));
  await interaction.reply({ content: '✅ บันทึกรางวัลเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function addQuestRewardFromModal(interaction, questId) {
  await addQuestReward(questId, {
    rewardType: parseRewardType(interaction.fields.getTextInputValue('reward_type')),
    rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
    rewardSpawnCommandTemplate: interaction.fields.fields?.get('reward_spawn_command_template') ? interaction.fields.getTextInputValue('reward_spawn_command_template').trim() : null,
    discordRoleId: interaction.fields.fields?.get('discord_role_id') ? interaction.fields.getTextInputValue('discord_role_id').trim() : null
  }, interaction.user.id);

  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ เพิ่มรางวัลเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}


async function saveQuestRequirementBulkFromModal(interaction, questId) {
  const items = parseRequirementBulkInput(interaction.fields.getTextInputValue('bulk_requirement_lines'));
  await replaceQuestRequirementsBulk(questId, items, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ บันทึกของที่ต้องส่งแบบยกชุดเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestRewardBulkFromModal(interaction, questId) {
  const items = parseRewardBulkInput(interaction.fields.getTextInputValue('bulk_reward_lines'));
  await replaceQuestRewardsBulk(questId, items, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ บันทึกรางวัลแบบยกชุดเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestCommandBulkFromModal(interaction, questId) {
  const lines = parseCommandBulkInput(interaction.fields.getTextInputValue('bulk_command_lines'));
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) throw new Error('ไม่พบข้อมูลเควสนี้');

  const itemRewards = (bundle.rewards || []).filter((row) => row.reward_type === 'SCUM_ITEM');
  const roleReward = (bundle.rewards || []).find((row) => row.reward_type === 'DISCORD_ROLE') || null;
  const maxLen = Math.max(itemRewards.length, lines.length);
  const merged = [];

  for (let i = 0; i < maxLen; i += 1) {
    const current = itemRewards[i] || null;
    const commandText = lines[i] || '';
    const displayText = current?.reward_display_text || '';
    if (!displayText && !commandText) continue;
    merged.push({
      rewardType: 'SCUM_ITEM',
      rewardDisplayText: displayText,
      rewardSpawnCommandTemplate: commandText,
      discordRoleId: null
    });
  }

  if (roleReward?.discord_role_id || roleReward?.reward_display_text) {
    merged.push({
      rewardType: 'DISCORD_ROLE',
      rewardDisplayText: roleReward.reward_display_text || '',
      rewardSpawnCommandTemplate: null,
      discordRoleId: roleReward.discord_role_id || null
    });
  }

  await replaceQuestRewardsBulk(questId, merged, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ บันทึกคำสั่งไอเทมเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestRoleRewardFromModal(interaction, questId) {
  const displayText = interaction.fields.getTextInputValue('role_reward_display_text').trim();
  const discordRoleId = interaction.fields.getTextInputValue('discord_role_id').trim();
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) throw new Error('ไม่พบข้อมูลเควสนี้');

  const itemRewards = (bundle.rewards || []).filter((row) => row.reward_type === 'SCUM_ITEM').map((row) => ({
    rewardType: 'SCUM_ITEM',
    rewardDisplayText: row.reward_display_text || '',
    rewardSpawnCommandTemplate: row.reward_spawn_command_template || '',
    discordRoleId: null
  }));

  const merged = [...itemRewards];
  if (displayText || discordRoleId) {
    merged.push({
      rewardType: 'DISCORD_ROLE',
      rewardDisplayText: displayText,
      rewardSpawnCommandTemplate: null,
      discordRoleId: discordRoleId || null
    });
  }

  await replaceQuestRewardsBulk(questId, merged, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: displayText || discordRoleId ? '✅ บันทึก Role Reward เรียบร้อยแล้ว' : '✅ ลบ Role Reward เรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
}

async function saveQuestFameFromModal(interaction, questId) {
  const fameRequiredDisplay = parseNonNegativeIntegerOrNull(
    interaction.fields.getTextInputValue('fame_required_display'),
    'Fame ขั้นต่ำ'
  );
  const fameNote = interaction.fields.getTextInputValue('fame_note').trim();
  await updateQuestFameSettings(questId, { fameRequiredDisplay, fameNote }, interaction.user.id);
  const refreshed = await enrichBundle(await getQuestDetailBundle(questId));
  await interaction.reply({ content: '✅ บันทึก Fame ขั้นต่ำเรียบร้อยแล้ว', ...buildQuestDetailResponse(refreshed), ephemeral: true });
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
    isRepeatable: flags.isRepeatable
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
  renderCommandEditor,
  renderRoleRewardEditor,
  renderQuestPreview,
  renderQuestSearchResults,
  renderPanelStatus,
  toggleQuestActiveAndRender,
  showQuestDescriptionModal,
  showEditRequirementModal,
  showAddRequirementModal,
  showEditRewardModal,
  showAddRewardModal,
  showQuestFameModal,
  saveQuestDescriptionFromModal,
  saveQuestRequirementFromModal,
  addQuestRequirementFromModal,
  saveQuestRequirementBulkFromModal,
  saveQuestRewardFromModal,
  addQuestRewardFromModal,
  saveQuestRewardBulkFromModal,
  saveQuestCommandBulkFromModal,
  saveQuestRoleRewardFromModal,
  saveQuestFameFromModal,
  addQuestImageFromModal,
  removeQuestImageAndRender,
  showCreateQuestModal,
  showCreateGlobalQuestModal,
  saveCreateQuestFromModal,
  showQuestScheduleModal,
  saveQuestScheduleFromModal,
  deployQuestPanelAndRender,
  deployQuestRelatedPanels,
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
