const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const {
  searchQuests,
  createQuest,
  updateQuestDescription,
  addRequirement,
  updateRequirement,
  addReward,
  updateReward,
  addGuideImage
} = require('../../db/queries/questMaster.repo');
const { buildQuestDetailView } = require('../../services/adminPanel.service');
const { insertAuditLog } = require('../../db/queries/audit.repo');
const { isQuestAdmin } = require('../../utils/permission');

function toNullableInt(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function ensureAdmin(interaction) {
  const ok = await isQuestAdmin(interaction.member);
  if (!ok) {
    await interaction.reply({ content: 'คุณไม่มีสิทธิ์ใช้งานเมนูแอดมิน', flags: 64 });
    return false;
  }
  return true;
}

async function handleAdminModal(interaction) {
  if (!await ensureAdmin(interaction)) return;

  const parts = interaction.customId.split(':');
  const action = parts[2];
  const questId = parts[3] || null;
  const targetId = parts[4] || null;

  if (action === 'modal_search_quest') {
    const keyword = interaction.fields.getTextInputValue('value').trim();
    const quests = await searchQuests(keyword);
    if (!quests.length) {
      await interaction.reply({ content: `ไม่พบเควสที่ค้นหาด้วยคำว่า: ${keyword}`, flags: 64 });
      return;
    }

    await interaction.reply({
      content: `พบ ${quests.length} เควสจากคำค้นหา **${keyword}**`,
      components: [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('quest:admin:search_result')
          .setPlaceholder('เลือกเควสที่ต้องการเปิด')
          .addOptions(quests.slice(0, 25).map((quest) => ({
            label: quest.quest_code.slice(0, 100),
            value: quest.quest_id,
            description: `${quest.quest_name}`.slice(0, 100)
          })))
      )],
      flags: 64
    });
    return;
  }

  if (action === 'modal_create_quest') {
    const questIdCreated = await createQuest({
      professionCode: interaction.fields.getTextInputValue('profession_code').trim().toUpperCase(),
      questLevel: toNullableInt(interaction.fields.getTextInputValue('quest_level'), 1),
      questCode: interaction.fields.getTextInputValue('quest_code').trim().toUpperCase(),
      questName: interaction.fields.getTextInputValue('quest_name').trim(),
      questDescription: interaction.fields.getTextInputValue('quest_description').trim(),
      displayOrder: 0,
      isStepQuest: false,
      requiresTicket: false,
      isRepeatable: false,
      dependencyQuestId: null,
      panelTitle: null,
      panelDescription: null,
      buttonLabel: 'ส่งเควส',
      adminNote: null
    }, interaction.user.id);

    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_CREATED', target: questIdCreated, meta: { questCode: interaction.fields.getTextInputValue('quest_code') } });
    await interaction.reply({ content: '✅ สร้างเควสเรียบร้อยแล้ว', flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(questIdCreated)), flags: 64 });
    return;
  }

  if (action === 'modal_edit_description' && questId) {
    await updateQuestDescription(questId, {
      questName: interaction.fields.getTextInputValue('quest_name').trim(),
      questDescription: interaction.fields.getTextInputValue('quest_description').trim(),
      panelTitle: interaction.fields.getTextInputValue('panel_title').trim(),
      panelDescription: interaction.fields.getTextInputValue('quest_description').trim(),
      buttonLabel: interaction.fields.getTextInputValue('button_label').trim(),
      adminNote: interaction.fields.getTextInputValue('admin_note').trim()
    }, interaction.user.id);

    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_DESCRIPTION_UPDATED', target: questId, meta: {} });
    await interaction.reply({ content: '✅ บันทึกคำอธิบายเควสเรียบร้อยแล้ว', flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(questId)), flags: 64 });
    return;
  }

  if (action === 'modal_add_requirement' && questId) {
    await addRequirement(questId, {
      requirementType: interaction.fields.getTextInputValue('requirement_type').trim().toUpperCase(),
      itemCode: null,
      itemName: interaction.fields.getTextInputValue('item_name').trim(),
      requiredQuantity: toNullableInt(interaction.fields.getTextInputValue('required_quantity'), 1),
      inputLabel: interaction.fields.getTextInputValue('item_name').trim(),
      displayText: interaction.fields.getTextInputValue('display_text').trim(),
      adminDisplayText: null,
      sortOrder: toNullableInt(interaction.fields.getTextInputValue('sort_order'), 1)
    }, interaction.user.id);

    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_REQUIREMENT_ADDED', target: questId, meta: {} });
    await interaction.reply({ content: '✅ เพิ่มของที่ต้องส่งเรียบร้อยแล้ว', flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(questId)), flags: 64 });
    return;
  }

  if (action === 'modal_edit_requirement' && questId && targetId) {
    await updateRequirement(targetId, {
      requirementType: interaction.fields.getTextInputValue('requirement_type').trim().toUpperCase(),
      itemCode: null,
      itemName: interaction.fields.getTextInputValue('item_name').trim(),
      requiredQuantity: toNullableInt(interaction.fields.getTextInputValue('required_quantity'), 1),
      inputLabel: interaction.fields.getTextInputValue('item_name').trim(),
      displayText: interaction.fields.getTextInputValue('display_text').trim(),
      adminDisplayText: null,
      sortOrder: toNullableInt(interaction.fields.getTextInputValue('sort_order'), 1)
    }, interaction.user.id);

    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_REQUIREMENT_UPDATED', target: questId, meta: { requirementId: targetId } });
    await interaction.reply({ content: '✅ แก้ของที่ต้องส่งเรียบร้อยแล้ว', flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(questId)), flags: 64 });
    return;
  }

  if (action === 'modal_add_reward' && questId) {
    const rewardType = interaction.fields.getTextInputValue('reward_type').trim().toUpperCase();
    const valueNumber = toNullableInt(interaction.fields.getTextInputValue('reward_value_number'), 0);
    await addReward(questId, {
      rewardType,
      rewardValueText: rewardType === 'DISCORD_ROLE' ? interaction.fields.getTextInputValue('reward_item_name').trim() : null,
      rewardValueNumber: valueNumber,
      rewardItemCode: null,
      rewardItemName: interaction.fields.getTextInputValue('reward_item_name').trim(),
      rewardQuantity: rewardType === 'SCUM_ITEM' ? valueNumber : null,
      discordRoleId: null,
      discordRoleName: rewardType === 'DISCORD_ROLE' ? interaction.fields.getTextInputValue('reward_item_name').trim() : null,
      rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
      sortOrder: toNullableInt(interaction.fields.getTextInputValue('sort_order'), 1)
    }, interaction.user.id);

    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_REWARD_ADDED', target: questId, meta: {} });
    await interaction.reply({ content: '✅ เพิ่มรางวัลเรียบร้อยแล้ว', flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(questId)), flags: 64 });
    return;
  }

  if (action === 'modal_edit_reward' && questId && targetId) {
    const rewardType = interaction.fields.getTextInputValue('reward_type').trim().toUpperCase();
    const valueNumber = toNullableInt(interaction.fields.getTextInputValue('reward_value_number'), 0);
    await updateReward(targetId, {
      rewardType,
      rewardValueText: rewardType === 'DISCORD_ROLE' ? interaction.fields.getTextInputValue('reward_item_name').trim() : null,
      rewardValueNumber: valueNumber,
      rewardItemCode: null,
      rewardItemName: interaction.fields.getTextInputValue('reward_item_name').trim(),
      rewardQuantity: rewardType === 'SCUM_ITEM' ? valueNumber : null,
      discordRoleId: null,
      discordRoleName: rewardType === 'DISCORD_ROLE' ? interaction.fields.getTextInputValue('reward_item_name').trim() : null,
      rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
      sortOrder: toNullableInt(interaction.fields.getTextInputValue('sort_order'), 1)
    }, interaction.user.id);

    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_REWARD_UPDATED', target: questId, meta: { rewardId: targetId } });
    await interaction.reply({ content: '✅ แก้รางวัลเรียบร้อยแล้ว', flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(questId)), flags: 64 });
    return;
  }

  if (action === 'modal_add_image' && questId) {
    await addGuideImage(questId, {
      mediaUrl: interaction.fields.getTextInputValue('media_url').trim(),
      mediaTitle: interaction.fields.getTextInputValue('media_title').trim(),
      mediaDescription: interaction.fields.getTextInputValue('media_description').trim(),
      displayOrder: toNullableInt(interaction.fields.getTextInputValue('display_order'), 1)
    }, interaction.user.id);

    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_IMAGE_ADDED', target: questId, meta: {} });
    await interaction.reply({ content: '✅ เพิ่มรูปตัวอย่างเรียบร้อยแล้ว', flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(questId)), flags: 64 });
    return;
  }

  await interaction.reply({ content: 'ยังไม่รองรับฟอร์มนี้', flags: 64 });
}

module.exports = {
  handleAdminModal
};
