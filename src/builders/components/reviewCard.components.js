const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildReviewButtons(submissionId) {

  return [
    new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId(`quest:review:approve:${submissionId}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`quest:review:reject:${submissionId}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(`quest:review:revision:${submissionId}`)
        .setLabel('Revision')
        .setStyle(ButtonStyle.Secondary)

    )
  ];

}

module.exports = {
  buildReviewButtons
};
