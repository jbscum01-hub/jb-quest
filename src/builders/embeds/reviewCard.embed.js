const { EmbedBuilder } = require('discord.js');

function buildReviewCardEmbed({
  submission,
  quest,
  playerProfile,
  memberDisplayName
}) {
  const questName =
    quest?.quest_name_th ||
    quest?.quest_name ||
    quest?.quest_code ||
    'ไม่ระบุชื่อเควส';

  return new EmbedBuilder()
    .setTitle('📨 มีรายการส่งเควสใหม่')
    .setDescription(
      [
        `**ผู้เล่น:** ${memberDisplayName || playerProfile?.discord_username || '-'}`,
        `**สายอาชีพ:** ${submission.profession_code || '-'}`,
        `**ประเภทการส่ง:** ${submission.submission_type || '-'}`,
        `**สถานะ:** ${submission.submission_state || '-'}`,
        '',
        `**เควส:** ${questName}`,
        `**รหัสเควส:** ${quest?.quest_code || '-'}`,
        '',
        `**หัวข้อ:** ${submission.title || '-'}`,
        `**รายละเอียด:** ${submission.description || '-'}`,
        '',
        `**หลักฐาน / โน้ต:**`,
        `${submission.proof_text || '-'}`
      ].join('\n')
    )
    .setFooter({
      text: `Submission ID: ${submission.id}`
    })
    .setTimestamp(new Date(submission.created_at || Date.now()));
}

module.exports = {
  buildReviewCardEmbed
};
