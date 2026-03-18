const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { buildCustomId } = require('../../utils/customId');

function buildGlobalQuestPanelComponents(quest, runtime = {}) {
  if (!quest.is_active || !runtime.acceptingSubmissions) {
    return [];
  }

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('panel', 'submit_global', quest.quest_id))
        .setLabel(quest.button_label || 'ส่งเควส')
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

module.exports = { buildGlobalQuestPanelComponents };
