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
        .setCustomId('quest:admin:panel_repair_missing')
        .setLabel('ซ่อมพาเนลที่หาย')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_refresh_current')
        .setLabel('รีเฟรช Current Quest')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_status')
        .setLabel('สถานะพาเนล')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
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
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_create')
        .setLabel('สร้างเควสใหม่')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildProfessionSelectComponent(professions) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('quest:admin:select_profession')
    .setPlaceholder('เลือกสายอาชีพที่ต้องการจัดการ');

  menu.addOptions(
    professions.slice(0, 25).map((row) => ({
      label: `${row.icon_emoji || '📘'} ${row.profession_name_th}`.slice(0, 100),
      description: `${row.profession_code}${row.profession_name_en ? ` • ${row.profession_name_en}` : ''}`.slice(0, 100),
      value: row.profession_id
    }))
  );

  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับเมนูจัดการเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildLevelSelectComponent(professionId, levels) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_level:${professionId}`)
    .setPlaceholder('เลือกระดับเควส');

  menu.addOptions(
    levels.slice(0, 25).map((row) => ({
      label: `Lv.${row.quest_level}`,
      description: `มี ${row.quest_count} เควส`,
      value: String(row.quest_level)
    }))
  );

  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_browse')
        .setLabel('กลับไปเลือกสาย')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับเมนูจัดการเควส')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestSelectComponent(professionId, questLevel, quests) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_quest:${professionId}:${questLevel}`)
    .setPlaceholder('เลือกเควสที่ต้องการดูหรือแก้ไข');

  menu.addOptions(
    quests.slice(0, 25).map((row) => ({
      label: `${row.quest_code} • ${row.quest_name}`.slice(0, 100),
      description: `${row.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'} • ${row.is_step_quest ? 'Step Quest' : 'Quest ปกติ'}`.slice(0, 100),
      value: row.quest_id
    }))
  );

  return [
    new ActionRowBuilder().addComponents(menu),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:back_levels:${professionId}`)
        .setLabel('กลับไปเลือกระดับ')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับเมนูจัดการเควส')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestDetailComponents(questId, backMeta = {}) {
  const professionId = backMeta.professionId || 'none';
  const questLevel = backMeta.questLevel || 'none';

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_requirements:${questId}:${professionId}:${questLevel}`)
        .setLabel('ดูของที่ต้องส่ง')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_rewards:${questId}:${professionId}:${questLevel}`)
        .setLabel('ดูรางวัล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_dependency:${questId}:${professionId}:${questLevel}`)
        .setLabel('ดู Dependency')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_images:${questId}:${professionId}:${questLevel}`)
        .setLabel('ดูรูปตัวอย่าง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_description:${questId}`)
        .setLabel('แก้คำอธิบาย')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_dependency:${questId}`)
        .setLabel('แก้ Dependency')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_requirements:${questId}`)
        .setLabel('แก้ของที่ต้องส่ง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_rewards:${questId}`)
        .setLabel('แก้รางวัล')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_image:${questId}`)
        .setLabel('เพิ่มรูปตัวอย่าง')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_requirement:${questId}`)
        .setLabel('เพิ่มของที่ต้องส่ง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_reward:${questId}`)
        .setLabel('เพิ่มรางวัล')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:toggle_active:${questId}`)
        .setLabel('เปิด/ปิดเควส')
        .setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:back_quests:${professionId}:${questLevel}`)
        .setLabel('กลับรายการเควส')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับเมนูจัดการเควส')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildBackToQuestDetailComponents(questId, professionId, questLevel) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_detail:${questId}:${professionId}:${questLevel}`)
        .setLabel('กลับหน้าเควสนี้')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:back_quests:${professionId}:${questLevel}`)
        .setLabel('กลับรายการเควส')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับเมนูจัดการเควส')
        .setStyle(ButtonStyle.Danger)
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
  buildBackToQuestDetailComponents
};
