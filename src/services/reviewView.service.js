const { EmbedBuilder } = require('discord.js');
const { findSubmissionById } = require('../db/queries/submission.repo');
const { findQuestRequirements, findQuestRewards, findQuestGuideMedia } = require('../db/queries/questMaster.repo');

function formatRequirement(row) {
  if (row.requirement_type === 'IMAGE') return '• ส่งภาพหลักฐาน';
  if (row.requirement_type === 'INGAME_NAME') return '• ระบุชื่อตัวละคร';
  if (row.display_text) return `• ${row.display_text}`;
  return '• -';
}

function buildRewardLines(rewards) {
  const summary = [];
  const commands = [];

  for (const row of rewards) {
    if (row.reward_display_text) summary.push(`• ${row.reward_display_text}`);
    else if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_id) summary.push(`• Role ID: ${row.discord_role_id}`);
    else summary.push(`• ${row.reward_type}`);

    if (row.reward_type === 'SCUM_ITEM' && row.reward_spawn_command_template) {
      commands.push(row.reward_spawn_command_template);
    }
  }

  return {
    summaryText: summary.length ? summary.join('\n') : 'ไม่มี reward ในฐานข้อมูล',
    commandText: commands.length ? commands.join('\n') : 'ไม่มีคำสั่งไอเทมสำหรับเควสนี้'
  };
}

async function buildRequirementEmbedBySubmissionId(submissionId) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw new Error('ไม่พบ submission');

  const requirements = await findQuestRequirements(submission.quest_id);
  const media = await findQuestGuideMedia(submission.quest_id);
  const guideImage = media[0]?.media_url || null;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🔎 ตรวจสอบเงื่อนไขเควส')
    .addFields(
      { name: 'เควส', value: submission.quest_name || '-', inline: false },
      { name: 'สายอาชีพ', value: submission.profession_name_th || submission.profession_code || '-', inline: false },
      { name: 'รายการที่ต้องส่ง', value: requirements.length ? requirements.map(formatRequirement).join('\n') : '-', inline: false }
    )
    .setFooter({ text: `Submission ID: ${submission.submission_id}` })
    .setTimestamp();

  if (guideImage) embed.setImage(guideImage);
  return embed;
}

async function buildRewardEmbedBySubmissionId(submissionId) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) throw new Error('ไม่พบ submission');

  const rewards = await findQuestRewards(submission.quest_id);
  const { summaryText, commandText } = buildRewardLines(rewards);

  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle('🎁 รางวัลเควส')
    .addFields(
      { name: 'เควส', value: submission.quest_name || '-', inline: false },
      { name: 'สรุปรางวัล', value: summaryText, inline: false },
      { name: 'คำสั่งสำหรับแอดมิน', value: `\`\`\`txt\n${commandText}\n\`\`\``, inline: false }
    )
    .setFooter({ text: `Submission ID: ${submission.submission_id}` })
    .setTimestamp();
}

module.exports = { buildRequirementEmbedBySubmissionId, buildRewardEmbedBySubmissionId };
