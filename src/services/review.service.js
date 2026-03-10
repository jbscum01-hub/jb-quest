const { SUBMISSION_STATES } = require('../constants/questStates');

  if (action === 'reject') {
    return updateMainProgressToRejected({
      playerProfileId: submission.player_profile_id,
      professionCode: submission.profession_code,
      currentQuestId: submission.quest_id,
      submissionId: submission.id
    });
  }

  return null;
}

async function reviewSubmission({
  submissionId,
  action,
  reviewerDiscordId,
  reviewerDiscordTag,
  reviewNote = null
}) {
  const submission = await findSubmissionById(submissionId);

  if (!submission) {
    throw new Error('ไม่พบ submission ที่ต้องการตรวจ');
  }

  if (submission.submission_state === SUBMISSION_STATES.APPROVED && action === 'approve') {
    throw new Error('submission นี้ถูกอนุมัติแล้ว');
  }

  const nextSubmissionState = mapReviewActionToSubmissionState(action);

  if (!nextSubmissionState) {
    throw new Error('action review ไม่ถูกต้อง');
  }

  const updatedSubmission = await updateSubmissionState({
    submissionId,
    submissionState: nextSubmissionState
  });

  const reviewLog = await insertSubmissionReviewLog({
    submissionId,
    actionType: action.toUpperCase(),
    reviewerDiscordId,
    reviewerDiscordTag,
    reviewNote
  });

  const progress = await updateProgressForReviewedSubmission({
    action,
    submission
  });

  return {
    submission,
    updatedSubmission,
    reviewLog,
    progress
  };
}

module.exports = {
  reviewSubmission
};
