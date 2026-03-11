const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { buildAdminPanelEmbed, buildPanelManagementEmbed, buildMasterHomeEmbed } = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminPanelButtons,
  buildPanelManagementButtons,
  buildMasterHomeButtons,
  buildProfessionSelect,
  buildLevelSelect,
  buildQuestSelect,
  buildQuestDetailButtons,
  buildBackButtons
} = require('../builders/components/adminPanel.components');
const {
  findActiveProfessions,
  findProfessionById,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findQuestById,
  findQuestRequirements,
  findQuestRewards,
  findQuestDependencies,
  findQuestImages,
  findQuestSteps,
  findRequirementById,
  findRewardById
} = require('../db/queries/adminQuestEdit.repo');
const {
  updateQuestDescriptionWithAudit,
  createQuestWithAudit,
  addRequirementWithAudit,
  updateRequirementWithAudit,
  addRewardWithAudit,
  updateRewardWithAudit,
  replaceDependencyWithAudit,
  addImageWithAudit,
  toggleQuestActiveWithAudit
} = require('./adminQuestEdit.service');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  getGlobalConfigValue,
  getAdminPanelMessageId
} = require('./discordConfig.service');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

function replyTarget(interaction) {
  return interaction.deferred || interaction.replied
    ? (payload) => interaction.editReply(payload)
    : (payload) => interaction.update(payload);
}

function buildListEmbed(title, color, description, lines) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields({
      name: 'รายละเอียด',
      value: lines.length ? lines.join('\n').slice(0, 1024) : 'ไม่มีข้อมูล'
    })
    .setTimestamp();
}

function toNullableInt(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function toBool(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
}

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  });
}

async function renderAdminHome(target) {
  return target.editReply
    ? target.editReply({ embeds: [buildAdminPanelEmbed()], components: buildAdminPanelButtons() })
    : target.edit({ embeds: [buildAdminPanelEmbed()], components: buildAdminPanelButtons() });
}

async function showPanelManagement(interaction) {
  const send = replyTarget(interaction);
  return send({ embeds: [buildPanelManagementEmbed()], components: buildPanelManagementButtons() });
}

async function showMasterHome(interaction) {
  const send = replyTarget(interaction);
  return send({ embeds: [buildMasterHomeEmbed()], components: buildMasterHomeButtons() });
}

async function showProfessionBrowse(interaction) {
  const professions = await findActiveProfessions();
  const send = replyTarget(interaction);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🗂️ เลือกสายอาชีพ')
    .setDescription('เลือกสายอาชีพด้านล่าง แล้วระบบจะพาไปเลือกระดับเควสต่อ')
    .addFields({
      name: 'สายที่ใช้งานได้',
      value: professions.map((item) => `• ${item.profession_name_th} (${item.profession_code})`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();

  return send({
    embeds: [embed],
    components: [...buildProfessionSelect(professions), ...buildBackButtons('quest:admin:master_home')]
  });
}

async function showLevelBrowse(interaction, professionId) {
  const [profession, levels] = await Promise.all([
    findProfessionById(professionId),
    findQuestLevelsByProfession(professionId)
  ]);
  if (!profession) throw new Error('ไม่พบข้อมูลสายอาชีพ');

  const send = replyTarget(interaction);
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`🧭 เลือกระดับเควส · ${profession.profession_name_th}`)
    .setDescription('เลือกระดับที่ต้องการ แล้วระบบจะแสดงรายการเควสในระดับนั้น')
    .addFields({
      name: 'ระดับที่พบ',
      value: levels.map((item) => `• Lv.${item.quest_level} (${item.quest_count} เควส)`).join('\n') || '-'
    })
    .setTimestamp();

  return send({
    embeds: [embed],
    components: levels.length
      ? [...buildLevelSelect(professionId, levels), ...buildBackButtons('quest:admin:browse_start')]
      : buildBackButtons('quest:admin:browse_start')
  });
}

async function showQuestBrowse(interaction, professionId, level) {
  const [profession, quests] = await Promise.all([
    findProfessionById(professionId),
    findQuestsByProfessionAndLevel(professionId, level)
  ]);
  if (!profession) throw new Error('ไม่พบข้อมูลสายอาชีพ');

  const send = replyTarget(interaction);
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📚 เลือกเควส · ${profession.profession_name_th} · Lv.${level}`)
    .setDescription('เมื่อเลือกเควสแล้ว ระบบจะพาไปหน้า Quest Detail ของเควสนั้นทันที')
    .addFields({
      name: 'รายการเควส',
      value: quests.map((quest) => `• ${quest.quest_code} — ${quest.quest_name}`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();

  return send({
    embeds: [embed],
    components: quests.length
      ? [...buildQuestSelect(professionId, level, quests), ...buildBackButtons('quest:admin:browse_start')]
      : buildBackButtons('quest:admin:browse_start')
  });
}

async function showQuestDetail(interaction, questId) {
  const [quest, requirements, rewards, dependencies, images, steps] = await Promise.all([
    findQuestById(questId),
    findQuestRequirements(questId),
    findQuestRewards(questId),
    findQuestDependencies(questId),
    findQuestImages(questId),
    findQuestSteps(questId)
  ]);

  if (!quest) throw new Error('ไม่พบเควสที่เลือก');

  const dependencyText = dependencies.length
    ? dependencies.map((dep) => {
        if (dep.dependency_type === 'PREVIOUS_QUEST') return `• ผ่านเควสก่อนหน้า: ${dep.required_quest_code || dep.required_quest_id}`;
        if (dep.dependency_type === 'MAIN_LEVEL') return `• ต้องมี Main Level อย่างน้อย Lv.${dep.required_level}`;
        if (dep.dependency_type === 'ROLE') return `• ต้องมี Role: ${dep.required_role_name || dep.required_role_id}`;
        return `• ${dep.dependency_type}`;
      }).join('\n')
    : 'ไม่มี';

  const embed = new EmbedBuilder()
    .setColor(quest.is_active ? 0x57f287 : 0xed4245)
    .setTitle(`📘 ${quest.quest_name}`)
    .setDescription([
      `**รหัสเควส:** ${quest.quest_code}`,
      `**สายอาชีพ:** ${quest.profession_name_th || '-'} (${quest.profession_code || '-'})`,
      `**ระดับ:** Lv.${quest.quest_level ?? '-'}`,
      `**สถานะ:** ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
      `**ประเภท:** ${quest.is_step_quest ? 'Step Quest' : 'Quest ปกติ'}${quest.requires_ticket ? ' • ใช้ Ticket' : ''}${quest.is_repeatable ? ' • ทำซ้ำได้' : ''}`,
      '',
      `**คำอธิบาย:** ${quest.quest_description || quest.panel_description || '-'}`,
      '',
      'จากหน้านี้แอดมินจะเห็นชัดว่า “กำลังแก้เควสไหนอยู่” แล้วค่อยเลือกปุ่มที่เกี่ยวข้องด้านล่าง'
    ].join('\n'))
    .addFields(
      { name: 'เงื่อนไขปลดล็อก', value: dependencyText.slice(0, 1024) || 'ไม่มี', inline: false },
      { name: 'ของที่ต้องส่ง', value: String(requirements.length), inline: true },
      { name: 'รางวัล', value: String(rewards.length), inline: true },
      { name: 'รูปตัวอย่าง', value: String(images.length), inline: true },
      { name: 'ขั้นตอน', value: String(steps.length), inline: true }
    )
    .setFooter({ text: `Quest ID: ${quest.quest_id}` })
    .setTimestamp();

  const send = replyTarget(interaction);
  return send({ embeds: [embed], components: buildQuestDetailButtons(questId, steps.length > 0) });
}

async function showRequirements(interaction, questId) {
  const [quest, requirements] = await Promise.all([findQuestById(questId), findQuestRequirements(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [buildListEmbed(`📦 ของที่ต้องส่ง · ${quest.quest_name}`, 0x5865f2, `เควสนี้มี requirement ทั้งหมด ${requirements.length} รายการ`, requirements.map((row, idx) => `• ${idx + 1}. ${row.item_name || row.display_text || row.requirement_type}${row.required_quantity ? ` x${row.required_quantity}` : ''}`))],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showRewards(interaction, questId) {
  const [quest, rewards] = await Promise.all([findQuestById(questId), findQuestRewards(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [buildListEmbed(`🎁 รางวัล · ${quest.quest_name}`, 0x57f287, `เควสนี้มี reward ทั้งหมด ${rewards.length} รายการ`, rewards.map((row, idx) => `• ${idx + 1}. ${row.reward_display_text || row.reward_item_name || row.reward_type}${row.reward_quantity ? ` x${row.reward_quantity}` : row.reward_value_number ? ` (${row.reward_value_number})` : ''}`))],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showDependencies(interaction, questId) {
  const [quest, dependencies] = await Promise.all([findQuestById(questId), findQuestDependencies(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [buildListEmbed(`🔓 เงื่อนไขปลดล็อก · ${quest.quest_name}`, 0xfaa61a, 'แสดง dependency ของเควสนี้เท่านั้น', dependencies.map((dep, idx) => {
      if (dep.dependency_type === 'PREVIOUS_QUEST') return `• ${idx + 1}. ผ่าน ${dep.required_quest_code || '-'} ${dep.required_quest_name || ''}`.trim();
      if (dep.dependency_type === 'MAIN_LEVEL') return `• ${idx + 1}. ต้องมี Main Level Lv.${dep.required_level}`;
      if (dep.dependency_type === 'ROLE') return `• ${idx + 1}. ต้องมี Role ${dep.required_role_name || dep.required_role_id}`;
      return `• ${idx + 1}. ${dep.dependency_type}`;
    }))],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showImages(interaction, questId) {
  const [quest, images] = await Promise.all([findQuestById(questId), findQuestImages(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [buildListEmbed(`🖼️ รูปตัวอย่าง · ${quest.quest_name}`, 0xeb459e, 'ใช้หน้านี้เช็กว่ารูปตัวอย่างของเควสถูกใส่ไว้ครบหรือยัง', images.map((image, idx) => `• ${idx + 1}. ${image.media_title || 'ไม่มีชื่อ'}${image.media_description ? ` — ${image.media_description}` : ''}\n${image.media_url}`))],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showSteps(interaction, questId) {
  const [quest, steps] = await Promise.all([findQuestById(questId), findQuestSteps(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [buildListEmbed(`🪜 ขั้นตอน Lv6 · ${quest.quest_name}`, 0xfee75c, `เควสนี้มี step ทั้งหมด ${steps.length} ขั้น`, steps.map((step) => `• Step ${step.step_no} — ${step.step_title}${step.step_description ? `\n${step.step_description}` : ''}`))],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showRequirementEditor(interaction, questId) {
  const [quest, requirements] = await Promise.all([findQuestById(questId), findQuestRequirements(questId)]);
  if (!requirements.length) {
    await interaction.reply({ content: 'เควสนี้ยังไม่มี requirement ให้แก้ไข ให้กดปุ่ม "เพิ่มของที่ต้องส่ง" ก่อน', ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_requirement_edit:${questId}`)
    .setPlaceholder('เลือก requirement ที่ต้องการแก้')
    .addOptions(
      requirements.slice(0, 25).map((row) => ({
        label: `${row.item_name || row.requirement_type}`.slice(0, 100),
        description: `${row.display_text || '-'}${row.required_quantity ? ` x${row.required_quantity}` : ''}`.slice(0, 100),
        value: row.requirement_id
      }))
    );

  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`🛠️ แก้ของที่ต้องส่ง · ${quest.quest_name}`).setDescription('เลือก requirement ที่ต้องการแก้ไขจากรายการด้านล่าง')],
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true
  });
}

async function showRewardEditor(interaction, questId) {
  const [quest, rewards] = await Promise.all([findQuestById(questId), findQuestRewards(questId)]);
  if (!rewards.length) {
    await interaction.reply({ content: 'เควสนี้ยังไม่มี reward ให้แก้ไข ให้กดปุ่ม "เพิ่มรางวัล" ก่อน', ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_reward_edit:${questId}`)
    .setPlaceholder('เลือกรางวัลที่ต้องการแก้')
    .addOptions(
      rewards.slice(0, 25).map((row) => ({
        label: `${row.reward_item_name || row.reward_type}`.slice(0, 100),
        description: `${row.reward_display_text || '-'}${row.reward_quantity ? ` x${row.reward_quantity}` : row.reward_value_number ? ` (${row.reward_value_number})` : ''}`.slice(0, 100),
        value: row.reward_id
      }))
    );

  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(0x57f287).setTitle(`🛠️ แก้รางวัล · ${quest.quest_name}`).setDescription('เลือกรางวัลที่ต้องการแก้ไขจากรายการด้านล่าง')],
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true
  });
}

async function getPanelStatusRows(client) {
  const professions = await findActiveProfessions();
  const adminPanelChannelId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_CHANNEL);
  const adminPanelMessageId = await getAdminPanelMessageId();
  const rows = [];

  for (const profession of professions) {
    const channelId = await getProfessionPanelChannelId(profession.profession_code);
    const messageId = await getProfessionPanelMessageId(profession.profession_code);
    let status = 'ไม่พบ config';

    if (channelId) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) {
        status = 'ไม่พบห้องใน Discord';
      } else if (!messageId) {
        status = 'พบห้อง แต่ยังไม่มี message id';
      } else {
        const message = await channel.messages.fetch(messageId).catch(() => null);
        status = message ? 'พร้อมใช้งาน' : 'ไม่พบข้อความพาเนล';
      }
    }

    rows.push({ professionCode: profession.profession_code, status });
  }

  rows.unshift({
    professionCode: 'ADMIN_PANEL',
    status: adminPanelChannelId && adminPanelMessageId ? 'ตั้งค่าแล้ว' : 'ยังตั้งค่าไม่ครบ'
  });

  return rows;
}

async function showPanelStatus(interaction) {
  const rows = await getPanelStatusRows(interaction.client);
  const send = replyTarget(interaction);
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📡 สถานะพาเนล')
    .setDescription('ใช้หน้านี้ตรวจว่าพาเนลของแต่ละสายยังอยู่ครบหรือไม่')
    .addFields({
      name: 'ผลการตรวจสอบ',
      value: rows.map((row) => `• ${row.professionCode} → ${row.status}`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();

  return send({ embeds: [embed], components: buildBackButtons('quest:admin:panel_home') });
}

async function openCreateQuestModal(interaction) {
  const modal = new ModalBuilder().setCustomId('quest:admin:modal:create_quest').setTitle('สร้างเควสใหม่');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('profession_code').setLabel('profession_code เช่น MEDIC').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category_code').setLabel('category_code เช่น MAIN').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('quest_code').setLabel('quest_code').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('quest_name').setLabel('ชื่อเควส').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('quest_config').setLabel('เลเวล|step|ticket|repeat เช่น 6|true|true|false').setStyle(TextInputStyle.Short).setRequired(true).setValue('1|false|false|false'))
  );
  await interaction.showModal(modal);
}

async function openEditDescriptionModal(interaction, questId) {
  const quest = await findQuestById(questId);
  if (!quest) throw new Error('ไม่พบเควสที่ต้องการแก้ไข');
  const modal = new ModalBuilder().setCustomId(`quest:admin:modal:edit_description:${questId}`).setTitle('แก้คำอธิบายเควส');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('quest_name').setLabel('ชื่อเควส').setStyle(TextInputStyle.Short).setRequired(true).setValue(quest.quest_name || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('quest_description').setLabel('คำอธิบายเควส').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(quest.quest_description || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('panel_title').setLabel('หัวข้อบนพาเนล').setStyle(TextInputStyle.Short).setRequired(false).setValue(quest.panel_title || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('panel_description').setLabel('คำอธิบายบนพาเนล').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(quest.panel_description || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('button_label').setLabel('ข้อความบนปุ่ม').setStyle(TextInputStyle.Short).setRequired(false).setValue(quest.button_label || ''))
  );
  await interaction.showModal(modal);
}

async function openAddRequirementModal(interaction, questId) {
  const modal = new ModalBuilder().setCustomId(`quest:admin:modal:add_requirement:${questId}`).setTitle('เพิ่มของที่ต้องส่ง');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('requirement_type').setLabel('ประเภท requirement เช่น SCUM_ITEM').setStyle(TextInputStyle.Short).setRequired(true).setValue('SCUM_ITEM')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('item_name').setLabel('ชื่อของ / requirement').setStyle(TextInputStyle.Short).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_quantity').setLabel('จำนวนที่ต้องส่ง').setStyle(TextInputStyle.Short).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('display_text').setLabel('ข้อความที่ผู้เล่นเห็น').setStyle(TextInputStyle.Paragraph).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('admin_display_text').setLabel('ข้อความสำหรับแอดมิน').setStyle(TextInputStyle.Paragraph).setRequired(false))
  );
  await interaction.showModal(modal);
}

async function openAddRewardModal(interaction, questId) {
  const modal = new ModalBuilder().setCustomId(`quest:admin:modal:add_reward:${questId}`).setTitle('เพิ่มรางวัล');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_type').setLabel('ประเภทรางวัล เช่น SCUM_ITEM / FAME_POINT').setStyle(TextInputStyle.Short).setRequired(true).setValue('SCUM_ITEM')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_display_text').setLabel('ข้อความแสดงรางวัล').setStyle(TextInputStyle.Paragraph).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_item_name').setLabel('ชื่อไอเท็ม / ชื่อรางวัล').setStyle(TextInputStyle.Short).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_quantity').setLabel('จำนวนรางวัล').setStyle(TextInputStyle.Short).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_value_number').setLabel('ตัวเลขรางวัล (เงิน/FP)').setStyle(TextInputStyle.Short).setRequired(false))
  );
  await interaction.showModal(modal);
}

async function openAddImageModal(interaction, questId) {
  const modal = new ModalBuilder().setCustomId(`quest:admin:modal:add_image:${questId}`).setTitle('เพิ่มรูปตัวอย่าง');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('media_url').setLabel('URL รูปภาพ').setStyle(TextInputStyle.Paragraph).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('media_title').setLabel('ชื่อรูป').setStyle(TextInputStyle.Short).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('media_description').setLabel('คำอธิบายรูป').setStyle(TextInputStyle.Paragraph).setRequired(false)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('display_order').setLabel('ลำดับการแสดงผล').setStyle(TextInputStyle.Short).setRequired(false))
  );
  await interaction.showModal(modal);
}

async function openEditDependencyModal(interaction, questId) {
  const currentDeps = await findQuestDependencies(questId);
  const current = currentDeps[0];
  const modal = new ModalBuilder().setCustomId(`quest:admin:modal:edit_dependency:${questId}`).setTitle('แก้ Dependency');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('dependency_type').setLabel('NONE / PREVIOUS_QUEST / MAIN_LEVEL / ROLE').setStyle(TextInputStyle.Short).setRequired(true).setValue(current?.dependency_type || 'NONE')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_quest_code').setLabel('required quest code').setStyle(TextInputStyle.Short).setRequired(false).setValue('')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_level').setLabel('required level').setStyle(TextInputStyle.Short).setRequired(false).setValue(current?.required_level ? String(current.required_level) : '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_role_id').setLabel('required role id').setStyle(TextInputStyle.Short).setRequired(false).setValue(current?.required_role_id || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_role_name').setLabel('required role name').setStyle(TextInputStyle.Short).setRequired(false).setValue(current?.required_role_name || ''))
  );
  await interaction.showModal(modal);
}

async function openRequirementEditModal(interaction, requirementId) {
  const requirement = await findRequirementById(requirementId);
  if (!requirement) throw new Error('ไม่พบ requirement');
  const modal = new ModalBuilder().setCustomId(`quest:admin:modal:edit_requirement:${requirementId}`).setTitle('แก้ของที่ต้องส่ง');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('requirement_type').setLabel('ประเภท requirement').setStyle(TextInputStyle.Short).setRequired(true).setValue(requirement.requirement_type || 'SCUM_ITEM')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('item_name').setLabel('ชื่อของ / requirement').setStyle(TextInputStyle.Short).setRequired(false).setValue(requirement.item_name || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_quantity').setLabel('จำนวนที่ต้องส่ง').setStyle(TextInputStyle.Short).setRequired(false).setValue(requirement.required_quantity ? String(requirement.required_quantity) : '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('display_text').setLabel('ข้อความที่ผู้เล่นเห็น').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(requirement.display_text || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('admin_display_text').setLabel('ข้อความสำหรับแอดมิน').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(requirement.admin_display_text || ''))
  );
  await interaction.showModal(modal);
}

async function openRewardEditModal(interaction, rewardId) {
  const reward = await findRewardById(rewardId);
  if (!reward) throw new Error('ไม่พบ reward');
  const modal = new ModalBuilder().setCustomId(`quest:admin:modal:edit_reward:${rewardId}`).setTitle('แก้รางวัล');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_type').setLabel('ประเภทรางวัล').setStyle(TextInputStyle.Short).setRequired(true).setValue(reward.reward_type || 'SCUM_ITEM')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_display_text').setLabel('ข้อความแสดงรางวัล').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(reward.reward_display_text || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_item_name').setLabel('ชื่อไอเท็ม / ชื่อรางวัล').setStyle(TextInputStyle.Short).setRequired(false).setValue(reward.reward_item_name || '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_quantity').setLabel('จำนวนรางวัล').setStyle(TextInputStyle.Short).setRequired(false).setValue(reward.reward_quantity ? String(reward.reward_quantity) : '')),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_value_number').setLabel('ตัวเลขรางวัล (เงิน/FP)').setStyle(TextInputStyle.Short).setRequired(false).setValue(reward.reward_value_number ? String(reward.reward_value_number) : ''))
  );
  await interaction.showModal(modal);
}

async function handleAdminSelectMenu(interaction) {
  const { customId, values } = interaction;
  const selected = values[0];

  if (customId === 'quest:admin:select_profession') {
    await showLevelBrowse(interaction, selected);
    return;
  }
  if (customId.startsWith('quest:admin:select_level:')) {
    const professionId = customId.split(':')[4];
    await showQuestBrowse(interaction, professionId, Number(selected));
    return;
  }
  if (customId.startsWith('quest:admin:select_quest:')) {
    await showQuestDetail(interaction, selected);
    return;
  }
  if (customId.startsWith('quest:admin:select_requirement_edit:')) {
    await openRequirementEditModal(interaction, selected);
    return;
  }
  if (customId.startsWith('quest:admin:select_reward_edit:')) {
    await openRewardEditModal(interaction, selected);
  }
}

async function handleAdminModalSubmit(interaction) {
  const actor = { actorId: interaction.user.id, actorTag: interaction.user.tag };
  const { customId } = interaction;

  if (customId === 'quest:admin:modal:create_quest') {
    const configText = interaction.fields.getTextInputValue('quest_config').trim();
    const parts = configText.split('|').map((x) => x.trim());
    const created = await createQuestWithAudit(actor, {
      professionCode: interaction.fields.getTextInputValue('profession_code').trim().toUpperCase(),
      categoryCode: interaction.fields.getTextInputValue('category_code').trim().toUpperCase(),
      questCode: interaction.fields.getTextInputValue('quest_code').trim().toUpperCase(),
      questName: interaction.fields.getTextInputValue('quest_name').trim(),
      questLevel: Number(parts[0] || 1),
      isStepQuest: toBool(parts[1]),
      requiresTicket: toBool(parts[2]),
      isRepeatable: toBool(parts[3])
    });
    await interaction.reply({ content: `✅ สร้างเควสใหม่เรียบร้อยแล้ว\n${created.quest_code} · ${created.quest_name}`, ephemeral: true });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_description:')) {
    const questId = customId.split(':')[5];
    const result = await updateQuestDescriptionWithAudit(questId, actor, {
      questName: interaction.fields.getTextInputValue('quest_name').trim(),
      questDescription: interaction.fields.getTextInputValue('quest_description').trim(),
      panelTitle: interaction.fields.getTextInputValue('panel_title').trim(),
      panelDescription: interaction.fields.getTextInputValue('panel_description').trim(),
      buttonLabel: interaction.fields.getTextInputValue('button_label').trim()
    });
    await interaction.reply({ content: `✅ แก้คำอธิบายเควสเรียบร้อยแล้ว\nเควส: ${result.after.quest_name}`, ephemeral: true });
    return;
  }

  if (customId.startsWith('quest:admin:modal:add_requirement:')) {
    const questId = customId.split(':')[5];
    await addRequirementWithAudit(questId, actor, {
      requirementType: interaction.fields.getTextInputValue('requirement_type').trim().toUpperCase(),
      itemName: interaction.fields.getTextInputValue('item_name').trim(),
      requiredQuantity: toNullableInt(interaction.fields.getTextInputValue('required_quantity')),
      displayText: interaction.fields.getTextInputValue('display_text').trim(),
      adminDisplayText: interaction.fields.getTextInputValue('admin_display_text').trim()
    });
    await interaction.reply({ content: '✅ เพิ่มของที่ต้องส่งเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_requirement:')) {
    const requirementId = customId.split(':')[5];
    await updateRequirementWithAudit(requirementId, actor, {
      requirementType: interaction.fields.getTextInputValue('requirement_type').trim().toUpperCase(),
      itemName: interaction.fields.getTextInputValue('item_name').trim(),
      requiredQuantity: toNullableInt(interaction.fields.getTextInputValue('required_quantity')),
      displayText: interaction.fields.getTextInputValue('display_text').trim(),
      adminDisplayText: interaction.fields.getTextInputValue('admin_display_text').trim()
    });
    await interaction.reply({ content: '✅ แก้ของที่ต้องส่งเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId.startsWith('quest:admin:modal:add_reward:')) {
    const questId = customId.split(':')[5];
    await addRewardWithAudit(questId, actor, {
      rewardType: interaction.fields.getTextInputValue('reward_type').trim().toUpperCase(),
      rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
      rewardItemName: interaction.fields.getTextInputValue('reward_item_name').trim(),
      rewardQuantity: toNullableInt(interaction.fields.getTextInputValue('reward_quantity')),
      rewardValueNumber: toNullableInt(interaction.fields.getTextInputValue('reward_value_number')),
      discordRoleName: null
    });
    await interaction.reply({ content: '✅ เพิ่มรางวัลเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_reward:')) {
    const rewardId = customId.split(':')[5];
    await updateRewardWithAudit(rewardId, actor, {
      rewardType: interaction.fields.getTextInputValue('reward_type').trim().toUpperCase(),
      rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
      rewardItemName: interaction.fields.getTextInputValue('reward_item_name').trim(),
      rewardQuantity: toNullableInt(interaction.fields.getTextInputValue('reward_quantity')),
      rewardValueNumber: toNullableInt(interaction.fields.getTextInputValue('reward_value_number')),
      discordRoleName: null
    });
    await interaction.reply({ content: '✅ แก้รางวัลเรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_dependency:')) {
    const questId = customId.split(':')[5];
    await replaceDependencyWithAudit(questId, actor, {
      dependencyType: interaction.fields.getTextInputValue('dependency_type').trim().toUpperCase(),
      requiredQuestCode: interaction.fields.getTextInputValue('required_quest_code').trim().toUpperCase(),
      requiredLevel: toNullableInt(interaction.fields.getTextInputValue('required_level')),
      requiredRoleId: interaction.fields.getTextInputValue('required_role_id').trim(),
      requiredRoleName: interaction.fields.getTextInputValue('required_role_name').trim()
    });
    await interaction.reply({ content: '✅ แก้ Dependency เรียบร้อยแล้ว', ephemeral: true });
    return;
  }

  if (customId.startsWith('quest:admin:modal:add_image:')) {
    const questId = customId.split(':')[5];
    await addImageWithAudit(questId, actor, {
      mediaUrl: interaction.fields.getTextInputValue('media_url').trim(),
      mediaTitle: interaction.fields.getTextInputValue('media_title').trim(),
      mediaDescription: interaction.fields.getTextInputValue('media_description').trim(),
      displayOrder: toNullableInt(interaction.fields.getTextInputValue('display_order'))
    });
    await interaction.reply({ content: '✅ เพิ่มรูปตัวอย่างเรียบร้อยแล้ว', ephemeral: true });
  }
}

module.exports = {
  refreshAdminPanel,
  renderAdminHome,
  showPanelManagement,
  showMasterHome,
  showProfessionBrowse,
  showLevelBrowse,
  showQuestBrowse,
  showQuestDetail,
  showRequirements,
  showRewards,
  showDependencies,
  showImages,
  showSteps,
  showPanelStatus,
  openCreateQuestModal,
  openEditDescriptionModal,
  openAddRequirementModal,
  openAddRewardModal,
  openAddImageModal,
  openEditDependencyModal,
  showRequirementEditor,
  showRewardEditor,
  handleAdminSelectMenu,
  handleAdminModalSubmit,
  toggleQuestActiveWithAudit
};
