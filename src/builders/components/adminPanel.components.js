const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

function chunkArray(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function buildAdminHomeComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:panel:home')
        .setLabel('จัดการพาเนล')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('admin:master:home')
        .setLabel('จัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

function buildPanelManagementComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:panel:deploy_players')
        .setLabel('ส่งพาเนลผู้เล่นใหม่')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('admin:panel:refresh_players')
        .setLabel('รีเฟรชพาเนลผู้เล่น')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('admin:panel:status')
        .setLabel('เช็กสถานะพาเนล')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:home')
        .setLabel('กลับหน้าหลักแอดมิน')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildMasterHomeComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:master:browse')
        .setLabel('เลือกเควสตามสาย')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('admin:master:search')
        .setLabel('ค้นหาเควส')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('admin:master:create')
        .setLabel('สร้างเควสใหม่')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:home')
        .setLabel('กลับหน้าหลักแอดมิน')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildProfessionSelectComponents(professions) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('admin:master:select_profession')
    .setPlaceholder('เลือกสายอาชีพ');

  select.addOptions(
    professions.slice(0, 25).map((row) => ({
      label: row.profession_name_th || row.profession_code,
      description: row.profession_code,
      value: row.profession_id
    }))
  );

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:master:home')
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildLevelSelectComponents(professionId, levels) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(`admin:master:select_level:${professionId}`)
    .setPlaceholder('เลือกระดับเควส');

  select.addOptions(
    levels.slice(0, 25).map((level) => ({
      label: `Lv.${level}`,
      description: `ระดับ ${level}`,
      value: String(level)
    }))
  );

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:master:browse')
        .setLabel('กลับไปเลือกสาย')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('admin:master:home')
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildQuestSelectComponents(professionId, level, quests) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(`admin:master:select_quest:${professionId}:${level}`)
    .setPlaceholder('เลือกเควส');

  select.addOptions(
    quests.slice(0, 25).map((row) => ({
      label: row.quest_name,
      description: `${row.quest_code} • Lv.${row.quest_level}`,
      value: row.quest_id
    }))
  );

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin:master:back_to_level:${professionId}`)
        .setLabel('กลับไปเลือกระดับ')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('admin:master:home')
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildQuestDetailComponents(questId, context = {}) {
  const rows = [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin:quest:edit_description:${questId}`)
        .setLabel('แก้คำอธิบาย')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`admin:quest:edit_requirements:${questId}`)
        .setLabel('แก้ของที่ต้องส่ง')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`admin:quest:edit_rewards:${questId}`)
        .setLabel('แก้รางวัล')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin:quest:edit_dependency:${questId}`)
        .setLabel('แก้ Dependency')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`admin:quest:add_image:${questId}`)
        .setLabel('เพิ่มรูปตัวอย่าง')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`admin:quest:toggle_active:${questId}`)
        .setLabel('เปิด/ปิดเควส')
        .setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin:quest:add_requirement:${questId}`)
        .setLabel('เพิ่มของที่ต้องส่ง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`admin:quest:add_reward:${questId}`)
        .setLabel('เพิ่มรางวัล')
        .setStyle(ButtonStyle.Secondary)
    )
  ];

  const backButtons = [];
  if (context.professionId && context.level) {
    backButtons.push(
      new ButtonBuilder()
        .setCustomId(`admin:master:back_to_quests:${context.professionId}:${context.level}`)
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  backButtons.push(
    new ButtonBuilder()
      .setCustomId('admin:master:home')
      .setLabel('กลับหน้าหลักหมวดเควส')
      .setStyle(ButtonStyle.Secondary)
  );

  rows.push(new ActionRowBuilder().addComponents(...backButtons));
  return rows;
}

function buildSearchResultComponents(rows) {
  if (!rows.length) {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('admin:master:home')
          .setLabel('กลับหน้าจัดการข้อมูลเควส')
          .setStyle(ButtonStyle.Secondary)
      )
    ];
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('admin:master:select_search_result')
    .setPlaceholder('เลือกเควสจากผลการค้นหา');

  select.addOptions(
    rows.slice(0, 25).map((row) => ({
      label: row.quest_name,
      description: `${row.quest_code} • ${row.profession_name_th || row.profession_code} • Lv.${row.quest_level}`,
      value: row.quest_id
    }))
  );

  return [
    new ActionRowBuilder().addComponents(select),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('admin:master:home')
        .setLabel('กลับหน้าจัดการข้อมูลเควส')
        .setStyle(ButtonStyle.Secondary)
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
  buildSearchResultComponents
};
