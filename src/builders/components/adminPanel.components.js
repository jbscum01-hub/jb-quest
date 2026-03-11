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
        .setCustomId('quest:admin:deploy_panels')
        .setLabel('สร้างพาเนลใหม่')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:refresh_panels')
        .setLabel('รีเฟรชพาเนล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:repair_panels')
        .setLabel('ซ่อมพาเนลที่หาย')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:refresh_current_view')
        .setLabel('รีเฟรชมุมมองเควสปัจจุบัน')
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
        .setCustomId('quest:admin:browse_start')
        .setLabel('เลือกเควสเพื่อดู/แก้ไข')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:create_quest_stub')
        .setLabel('สร้างเควสใหม่')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildProfessionSelectRow(professions) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('quest:admin:select_profession')
    .setPlaceholder('เลือกสายอาชีพที่ต้องการจัดการ')
    .addOptions(
      professions.slice(0, 25).map((profession) => ({
        label: profession.profession_name_th,
        description: `${profession.profession_code}${profession.profession_name_en ? ` • ${profession.profession_name_en}` : ''}`.slice(0, 100),
        value: profession.profession_id
      }))
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildLevelSelectRow(professionId, levels) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_level:${professionId}`)
    .setPlaceholder('เลือกระดับเควส')
    .addOptions(
      levels.slice(0, 25).map((level) => ({
        label: `Lv.${level.quest_level}`,
        description: `มี ${level.quest_count} เควส`,
        value: String(level.quest_level)
      }))
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildQuestSelectRow(professionId, level, quests) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_quest:${professionId}:${level}`)
    .setPlaceholder('เลือกเควสที่ต้องการดูหรือแก้ไข')
    .addOptions(
      quests.slice(0, 25).map((quest) => ({
        label: `${quest.quest_code} · ${quest.quest_name}`.slice(0, 100),
        description: [
          `Lv.${quest.quest_level ?? '-'} ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
          quest.is_step_quest ? 'Step Quest' : 'Quest ปกติ'
        ].join(' • ').slice(0, 100),
        value: quest.quest_id
      }))
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildQuestDetailComponents(questId, hasSteps = false) {
  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_requirements:${questId}`)
        .setLabel('ดูของที่ต้องส่ง')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_rewards:${questId}`)
        .setLabel('ดูรางวัล')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_dependency:${questId}`)
        .setLabel('ดูเงื่อนไขปลดล็อก')
        .setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_images:${questId}`)
        .setLabel('ดูรูปตัวอย่าง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_description:${questId}`)
        .setLabel('แก้คำอธิบาย')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_dependency:${questId}`)
        .setLabel('แก้ Dependency')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_requirements:${questId}`)
        .setLabel('แก้ของที่ต้องส่ง')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_rewards:${questId}`)
        .setLabel('แก้รางวัล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_image:${questId}`)
        .setLabel('เพิ่มรูปตัวอย่าง')
        .setStyle(ButtonStyle.Success)
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
    )
  ];

  if (hasSteps) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`quest:admin:view_steps:${questId}`)
          .setLabel('ดูขั้นตอน Lv6')
          .setStyle(ButtonStyle.Primary)
      )
    );
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:browse_start')
        .setLabel('เลือกเควสอื่น')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับหน้าจัดการเควส')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
    )
  );

  return rows;
}

function buildBackRows(backCustomId = 'quest:admin:master_home') {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(backCustomId)
        .setLabel('ย้อนกลับ')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

module.exports = {
  buildAdminHomeComponents,
  buildPanelManagementComponents,
  buildMasterHomeComponents,
  buildProfessionSelectRow,
  buildLevelSelectRow,
  buildQuestSelectRow,
  buildQuestDetailComponents,
  buildBackRows
};
