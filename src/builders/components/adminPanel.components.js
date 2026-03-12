const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

function chunkOptions(options, size = 25) {
  const out = [];
  for (let i = 0; i < options.length; i += size) {
    out.push(options.slice(i, i + size));
  }
  return out;
}

function buildAdminHomeComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_home')
        .setLabel('จัดการพาเนล')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('จัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

function buildPanelManagementComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quest:admin:deploy_panels').setLabel('ส่งพาเนลผู้เล่นใหม่').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('quest:admin:refresh_panels').setLabel('รีเฟรชพาเนลผู้เล่น').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('quest:admin:repair_panels').setLabel('ซ่อมพาเนลที่หาย').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quest:admin:refresh_current_view').setLabel('รีเฟรชหน้าดูเควสปัจจุบัน').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('quest:admin:panel_status').setLabel('สถานะพาเนล').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('quest:admin:home').setLabel('กลับหน้าหลัก').setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildMasterHomeComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quest:admin:browse_quest').setLabel('เลือกเควสเพื่อจัดการ').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('quest:admin:search_quest').setLabel('ค้นหาเควส').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('quest:admin:create_quest').setLabel('สร้างเควสใหม่').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quest:admin:home').setLabel('กลับหน้าหลัก').setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildProfessionSelectComponents(professions = []) {
  const options = professions.map((row) => ({
    label: row.profession_name_th || row.profession_code,
    description: `เลือกสาย ${row.profession_code}`.slice(0, 100),
    value: row.profession_id
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quest:admin_select:profession')
        .setPlaceholder('เลือกสายอาชีพ')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quest:admin:master_home').setLabel('กลับหน้าจัดการเควส').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildLevelSelectComponents(professionId, levels = []) {
  const options = levels.map((level) => ({
    label: `เลเวล ${level}`,
    description: `ดูเควสเลเวล ${level}`,
    value: `${professionId}|${level}`
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quest:admin_select:level')
        .setPlaceholder('เลือกเลเวล')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quest:admin:browse_quest').setLabel('กลับไปเลือกสาย').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('quest:admin:master_home').setLabel('กลับหน้าจัดการเควส').setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestSelectComponents(professionId, level, quests = []) {
  const options = quests.slice(0, 25).map((quest) => ({
    label: `${quest.quest_code || 'ไม่มีโค้ด'} • ${quest.quest_name || 'ไม่มีชื่อ'}`.slice(0, 100),
    description: `เลเวล ${quest.quest_level ?? level} • ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`.slice(0, 100),
    value: quest.quest_id
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quest:admin_select:quest')
        .setPlaceholder('เลือกเควสที่ต้องการจัดการ')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:back_levels:${professionId}`).setLabel('กลับไปเลือกเลเวล').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('quest:admin:master_home').setLabel('กลับหน้าจัดการเควส').setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestDetailComponents(questId, options = {}) {
  const { isActive = true } = options;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:view_requirements:${questId}`).setLabel('ดูของที่ต้องส่ง').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`quest:admin:view_rewards:${questId}`).setLabel('ดูรางวัล').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`quest:admin:view_dependency:${questId}`).setLabel('ดู Dependency').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:view_images:${questId}:0`).setLabel('ดูรูปตัวอย่าง').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`quest:admin:edit_description:${questId}`).setLabel('แก้คำอธิบาย').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`quest:admin:edit_dependency:${questId}`).setLabel('แก้ Dependency').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:pick_requirement:${questId}`).setLabel('แก้ของที่ต้องส่ง').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`quest:admin:pick_reward:${questId}`).setLabel('แก้รางวัล').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`quest:admin:add_image:${questId}`).setLabel('เพิ่มรูปตัวอย่าง').setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:toggle_active:${questId}`).setLabel(isActive ? 'ปิดใช้งานเควส' : 'เปิดใช้งานเควส').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('quest:admin:master_home').setLabel('กลับหน้าจัดการเควส').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildRequirementSelectComponents(questId, requirements = []) {
  const options = requirements.slice(0, 25).map((row) => ({
    label: `${row.item_name || row.requirement_type || 'Requirement'} x${row.required_quantity || 0}`.slice(0, 100),
    description: (row.display_text || row.admin_display_text || 'เลือกรายการนี้เพื่อแก้ไข').slice(0, 100),
    value: row.requirement_id
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`quest:admin_select:requirement:${questId}`)
        .setPlaceholder('เลือกรายการของที่ต้องส่ง')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:quest_detail:${questId}`).setLabel('กลับไปหน้าเควส').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildRewardSelectComponents(questId, rewards = []) {
  const options = rewards.slice(0, 25).map((row) => ({
    label: `${row.reward_item_name || row.reward_type || 'Reward'} x${row.reward_quantity || 0}`.slice(0, 100),
    description: (row.reward_display_text || 'เลือกรางวัลนี้เพื่อแก้ไข').slice(0, 100),
    value: row.reward_id
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`quest:admin_select:reward:${questId}`)
        .setPlaceholder('เลือกรางวัลที่ต้องการแก้ไข')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:quest_detail:${questId}`).setLabel('กลับไปหน้าเควส').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildSearchResultComponents(quests = []) {
  const options = quests.slice(0, 25).map((quest) => ({
    label: `${quest.quest_code || 'ไม่มีโค้ด'} • ${quest.quest_name || 'ไม่มีชื่อ'}`.slice(0, 100),
    description: `${quest.profession_name_th || quest.profession_code || '-'} • Lv${quest.quest_level || '-'}`.slice(0, 100),
    value: quest.quest_id
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quest:admin_select:quest')
        .setPlaceholder('เลือกเควสจากผลการค้นหา')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('quest:admin:master_home').setLabel('กลับหน้าจัดการเควส').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildImageViewerComponents(questId, index, total) {
  const prevIndex = index > 0 ? index - 1 : 0;
  const nextIndex = index < total - 1 ? index + 1 : total - 1;

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:view_images:${questId}:${prevIndex}`).setLabel('รูปก่อนหน้า').setStyle(ButtonStyle.Secondary).setDisabled(index <= 0),
      new ButtonBuilder().setCustomId(`quest:admin:view_images:${questId}:${nextIndex}`).setLabel('รูปถัดไป').setStyle(ButtonStyle.Secondary).setDisabled(index >= total - 1),
      new ButtonBuilder().setCustomId(`quest:admin:add_image:${questId}`).setLabel('เพิ่มรูปตัวอย่าง').setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`quest:admin:quest_detail:${questId}`).setLabel('กลับไปหน้าเควส').setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildAdminHomeComponents,
  buildPanelManagementComponents,
  buildMasterHomeComponents,
  buildProfessionSelectComponents,
  buildLevelSelectComponents,
  buildQuestSelectComponents,
  buildQuestDetailComponents,
  buildRequirementSelectComponents,
  buildRewardSelectComponents,
  buildSearchResultComponents,
  buildImageViewerComponents
};
