const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');
const {
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
  buildPanelStatusPayload
} = require('../../services/adminPanel.service');
const {
  findQuestDetailById,
  findRequirementById,
  findRewardById,
  toggleQuestActive
} = require('../../db/queries/adminPanel.repo');
const { buildAdminSearchQuestModal } = require('../../builders/modals/adminSearchQuest.modal');
const { buildAdminEditQuestDescriptionModal } = require('../../builders/modals/adminEditQuestDescription.modal');
const { buildAdminEditRequirementModal } = require('../../builders/modals/adminEditRequirement.modal');
const { buildAdminEditRewardModal } = require('../../builders/modals/adminEditReward.modal');
const { buildAdminAddQuestImageModal } = require('../../builders/modals/adminAddQuestImage.modal');
const { logAdminAudit } = require('../../services/adminAudit.service');

async function updateWith(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    return interaction.followUp({ ...payload, ephemeral: true });
  }
  return interaction.update(payload);
}

function parseButton(customId) {
  const parts = customId.split(':');
  return {
    action: parts[2] || null,
    arg1: parts[3] || null,
    arg2: parts[4] || null
  };
}

async function handleAdminButtons(interaction) {
  const { customId } = interaction;
  const { action, arg1, arg2 } = parseButton(customId);

  if (action === 'home') {
    await interaction.update(await buildAdminHomePayload());
    return;
  }

  if (action === 'panel_home') {
    await interaction.update(await buildPanelManagementPayload());
    return;
  }

  if (action === 'master_home') {
    await interaction.update(await buildMasterHomePayload());
    return;
  }

  if (action === 'deploy_panels') {
    await autoDeployAdminPanel(interaction.client);
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '✅ ส่งและอัปเดตพาเนลผู้เล่นเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (action === 'refresh_panels' || action === 'repair_panels' || action === 'refresh_current_view') {
    await deployProfessionPanels(interaction.client);
    await interaction.reply({ content: '✅ ดำเนินการเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (action === 'panel_status') {
    await interaction.update(await buildPanelStatusPayload());
    return;
  }

  if (action === 'browse_quest') {
    await interaction.update(await buildProfessionPickerPayload());
    return;
  }

  if (action === 'back_levels' && arg1) {
    await interaction.update(await buildLevelPickerPayload(arg1));
    return;
  }

  if (action === 'quest_detail' && arg1) {
    await interaction.update(await buildQuestDetailPayload(arg1));
    return;
  }

  if (action === 'view_requirements' && arg1) {
    await interaction.update(await buildQuestRequirementsPayload(arg1));
    return;
  }

  if (action === 'view_rewards' && arg1) {
    await interaction.update(await buildQuestRewardsPayload(arg1));
    return;
  }

  if (action === 'view_dependency' && arg1) {
    await interaction.update(await buildQuestDependenciesPayload(arg1));
    return;
  }

  if (action === 'view_images' && arg1) {
    await interaction.update(await buildQuestImagesPayload(arg1, Number(arg2 || 0)));
    return;
  }

  if (action === 'search_quest') {
    await interaction.showModal(buildAdminSearchQuestModal());
    return;
  }

  if (action === 'edit_description' && arg1) {
    const quest = await findQuestDetailById(arg1);
    await interaction.showModal(buildAdminEditQuestDescriptionModal(quest));
    return;
  }

  if (action === 'pick_requirement' && arg1) {
    await interaction.update(await buildQuestRequirementsPayload(arg1));
    return;
  }

  if (action === 'pick_reward' && arg1) {
    await interaction.update(await buildQuestRewardsPayload(arg1));
    return;
  }

  if (action === 'add_image' && arg1) {
    await interaction.showModal(buildAdminAddQuestImageModal(arg1));
    return;
  }

  if (action === 'toggle_active' && arg1) {
    const updated = await toggleQuestActive(arg1);
    await logAdminAudit({
      action_type: 'QUEST_ACTIVE_TOGGLED',
      actor_discord_id: interaction.user.id,
      actor_discord_tag: interaction.user.tag,
      quest_id: arg1,
      target_table: 'tb_quest_master',
      target_id: arg1,
      after_json: updated
    });
    await interaction.update(await buildQuestDetailPayload(arg1));
    await interaction.followUp({ content: `✅ เปลี่ยนสถานะเควสเป็น ${updated.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} แล้ว`, ephemeral: true });
    return;
  }

  if (action === 'create_quest') {
    await interaction.reply({ content: '🛠️ ปุ่มสร้างเควสใหม่จะทำต่อใน phase ถัดไป ตอนนี้เน้นแก้ไข quest เดิมก่อน', ephemeral: true });
    return;
  }

  if (action === 'edit_dependency') {
    await interaction.reply({ content: '🧩 ปุ่มแก้ Dependency เตรียมไว้แล้ว แต่ยังไม่ได้เปิดใช้งานในชุดนี้', ephemeral: true });
    return;
  }

  await interaction.reply({ content: 'ยังไม่รองรับปุ่มนี้ในเวอร์ชันปัจจุบัน', ephemeral: true });
}

module.exports = {
  handleAdminButtons
};
