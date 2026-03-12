const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const {
  buildBrowseLevelView,
  buildBrowseQuestView,
  buildQuestDetailView,
  buildImageManagerView
} = require('../../services/adminPanel.service');
const {
  searchQuests,
  findRequirementById,
  findRewardById,
  replaceQuestDependency,
  deactivateGuideImage
} = require('../../db/queries/questMaster.repo');
const { insertAuditLog } = require('../../db/queries/audit.repo');
const { isQuestAdmin } = require('../../utils/permission');

async function ensureAdmin(interaction) {
  const ok = await isQuestAdmin(interaction.member);
  if (!ok) {
    await interaction.reply({ content: 'คุณไม่มีสิทธิ์ใช้งานเมนูแอดมิน', flags: 64 });
    return false;
  }
  return true;
}

async function handleAdminSelect(interaction) {
  if (!await ensureAdmin(interaction)) return;

  const parts = interaction.customId.split(':');
  const action = parts[2];
  const extra = parts[3] || null;
  const value = interaction.values[0];

  if (action === 'select_profession') {
    await interaction.update(await buildBrowseLevelView(value));
    return;
  }

  if (action === 'select_level') {
    await interaction.update(await buildBrowseQuestView(extra, value));
    return;
  }

  if (action === 'select_quest') {
    await interaction.update(await buildQuestDetailView(value));
    return;
  }

  if (action === 'pick_requirement') {
    const requirement = await findRequirementById(value);
    const modal = new ModalBuilder()
      .setCustomId(`quest:admin:modal_edit_requirement:${extra}:${value}`)
      .setTitle('แก้ของที่ต้องส่ง')
      .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('requirement_type').setLabel('ประเภท requirement').setStyle(TextInputStyle.Short).setRequired(true).setValue((requirement.requirement_type || 'SCUM_ITEM').slice(0, 100))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('item_name').setLabel('ชื่อของ / requirement').setStyle(TextInputStyle.Short).setRequired(true).setValue((requirement.item_name || '').slice(0, 100))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_quantity').setLabel('จำนวน').setStyle(TextInputStyle.Short).setRequired(false).setValue(String(requirement.required_quantity || 1))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('display_text').setLabel('ข้อความแสดงผล').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue((requirement.display_text || '').slice(0, 4000))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sort_order').setLabel('ลำดับ').setStyle(TextInputStyle.Short).setRequired(false).setValue(String(requirement.sort_order || 1)))
      );
    await interaction.showModal(modal);
    return;
  }

  if (action === 'pick_reward') {
    const reward = await findRewardById(value);
    const modal = new ModalBuilder()
      .setCustomId(`quest:admin:modal_edit_reward:${extra}:${value}`)
      .setTitle('แก้รางวัล')
      .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_type').setLabel('ประเภทรางวัล').setStyle(TextInputStyle.Short).setRequired(true).setValue((reward.reward_type || 'SCUM_MONEY').slice(0, 100))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_item_name').setLabel('ชื่อรางวัล').setStyle(TextInputStyle.Short).setRequired(false).setValue((reward.reward_item_name || '').slice(0, 100))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_value_number').setLabel('ตัวเลขรางวัล').setStyle(TextInputStyle.Short).setRequired(false).setValue(String(reward.reward_value_number || reward.reward_quantity || 0))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_display_text').setLabel('ข้อความแสดงผล').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue((reward.reward_display_text || '').slice(0, 4000))),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sort_order').setLabel('ลำดับ').setStyle(TextInputStyle.Short).setRequired(false).setValue(String(reward.sort_order || 1)))
      );
    await interaction.showModal(modal);
    return;
  }

  if (action === 'pick_dependency') {
    await replaceQuestDependency(extra, value === 'NONE' ? null : value, interaction.user.id);
    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_DEPENDENCY_UPDATED', target: extra, meta: { requiredQuestId: value === 'NONE' ? null : value } });
    await interaction.update(await buildQuestDetailView(extra));
    return;
  }

  if (action === 'pick_remove_image') {
    await deactivateGuideImage(value, interaction.user.id);
    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_IMAGE_REMOVED', target: extra, meta: { mediaId: value } });
    await interaction.update(await buildImageManagerView(extra));
    return;
  }

  if (action === 'search_result') {
    await interaction.update(await buildQuestDetailView(value));
    return;
  }

  await interaction.reply({ content: 'ยังไม่รองรับเมนูเลือกนี้', flags: 64 });
}

module.exports = {
  handleAdminSelect
};
