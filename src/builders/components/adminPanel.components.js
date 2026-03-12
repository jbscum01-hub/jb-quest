const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

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
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_deploy_players')
        .setLabel('ส่งพาเนลผู้เล่นใหม่')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_refresh_players')
        .setLabel('รีเฟรชพาเนลผู้เล่น')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_status')
        .setLabel('เช็กสถานะพาเนล')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('กลับหน้าหลักแอดมิน')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildMasterHomeComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_browse')
        .setLabel('เลือกเควสตามสาย')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_search')
        .setLabel('ค้นหาเควส')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('กลับหน้าหลักแอดมิน')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildProfessionSelectComponent(professions) {
  const options = professions.slice(0, 25).map((profession) => ({
    label: profession.profession_name_th || profession.profession_code,
    description: profession.profession_code,
    value: profession.profession_id
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quest:admin:select_profession')
        .setPlaceholder('เลือกสายอาชีพที่ต้องการจัดการ')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับ')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildLevelSelectComponent(professionId, levels) {
  const options = levels.slice(0, 25).map((level) => ({
    label: `เลเวล ${level}`,
    description: `ดูเควสของเลเวล ${level}`,
    value: String(level)
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`quest:admin:select_level:${professionId}`)
        .setPlaceholder('เลือกเลเวลของเควส')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_browse')
        .setLabel('กลับไปเลือกสาย')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildQuestSelectComponent(professionId, level, quests) {
  const options = quests.slice(0, 25).map((quest) => ({
    label: quest.quest_name,
    description: `${quest.quest_code} • Lv.${quest.quest_level}`.slice(0, 100),
    value: quest.quest_id
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`quest:admin:select_quest:${professionId}:${level}`)
        .setPlaceholder('เลือกเควสที่ต้องการดู')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:browse_levels:${professionId}`)
        .setLabel('กลับไปเลือกเลเวล')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildQuestDetailComponents(questId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_requirements:${questId}`)
        .setLabel('ดูของที่ต้องส่ง')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_rewards:${questId}`)
        .setLabel('ดูรางวัล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_dependency:${questId}`)
        .setLabel('ดูเงื่อนไขปลดล็อก')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_images:${questId}`)
        .setLabel('ดูรูปตัวอย่าง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_edit_placeholder:${questId}`)
        .setLabel('เมนูแก้ไข (เตรียมไว้)')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildQuestSubViewComponents(questId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_detail:${questId}`)
        .setLabel('กลับหน้าเควสนี้')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildAdminHomeComponents,
  buildPanelManagementComponents,
  buildMasterHomeComponents,
  buildProfessionSelectComponent,
  buildLevelSelectComponent,
  buildQuestSelectComponent,
  buildQuestDetailComponents,
  buildQuestSubViewComponents
};
