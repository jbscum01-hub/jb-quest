const { withTransaction } = require('../db/pool');
const { findSubmissionById, updateSubmissionReview } = require('../db/queries/submission.repo');
const { insertReviewLog, insertCompletionLog } = require('../db/queries/review.repo');
const {
  findQuestRewards
} = require('../db/queries/questMaster.repo');
const {
  upsertMainProgress,
  upsertRepeatableState
} = require('../db/queries/mainProgress.repo');
const {
  resolveCurrentMainQuestByPlayer
} = require('./questProgress.service');

function buildRewardSummary(rewards) {
  if (!rewards.length) return 'ไม่มี reward ในฐานข้อมูล';

  return rewards.map((row) => {
    if (row.reward_display_text) return `• ${row.reward_display_text}`;
    if (row.reward_item_name && row.reward_quantity) return `• ${row.reward_item_name} x${row.reward_quantity}`;
    if (row.reward_type === 'SCUM_MONEY' && row.reward_value_number) return `• เงิน ${row.reward_value_number}`;
    if (row.reward_type === 'FAME_POINT' && row.reward_value_number) return `• Fame ${row.reward_value_number}`;
    if (row.reward_type === 'DISCORD_ROLE' && row.discord_role_name) return `• ยศ ${row.discord_role_name}`;
    return `• ${row.reward_type}`;
  }).join('\n');
}

async function reviewSubmission({
  submissionId,
  action,
  reviewerDiscordId,
  reviewerDiscordTag,
  reviewNote = null
}) {
  return withTransaction(async (client) => {
    const submission = await findSubmissionById(submissionId, client);

    if (!submission) {
      throw new Error('ไม่พบ submission ที่ต้องการตรวจ');
    }

    if (submission.submission_status !== 'PENDING_REVIEW') {
      throw new Error('submission นี้ไม่ได้อยู่ในสถานะรอตรวจ');
    }

    let updatedSubmission;
    let actionType;

    if (action === 'approve') {
      updatedSubmission = await updateSubmissionReview({
        submissionId,
        status: 'APPROVED',
        reviewedBy: reviewerDiscordTag,
        reviewResult: 'APPROVED',
        reviewRemark: reviewNote
      }, client);
      actionType = 'APPROVE';

      if (submission.submission_type === 'MAIN') {
        await upsertMainProgress({
          playerId: submission.player_id,
          professionId: submission.profession_id,
          questId: submission.quest_id,
          progressStatus: 'COMPLETED',
          reviewedBy: reviewerDiscordTag,
          reviewRemark: reviewNote,
          incrementSubmission: false
        }, client);

        await insertCompletionLog({
          playerId: submission.player_id,
          professionId: submission.profession_id,
          questId: submission.quest_id,
          submissionId,
          completedBy: reviewerDiscordTag,
          completionType: 'MAIN',
          remark: reviewNote
        }, client);

        await resolveCurrentMainQuestByPlayer(
          submission.discord_user_id,
          submission.profession_code,
          client
        );
      }

      if (submission.submission_type === 'REPEATABLE') {
        await upsertRepeatableState({
          playerId: submission.player_id,
          professionId: submission.profession_id,
          questId: submission.quest_id,
          stateStatus: 'COOLDOWN',
          reviewedBy: reviewerDiscordTag,
          reviewRemark: reviewNote,
          nextAvailableAt: null,
          incrementRepeat: true
        }, client);

        await client.query(
          `
          UPDATE public.tb_quest_player_repeatable_state
          SET next_available_at = NOW() + (($4 || ' days')::interval),
              updated_at = NOW()
          WHERE player_id = $1
            AND profession_id = $2
            AND quest_id = $3
          `,
          [
            submission.player_id,
            submission.profession_id,
            submission.quest_id,
            submission.repeat_cooldown_days || 1
          ]
        );

        await insertCompletionLog({
          playerId: submission.player_id,
          professionId: submission.profession_id,
          questId: submission.quest_id,
          submissionId,
          completedBy: reviewerDiscordTag,
          completionType: 'REPEATABLE',
          remark: reviewNote
        }, client);
      }
    } else if (action === 'revision') {
      updatedSubmission = await updateSubmissionReview({
        submissionId,
        status: 'REVISION_REQUIRED',
        reviewedBy: reviewerDiscordTag,
        reviewResult: 'REVISION_REQUIRED',
        reviewRemark: reviewNote
      }, client);
      actionType = 'REQUEST_REVISION';

      if (submission.submission_type === 'MAIN') {
        await upsertMainProgress({
          playerId: submission.player_id,
          professionId: submission.profession_id,
          questId: submission.quest_id,
          progressStatus: 'REVISION_REQUIRED',
          reviewedBy: reviewerDiscordTag,
          reviewRemark: reviewNote
        }, client);
      }

      if (submission.submission_type === 'REPEATABLE') {
        await upsertRepeatableState({
          playerId: submission.player_id,
          professionId: submission.profession_id,
          questId: submission.quest_id,
          stateStatus: 'REVISION_REQUIRED',
          reviewedBy: reviewerDiscordTag,
          reviewRemark: reviewNote
        }, client);
      }
    } else {
      throw new Error('ไม่รองรับ action นี้');
    }

    await insertReviewLog({
      submissionId,
      actionType,
      actionBy: reviewerDiscordTag || reviewerDiscordId,
      actionRemark: reviewNote
    }, client);

    const refreshedSubmission = await findSubmissionById(submissionId, client);
    const rewardSummary = buildRewardSummary(await findQuestRewards(submission.quest_id, client));

    return {
      submission: refreshedSubmission || updatedSubmission,
      rewardSummary
    };
  });
}

module.exports = {
  reviewSubmission
};
