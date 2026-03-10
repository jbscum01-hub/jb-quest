const { EmbedBuilder } = require('discord.js');

function buildReviewCard(submission, quest) {

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Quest Submission')
    .addFields(
      { name: 'Quest', value: quest.quest_name, inline:false },
      { name: 'Player IGN', value: submission.player_ingame_name || '-', inline:true },
      { name: 'Submission', value: submission.submission_text || '-', inline:false }
    )
    .setFooter({
      text:`Submission ID: ${submission.submission_id}`
    })
    .setTimestamp();

}

module.exports = {
  buildReviewCard
};
