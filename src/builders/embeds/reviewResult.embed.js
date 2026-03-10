const { EmbedBuilder } = require('discord.js');

function buildReviewResultEmbed({ action, submission, reviewerTag, reviewNote }) {
  const actionLabelMap = {
    approve: 'อนุมัติ',
    revision: 'ขอแก้ไข',
    reject: 'ปฏิเสธ',
    reward: 'แจกของรางวัล'
  };

  const questName = submission.quest_name_th || submission.quest_name || submission.quest_code || 'ไม่ระบุชื่อเควส';

  return new EmbedBuilder()
    .setTitle(`🛠️ ผลการตรวจเควส: ${actionLabelMap[action] || action}`)
    .setDescription([
      `**Submission ID:** ${submission.id}`,
      `**ผู้เล่น:** ${submission.discord_username || submission.submitted_by_discord_tag || '-'}`,
      `**สายอาชีพ:** ${submission.profession_code || '-'}`,
      `**เควส:** ${questName}`,
      `**รหัสเควส:** ${submission.quest_code || '-'}`,
      `**ผู้ตรวจ:** ${reviewerTag || '-'}`,
      '',
      `**หมายเหตุ:**`,
      `${reviewNote || '-'}`
    ].join('\n'))
    .setTimestamp(new Date());
}

module.exports = {
  buildReviewResultEmbed
};
