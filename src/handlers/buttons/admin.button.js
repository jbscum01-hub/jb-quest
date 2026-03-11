const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');
const {
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
} = require('../../services/adminPanel.service');
const { isQuestAdmin } = require('../../utils/permission');
const { createAdminAuditLog } = require('../../db/queries/adminAudit.repo');

async function ensureQuestAdmin(interaction) {
  const allowed = await isQuestAdmin(interaction.member);

  if (!allowed) {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '❌ เฉพาะ Quest Admin เท่านั้น',
        flags: 64
      });
      return false;
    }

    await interaction.reply({
      content: '❌ เฉพาะ Quest Admin เท่านั้น',
      flags: 64
    });
    return false;
  }

  return true;
}

async function logAction(interaction, actionType, extra = {}) {
  try {
    await createAdminAuditLog({
      actionType,
      actorDiscordId: interaction.user.id,
      actorDiscordTag: interaction.user.tag,
      ...extra
    });
  } catch (error) {
    console.error('createAdminAuditLog failed', error);
  }
}

function extractExtraParts(customId) {
  return customId.split(':').slice(3);
}

async function handleAdminButtons(interaction) {
  if (!(await ensureQuestAdmin(interaction))) {
    return;
  }

  const { customId } = interaction;

  if (customId === 'quest:admin:home') {
    await renderAdminHome(interaction);
    return;
  }

  if (customId === 'quest:admin:panel_home') {
    await renderPanelManagement(interaction);
    return;
  }

  if (customId === 'quest:admin:master_home') {
    await renderMasterHome(interaction);
    return;
  }

  if (customId === 'quest:admin:deploy_panels') {
    await autoDeployAdminPanel(interaction.client);
    await deployProfessionPanels(interaction.client);
    await refreshAdminPanel(interaction.message);

    await interaction.reply({
      content: '✅ Deploy Player Panels เรียบร้อยแล้ว',
      flags: 64
    });

    await logAction(interaction, 'PANEL_DEPLOYED');
    return;
  }

  if (customId === 'quest:admin:refresh_panels') {
    await refreshAdminPanel(interaction.message);
    await deployProfessionPanels(interaction.client);

    await interaction.reply({
      content: '✅ Refresh Player Panels เรียบร้อยแล้ว',
      flags: 64
    });

    await logAction(interaction, 'PANEL_REFRESHED');
    return;
  }

  if (customId === 'quest:admin:repair_panels') {
    await deployProfessionPanels(interaction.client);

    await interaction.reply({
      content: '✅ Repair Missing Panels เรียบร้อยแล้ว',
      flags: 64
    });

    await logAction(interaction, 'PANEL_REPAIRED');
    return;
  }

  if (customId === 'quest:admin:refresh_current_quest_view') {
    await interaction.reply({
      content: 'ℹ️ ปุ่มนี้เตรียมไว้แล้ว ตอนนี้ใช้ refresh profession panels ไปก่อน',
      flags: 64
    });

    await logAction(interaction, 'PANEL_CURRENT_QUEST_REFRESH_REQUESTED');
    return;
  }

  if (customId === 'quest:admin:panel_status') {
    await renderPanelStatus(interaction);
    return;
  }

  if (customId === 'quest:admin:browse_quest') {
    await renderBrowseProfession(interaction);
    return;
  }

  if (customId === 'quest:admin:search_quest') {
    await interaction.reply({
      content: 'ℹ️ Search Quest จะต่อเป็น modal ในรอบถัดไป',
      flags: 64
    });
    return;
  }

  if (customId === 'quest:admin:create_quest') {
    await interaction.reply({
      content: 'ℹ️ Create Quest จะต่อเป็น wizard ในรอบถัดไป',
      flags: 64
    });
    return;
  }

  if (customId.startsWith('quest:admin:browse_levels:')) {
    const [, professionId] = extractExtraParts(customId);
    await renderBrowseLevels(interaction, professionId);
    return;
  }

  if (customId.startsWith('quest:admin:browse_quests:')) {
    const [, professionId, level] = extractExtraParts(customId);
    await renderBrowseQuestList(interaction, professionId, level);
    return;
  }

  if (customId.startsWith('quest:admin:quest_detail:')) {
    const [questId] = extractExtraParts(customId);
    await renderQuestDetail(interaction, questId);
    return;
  }

  if (customId.startsWith('quest:admin:view_requirements:')) {
    const [questId] = extractExtraParts(customId);
    await renderQuestRequirements(interaction, questId);
    return;
  }

  if (customId.startsWith('quest:admin:view_rewards:')) {
    const [questId] = extractExtraParts(customId);
    await renderQuestRewards(interaction, questId);
    return;
  }

  if (customId.startsWith('quest:admin:view_dependency:')) {
    const [questId] = extractExtraParts(customId);
    await renderQuestDependencies(interaction, questId);
    return;
  }

  if (customId.startsWith('quest:admin:view_images:')) {
    const [questId] = extractExtraParts(customId);
    await renderQuestImages(interaction, questId);
    return;
  }

  if (
    customId.startsWith('quest:admin:edit_description:') ||
    customId.startsWith('quest:admin:edit_requirements:') ||
    customId.startsWith('quest:admin:edit_rewards:') ||
    customId.startsWith('quest:admin:edit_dependency:') ||
    customId.startsWith('quest:admin:add_requirement:') ||
    customId.startsWith('quest:admin:add_reward:') ||
    customId.startsWith('quest:admin:add_image:') ||
    customId.startsWith('quest:admin:toggle_active:')
  ) {
    await interaction.reply({
      content: 'ℹ️ ปุ่มแก้ไข / เพิ่มข้อมูล ชุดนี้เตรียม route ไว้แล้ว เดี๋ยวต่อ modal/service ได้ทันที',
      flags: 64
    });
    return;
  }

  await interaction.reply({
    content: 'ไม่พบ action ของ admin panel นี้',
    flags: 64
  });
}

async function handleAdminSelectMenus(interaction) {
  if (!(await ensureQuestAdmin(interaction))) {
    return;
  }

  const { customId, values } = interaction;

  if (customId === 'quest:admin:master_profession_select') {
    const professionId = values[0];
    await renderBrowseLevels(interaction, professionId);
    return;
  }

  if (customId.startsWith('quest:admin:master_level_select:')) {
    const professionId = customId.split(':')[4];
    const level = values[0];
    await renderBrowseQuestList(interaction, professionId, level);
    return;
  }

  if (customId.startsWith('quest:admin:master_quest_select:')) {
    const questId = values[0];
    await renderQuestDetail(interaction, questId);
    return;
  }

  await interaction.reply({
    content: 'ยังไม่รองรับ select menu นี้',
    flags: 64
  });
}

module.exports = {
  handleAdminButtons,
  handleAdminSelectMenus
};
