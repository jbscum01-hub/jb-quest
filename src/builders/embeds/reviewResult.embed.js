const { EmbedBuilder } = require('discord.js');
const { getReviewColor } = require('../../utils/questColor.util');

function buildReviewResultEmbed({ action, submission, reviewerTag, reviewNote, rewardSummary }) {
  const actionMap = {
    approve: 'อนุมัติ',
    revision: 'ขอแก้ไข',
    reject: 'ปฏิเสธ',
    reward: 'ดูรางวัล'
  };

  const lines = [
    `Submission ID: ${submission.submission_id}`,
    `ผู้เล่น: ${submission.discord_display_name || submission.discord_username || '-'}`,
    `สายอาชีพ: ${submission.profession_code || '-'}`,
    `เควส: ${submission.quest_name || '-'}`,
    `ผู้ตรวจ: ${reviewerTag || '-'}`,
    `หมายเหตุ: ${reviewNote || '-'}`
  ];

  if (rewardSummary) {
    lines.push('', 'รางวัล', rewardSummary);
  }

  return new EmbedBuilder()
    .setColor(getReviewColor({ quest: submission, action }))
    .setTitle(`🛠️ ผลการตรวจเควส: ${actionMap[action] || action}`)
    .setDescription(lines.join('\n'))
    .setTimestamp();
}

module.exports = {
  buildReviewResultEmbed
};
