const { EmbedBuilder } = require('discord.js');

function buildReviewCardEmbed({ submission, quest, playerProfile, memberDisplayName }) {
  return new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('📝 Quest Submission Review')
    .setDescription([
      `ผู้เล่น: ${memberDisplayName || playerProfile?.discord_display_name || playerProfile?.discord_username || '-'}`,
      `Discord: ${playerProfile?.discord_username || '-'}`,
      `สายอาชีพ: ${quest.profession_code || '-'}`,
      `ประเภท: ${submission.submission_type || '-'}`,
      `สถานะ: ${submission.submission_status || '-'}`
    ].join('\n'))
    .addFields(
      { name: 'เควส', value: `${quest.quest_name}\nรหัส: ${quest.quest_code || '-'}`, inline: false },
      { name: 'ชื่อตัวละคร', value: submission.player_ingame_name || '-', inline: false },
      { name: 'รายละเอียดที่ส่ง', value: submission.submission_text || '-', inline: false }
    )
    .setFooter({ text: `Submission ID: ${submission.submission_id}` })
    .setTimestamp(new Date(submission.submitted_at || Date.now()));
}

module.exports = {
  buildReviewCardEmbed
};
