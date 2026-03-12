const {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildProfessionBrowseEmbed,
  buildLevelBrowseEmbed,
  buildQuestBrowseEmbed,
  buildQuestDetailEmbed,
  buildSimpleListEmbed,
  buildPanelStatusEmbed,
  buildStubActionEmbed
} = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminHomeComponents,
  buildPanelManagementComponents,
  buildMasterHomeComponents,
  buildProfessionSelectComponent,
  buildLevelSelectComponent,
  buildQuestSelectComponent,
  buildQuestDetailComponents,
  buildBackToQuestDetailComponents
} = require('../builders/components/adminPanel.components');
const {
  listActiveProfessions,
  findProfessionById,
  listQuestLevelsByProfession,
  listQuestsByProfessionAndLevel,
  findQuestDetailById,
  listQuestRequirements,
  listQuestRewards,
  listQuestDependencies,
  listQuestGuideMedia,
  listQuestSteps,
  searchQuests,
  listProfessionPanelConfigRows
} = require('../db/queries/adminPanel.repo');
const { deployProfessionPanels } = require('./panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('./adminPanelAutoDeploy.service');

async function renderAdminHome(target) {
  return target.update({
    embeds: [buildAdminHomeEmbed()],
    components: buildAdminHomeComponents()
  });
}

async function renderPanelManagement(target) {
  return target.update({
    embeds: [buildPanelManagementEmbed()],
    components: buildPanelManagementComponents()
  });
}

async function renderMasterHome(target) {
  return target.update({
    embeds: [buildMasterHomeEmbed()],
    components: buildMasterHomeComponents()
  });
}

async function renderProfessionBrowser(target) {
  const professions = await listActiveProfessions();
  return target.update({
    embeds: [buildProfessionBrowseEmbed(professions)],
    components: buildProfessionSelectComponent(professions)
  });
}

async function renderLevelBrowser(target, professionId) {
  const profession = await findProfessionById(professionId);
  const levels = await listQuestLevelsByProfession(professionId);

  return target.update({
    embeds: [buildLevelBrowseEmbed(profession, levels)],
    components: buildLevelSelectComponent(professionId, levels)
  });
}

async function renderQuestBrowser(target, professionId, questLevel) {
  const profession = await findProfessionById(professionId);
  const quests = await listQuestsByProfessionAndLevel(professionId, Number(questLevel));

  return target.update({
    embeds: [buildQuestBrowseEmbed(profession, questLevel, quests)],
    components: buildQuestSelectComponent(professionId, Number(questLevel), quests)
  });
}

async function renderQuestDetail(target, questId, professionId, questLevel) {
  const quest = await findQuestDetailById(questId);
  const [requirements, rewards, dependencies, images, steps] = await Promise.all([
    listQuestRequirements(questId),
    listQuestRewards(questId),
    listQuestDependencies(questId),
    listQuestGuideMedia(questId),
    listQuestSteps(questId)
  ]);

  return target.update({
    embeds: [buildQuestDetailEmbed(quest, {
      requirementCount: requirements.length,
      rewardCount: rewards.length,
      dependencyCount: dependencies.length,
      imageCount: images.length,
      stepCount: steps.length
    })],
    components: buildQuestDetailComponents(questId, { professionId, questLevel })
  });
}

async function renderQuestRequirements(target, questId, professionId, questLevel) {
  const quest = await findQuestDetailById(questId);
  const rows = await listQuestRequirements(questId);
  return target.update({
    embeds: [buildSimpleListEmbed('📦 ของที่ต้องส่งในเควสนี้', quest, rows, (row, no) => {
      return `${no}. **${row.item_name || row.input_label || row.requirement_type}**\n   ประเภท: ${row.requirement_type}\n   จำนวน: ${row.required_quantity || '-'}\n   ข้อความแสดง: ${row.display_text || '-'} `;
    })],
    components: buildBackToQuestDetailComponents(questId, professionId, questLevel)
  });
}

async function renderQuestRewards(target, questId, professionId, questLevel) {
  const quest = await findQuestDetailById(questId);
  const rows = await listQuestRewards(questId);
  return target.update({
    embeds: [buildSimpleListEmbed('🎁 รางวัลของเควสนี้', quest, rows, (row, no) => {
      return `${no}. **${row.reward_item_name || row.reward_value_text || row.reward_type}**\n   ประเภท: ${row.reward_type}\n   จำนวน: ${row.reward_quantity || row.reward_value_number || '-'}\n   ข้อความแสดง: ${row.reward_display_text || '-'} `;
    })],
    components: buildBackToQuestDetailComponents(questId, professionId, questLevel)
  });
}

async function renderQuestDependencies(target, questId, professionId, questLevel) {
  const quest = await findQuestDetailById(questId);
  const rows = await listQuestDependencies(questId);
  return target.update({
    embeds: [buildSimpleListEmbed('🔗 Dependency ของเควสนี้', quest, rows, (row, no) => {
      const dependencyValue = row.required_quest_code
        ? `${row.required_quest_code} • ${row.required_quest_name || ''}`.trim()
        : row.required_role_name || row.required_role_id || row.required_level || '-';
      return `${no}. **${row.dependency_type}**\n   เงื่อนไข: ${dependencyValue}\n   Operator: ${row.condition_operator}`;
    })],
    components: buildBackToQuestDetailComponents(questId, professionId, questLevel)
  });
}

async function renderQuestImages(target, questId, professionId, questLevel) {
  const quest = await findQuestDetailById(questId);
  const rows = await listQuestGuideMedia(questId);
  return target.update({
    embeds: [buildSimpleListEmbed('🖼️ รูปตัวอย่างของเควสนี้', quest, rows, (row, no) => {
      return `${no}. **${row.media_title || 'รูปตัวอย่าง'}**\n   ประเภท: ${row.media_type}\n   URL: ${row.media_url}\n   คำอธิบาย: ${row.media_description || '-'} `;
    })],
    components: buildBackToQuestDetailComponents(questId, professionId, questLevel)
  });
}

async function renderSearchResults(target, keyword) {
  const rows = await searchQuests(keyword);
  const description = rows.length
    ? rows.map((row, index) => `${index + 1}. **${row.quest_code} • ${row.quest_name}**\n   สาย: ${row.profession_name_th || '-'}\n   เลเวล: ${row.quest_level || '-'}\n   สถานะ: ${row.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}`).join('\n\n')
    : '- ไม่พบเควสที่ค้นหา -';

  return target.reply({
    embeds: [
      buildStubActionEmbed('ผลการค้นหาเควส')
        .setDescription([`คำค้นหา: **${keyword}**`, '', description].join('\n'))
    ],
    ephemeral: true
  });
}

async function runPanelDeploy(interaction) {
  await autoDeployAdminPanel(interaction.client);
  await deployProfessionPanels(interaction.client);
  return interaction.reply({ content: '✅ ส่งพาเนลแอดมินและพาเนลผู้เล่นใหม่เรียบร้อยแล้ว', ephemeral: true });
}

async function runPanelRefresh(interaction) {
  await autoDeployAdminPanel(interaction.client);
  await deployProfessionPanels(interaction.client);
  return interaction.reply({ content: '✅ รีเฟรชพาเนลเรียบร้อยแล้ว', ephemeral: true });
}

async function runPanelRepair(interaction) {
  await deployProfessionPanels(interaction.client);
  return interaction.reply({ content: '🛠️ สั่งซ่อมพาเนลที่หายแล้ว หาก config ครบระบบจะสร้างเฉพาะที่ขาดให้', ephemeral: true });
}

async function runCurrentQuestRefresh(interaction) {
  return interaction.reply({ content: '🔄 ฟังก์ชันรีเฟรช Current Quest เตรียม flow ไว้แล้ว รอบถัดไปจะผูกกับ logic progress จริง', ephemeral: true });
}

async function renderPanelStatus(interaction) {
  const rows = await listProfessionPanelConfigRows();
  const statusRows = [];

  for (const row of rows) {
    let status = 'MISSING_CHANNEL';
    if (row.channel_id) {
      const channel = await interaction.client.channels.fetch(row.channel_id).catch(() => null);
      if (channel && row.message_id) {
        const message = await channel.messages.fetch(row.message_id).catch(() => null);
        status = message ? 'OK' : 'MISSING_MESSAGE';
      } else if (channel) {
        status = 'MISSING_MESSAGE';
      }
    }

    statusRows.push({
      professionCode: row.profession_code,
      channelId: row.channel_id,
      messageId: row.message_id,
      status
    });
  }

  return interaction.reply({
    embeds: [buildPanelStatusEmbed(statusRows)],
    ephemeral: true
  });
}

module.exports = {
  renderAdminHome,
  renderPanelManagement,
  renderMasterHome,
  renderProfessionBrowser,
  renderLevelBrowser,
  renderQuestBrowser,
  renderQuestDetail,
  renderQuestRequirements,
  renderQuestRewards,
  renderQuestDependencies,
  renderQuestImages,
  renderSearchResults,
  runPanelDeploy,
  runPanelRefresh,
  runPanelRepair,
  runCurrentQuestRefresh,
  renderPanelStatus,
  buildStubActionEmbed
};
