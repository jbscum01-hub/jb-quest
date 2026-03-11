const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

function buildAdminPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_home')
        .setLabel('Panel Management')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('Master Data')
        .setStyle(ButtonStyle.Success)
    )
  ];
}

function buildPanelManagementButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:deploy_panels')
        .setLabel('Deploy Player Panels')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quest:admin:refresh_panels')
        .setLabel('Refresh Player Panels')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:repair_panels')
        .setLabel('Repair Missing Panels')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:refresh_current_quest_view')
        .setLabel('Refresh Current Quest View')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:panel_status')
        .setLabel('Panel Status')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('Back')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildMasterHomeButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:browse_quest')
        .setLabel('Browse Quest')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quest:admin:search_quest')
        .setLabel('Search Quest')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:create_quest')
        .setLabel('Create Quest')
        .setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:home')
        .setLabel('Back')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildProfessionSelect(professions) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('quest:admin:master_profession_select')
        .setPlaceholder('เลือกสายอาชีพ')
        .addOptions(
          professions.slice(0, 25).map((profession) => ({
            label: profession.profession_name_th,
            description: profession.profession_code,
            value: profession.profession_id
          }))
        )
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('Back')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildLevelSelect(professionId, levels) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`quest:admin:master_level_select:${professionId}`)
        .setPlaceholder('เลือกเลเวลเควส')
        .addOptions(
          levels.slice(0, 25).map((level) => ({
            label: `Lv.${level}`,
            value: String(level)
          }))
        )
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quest:admin:browse_quest')
        .setLabel('Back')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestSelect(professionId, level, quests) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`quest:admin:master_quest_select:${professionId}:${level}`)
        .setPlaceholder('เลือกเควส')
        .addOptions(
          quests.slice(0, 25).map((quest) => ({
            label: quest.quest_name.slice(0, 100),
            description: quest.quest_code.slice(0, 100),
            value: quest.quest_id
          }))
        )
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:browse_levels:${professionId}`)
        .setLabel('Back')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestDetailButtons(questId, professionId, level) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_requirements:${questId}`)
        .setLabel('View Requirements')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_rewards:${questId}`)
        .setLabel('View Rewards')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_dependency:${questId}`)
        .setLabel('View Dependency')
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:view_images:${questId}`)
        .setLabel('View Example Images')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_description:${questId}`)
        .setLabel('Edit Description')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_dependency:${questId}`)
        .setLabel('Edit Dependency')
        .setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_requirements:${questId}`)
        .setLabel('Edit Requirements')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:edit_rewards:${questId}`)
        .setLabel('Edit Rewards')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_image:${questId}`)
        .setLabel('Add Example Image')
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_requirement:${questId}`)
        .setLabel('Add Requirement')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:add_reward:${questId}`)
        .setLabel('Add Reward')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quest:admin:toggle_active:${questId}`)
        .setLabel('Toggle Active')
        .setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:browse_quests:${professionId}:${level}`)
        .setLabel('Back to Quest List')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('Back to Master Home')
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

function buildQuestViewBackButtons(questId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`quest:admin:quest_detail:${questId}`)
        .setLabel('Back to Quest Detail')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('quest:admin:master_home')
        .setLabel('Back to Master Home')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

module.exports = {
  buildAdminPanelButtons,
  buildPanelManagementButtons,
  buildMasterHomeButtons,
  buildProfessionSelect,
  buildLevelSelect,
  buildQuestSelect,
  buildQuestDetailButtons,
  buildQuestViewBackButtons
};
