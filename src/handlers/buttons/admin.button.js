const { logger } = require('../../config/logger');
const { deployProfessionPanels } = require('../../services/panelAutoDeploy.service');
const { isQuestAdmin } = require('../../utils/permission');
const {
  buildAdminHomePayload,
  buildPanelManagementPayload,
  buildMasterHomePayload,
  buildBrowseProfessionPayload,
  buildBrowseLevelPayload,
  buildQuestDetailPayload,
  buildRequirementsPayload,
  buildRewardsPayload,
  buildDependenciesPayload,
  buildImagesPayload,
  buildPanelStatusPayload,
  buildEditPlaceholderPayload
} = require('../../services/adminPanel.service');
const { buildAdminSearchQuestModal } = require('../../builders/modals/adminSearchQuest.modal');

function getExtra(customId) {
  return customId.split(':').slice(3);
}

async function ensureAdmin(interaction) {
  const allowed = await isQuestAdmin(interaction.member);
  if (allowed) return true;

  const payload = { content: 'คุณไม่มีสิทธิ์ใช้หน้าจัดการแอดมิน', flags: 64 };
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
  return false;
}

async function handleAdminButtons(interaction) {
  if (!(await ensureAdmin(interaction))) return;

  const { customId } = interaction;

  if (customId === 'quest:admin:home') {
    await interaction.update(await buildAdminHomePayload());
    return;
  }

  if (customId === 'quest:admin:panel_home') {
    await interaction.update(await buildPanelManagementPayload());
    return;
  }

  if (customId === 'quest:admin:master_home') {
    await interaction.update(await buildMasterHomePayload());
    return;
  }

  if (customId === 'quest:admin:master_browse') {
    await interaction.update(await buildBrowseProfessionPayload());
    return;
  }

  if (customId === 'quest:admin:master_search') {
    await interaction.showModal(buildAdminSearchQuestModal());
    return;
  }

  if (customId === 'quest:admin:panel_deploy_players') {
    await interaction.deferReply({ flags: 64 });
    await deployProfessionPanels(interaction.client);
    await interaction.editReply({ content: '✅ ส่ง/อัปเดตพาเนลผู้เล่นตาม config เรียบร้อยแล้ว' });
    return;
  }

  if (customId === 'quest:admin:panel_refresh_players') {
    await interaction.deferReply({ flags: 64 });
    await deployProfessionPanels(interaction.client);
    await interaction.editReply({ content: '♻️ รีเฟรชพาเนลผู้เล่นเรียบร้อยแล้ว' });
    return;
  }

  if (customId === 'quest:admin:panel_status') {
    await interaction.update(await buildPanelStatusPayload());
    return;
  }

  if (customId.startsWith('quest:admin:browse_levels:')) {
    const [, professionId] = getExtra(customId);
    await interaction.update(await buildBrowseLevelPayload(professionId));
    return;
  }

  if (customId.startsWith('quest:admin:quest_detail:')) {
    const [questId] = getExtra(customId);
    await interaction.update(await buildQuestDetailPayload(questId));
    return;
  }

  if (customId.startsWith('quest:admin:quest_requirements:')) {
    const [questId] = getExtra(customId);
    await interaction.update(await buildRequirementsPayload(questId));
    return;
  }

  if (customId.startsWith('quest:admin:quest_rewards:')) {
    const [questId] = getExtra(customId);
    await interaction.update(await buildRewardsPayload(questId));
    return;
  }

  if (customId.startsWith('quest:admin:quest_dependency:')) {
    const [questId] = getExtra(customId);
    await interaction.update(await buildDependenciesPayload(questId));
    return;
  }

  if (customId.startsWith('quest:admin:quest_images:')) {
    const [questId] = getExtra(customId);
    await interaction.update(await buildImagesPayload(questId));
    return;
  }

  if (customId.startsWith('quest:admin:quest_edit_placeholder:')) {
    const [questId] = getExtra(customId);
    await interaction.update(await buildEditPlaceholderPayload(questId));
    return;
  }

  logger.warn(`Unhandled admin button: ${customId}`);
  await interaction.reply({ content: 'ยังไม่รองรับปุ่มนี้', flags: 64 });
}

module.exports = {
  handleAdminButtons,
  ensureAdmin
};
