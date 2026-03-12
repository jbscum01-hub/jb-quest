const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

function buildMasterHomeButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:browse_quest')
        .setLabel('เรียกดูเควส')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:search_quest')
        .setLabel('ค้นหาเควส')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:create_quest')
        .setLabel('สร้างเควส')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

function buildProfessionSelectRow(options) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quest:admin:select_profession')
        .setPlaceholder('เลือกสายอาชีพ')
        .addOptions(options)
    )
  ];
}

function buildLevelSelectRow(professionCode, levels) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`quest:admin:select_level:${professionCode}`)
        .setPlaceholder('เลือกระดับเควส')
        .addOptions(
          levels.map((level) => ({
            label: `Lv${level}`,
            value: String(level),
            description: `ดูเควสของ ${professionCode} ระดับ ${level}`
          }))
        )
    )
  ];
}

function buildQuestSelectRow(customId, quests) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('เลือกเควส')
        .addOptions(
          quests.slice(0, 25).map((quest) => ({
            label: `${quest.quest_code}`.slice(0, 100),
            value: quest.quest_id,
            description: `${quest.quest_name}`.slice(0, 100)
          }))
        )
    )
  ];
}

function buildQuestDetailButtons(questId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_description:${questId}`)
        .setLabel('แก้คำอธิบาย')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_requirements:${questId}`)
        .setLabel('แก้ของที่ต้องส่ง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_rewards:${questId}`)
        .setLabel('แก้รางวัล')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_dependency:${questId}`)
        .setLabel('แก้เควสก่อนหน้า')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:manage_images:${questId}`)
        .setLabel('จัดการรูปตัวอย่าง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:toggle_active:${questId}`)
        .setLabel('เปลี่ยนสถานะเควส')
        .setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_requirement:${questId}`)
        .setLabel('เพิ่มของที่ต้องส่ง')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_reward:${questId}`)
        .setLabel('เพิ่มรางวัล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_image:${questId}`)
        .setLabel('เพิ่มรูปตัวอย่าง')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildImageManagerButtons(questId, hasImages) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_image:${questId}`)
        .setLabel('เพิ่มรูปตัวอย่าง')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:remove_image:${questId}`)
        .setLabel('ลบรูปตัวอย่าง')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!hasImages),
      new ButtonBuilder()
        .setCustomId(`quest:admin:open_detail:${questId}`)
        .setLabel('กลับหน้าเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildMasterHomeButtons,
  buildProfessionSelectRow,
  buildLevelSelectRow,
  buildQuestSelectRow,
  buildQuestDetailButtons,
  buildImageManagerButtons
};
