const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildAdminHomeButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_panels'))
        .setLabel('จัดการพาเนลผู้เล่น')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_master'))
        .setLabel('จัดการมาสเตอร์เควส')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_refresh'))
        .setLabel('รีเฟรชแผงนี้')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildPanelManagementButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'deploy_panels'))
        .setLabel('สร้างพาเนลผู้เล่น')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'refresh_panels'))
        .setLabel('รีเฟรชพาเนลผู้เล่น')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'repair_panels'))
        .setLabel('ซ่อมพาเนลที่หาย')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'refresh_current_quest'))
        .setLabel('รีเฟรชเควสปัจจุบัน')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'panel_status'))
        .setLabel('ตรวจสอบสถานะพาเนล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'back_home'))
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildMasterHomeButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'browse_quests'))
        .setLabel('เรียกดูเควส')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'search_quest'))
        .setLabel('ค้นหาเควส')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'create_quest'))
        .setLabel('สร้างเควส')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'back_home'))
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildProfessionSelectComponents(options = []) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(buildCustomId('admin_select', 'profession'))
        .setPlaceholder('เลือกสายอาชีพ')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_master'))
        .setLabel('กลับหน้ามาสเตอร์เควส')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildLevelSelectComponents(professionCode) {
  const options = [1, 2, 3, 4, 5, 6].map((level) => ({
    label: `Lv${level}`,
    value: String(level),
    description: `ดูเควสเลเวล ${level}`
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(buildCustomId('admin_select', 'level', professionCode))
        .setPlaceholder('เลือกเลเวล')
        .addOptions(options)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'browse_quests'))
        .setLabel('กลับไปเลือกสาย')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_master'))
        .setLabel('กลับหน้ามาสเตอร์เควส')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestSelectComponents(professionCode, level, quests = []) {
  const options = quests.slice(0, 25).map((quest) => ({
    label: `${quest.quest_code}`.slice(0, 100),
    value: quest.quest_id,
    description: `${quest.quest_name}`.slice(0, 100)
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(buildCustomId('admin_select', 'quest', `${professionCode}|${level}`))
        .setPlaceholder(quests.length ? 'เลือกเควส' : 'ไม่พบเควส')
        .setDisabled(!quests.length)
        .addOptions(options.length ? options : [{ label: 'ไม่พบเควส', value: 'NO_QUEST', description: 'ไม่มีข้อมูล' }])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'browse_levels', professionCode))
        .setLabel('กลับไปเลือกเลเวล')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_master'))
        .setLabel('กลับหน้ามาสเตอร์เควส')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestSearchResultComponents(quests = []) {
  const options = quests.slice(0, 25).map((quest) => ({
    label: `${quest.quest_code}`.slice(0, 100),
    value: quest.quest_id,
    description: `${quest.quest_name}`.slice(0, 100)
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(buildCustomId('admin_select', 'quest', 'SEARCH|0'))
        .setPlaceholder(quests.length ? 'เลือกเควสจากผลการค้นหา' : 'ไม่พบเควส')
        .setDisabled(!quests.length)
        .addOptions(options.length ? options : [{ label: 'ไม่พบเควส', value: 'NO_QUEST', description: 'ไม่มีข้อมูล' }])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_master'))
        .setLabel('กลับหน้ามาสเตอร์เควส')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestDetailButtons(questId, professionCode, level) {
  const backExtra = `${professionCode}|${level}`;

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'edit_description', questId))
        .setLabel('แก้คำอธิบาย')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'edit_requirements', questId))
        .setLabel('แก้ของที่ต้องส่ง')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'edit_rewards', questId))
        .setLabel('แก้รางวัล')
        .setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'edit_dependency', questId))
        .setLabel('แก้เควสก่อนหน้า')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'manage_images', `${questId}|0`))
        .setLabel('จัดการรูปตัวอย่าง')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'toggle_active', questId))
        .setLabel('เปลี่ยนสถานะเควส')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'add_requirement', questId))
        .setLabel('เพิ่มของที่ต้องส่ง')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'add_reward', questId))
        .setLabel('เพิ่มรางวัล')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'add_image', questId))
        .setLabel('เพิ่มรูปตัวอย่าง')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'back_quest_list', backExtra))
        .setLabel('กลับไปหน้าเควส')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'home_master'))
        .setLabel('กลับหน้าหลัก')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestImageManagerButtons(questId, currentIndex = 0, imageCount = 0) {
  const prevIndex = Math.max(currentIndex - 1, 0);
  const nextIndex = Math.min(currentIndex + 1, Math.max(imageCount - 1, 0));

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'image_prev', `${questId}|${prevIndex}`))
        .setLabel('รูปก่อนหน้า')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!imageCount || currentIndex <= 0),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'image_next', `${questId}|${nextIndex}`))
        .setLabel('รูปถัดไป')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!imageCount || currentIndex >= imageCount - 1),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'image_remove', `${questId}|${currentIndex}`))
        .setLabel('ลบรูปนี้')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!imageCount)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'add_image', questId))
        .setLabel('เพิ่มรูปตัวอย่าง')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'open_quest', questId))
        .setLabel('กลับหน้าเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildRequirementEditSelectComponents(questId, requirements = []) {
  const options = requirements.slice(0, 25).map((item) => ({
    label: `${item.item_name || item.input_label || item.requirement_type || 'รายการไม่มีชื่อ'}`.slice(0, 100),
    value: item.requirement_id,
    description: `จำนวน ${Number(item.required_quantity || 0) > 0 ? item.required_quantity : 0}`.slice(0, 100)
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(buildCustomId('admin_select', 'edit_requirement', questId))
        .setPlaceholder(requirements.length ? 'เลือกรายการที่ต้องการแก้' : 'ไม่พบรายการ')
        .setDisabled(!requirements.length)
        .addOptions(options.length ? options : [{ label: 'ไม่พบรายการ', value: 'NO_REQUIREMENT', description: 'ไม่มีข้อมูล' }])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'open_quest', questId))
        .setLabel('กลับหน้าเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildRewardEditSelectComponents(questId, rewards = []) {
  const options = rewards.slice(0, 25).map((item) => ({
    label: `${item.reward_display_text || item.reward_item_name || item.discord_role_name || item.reward_type || 'รางวัลไม่มีชื่อ'}`.slice(0, 100),
    value: item.reward_id,
    description: `${item.reward_type || 'ไม่มีประเภท'}`.slice(0, 100)
  }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(buildCustomId('admin_select', 'edit_reward', questId))
        .setPlaceholder(rewards.length ? 'เลือกรางวัลที่ต้องการแก้' : 'ไม่พบรายการ')
        .setDisabled(!rewards.length)
        .addOptions(options.length ? options : [{ label: 'ไม่พบรายการ', value: 'NO_REWARD', description: 'ไม่มีข้อมูล' }])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('admin', 'open_quest', questId))
        .setLabel('กลับหน้าเควส')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildAdminHomeButtons,
  buildPanelManagementButtons,
  buildMasterHomeButtons,
  buildProfessionSelectComponents,
  buildLevelSelectComponents,
  buildQuestSelectComponents,
  buildQuestSearchResultComponents,
  buildQuestDetailButtons,
  buildQuestImageManagerButtons,
  buildRequirementEditSelectComponents,
  buildRewardEditSelectComponents
};
