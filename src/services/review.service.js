const {
  findSubmissionById,
  updateSubmissionStatus
} = require('../db/queries/submission.repo');

const {
  insertReviewLog
} = require('../db/queries/review.repo');

async function approveSubmission(submissionId, reviewerId) {
  const submission = await findSubmissionById(submissionId);

  if (!submission) {
    throw new Error('Submission not found');
  }

  await updateSubmissionStatus(submissionId, 'APPROVED');

  await insertReviewLog({
    submissionId,
    actionType: 'APPROVE',
    actionBy: reviewerId
  });

  return submission;
}

async function rejectSubmission(submissionId, reviewerId, remark) {
  await updateSubmissionStatus(submissionId, 'REJECTED');

  await insertReviewLog({
    submissionId,
    actionType: 'REJECT',
    actionBy: reviewerId,
    remark
  });
}

async function requestRevision(submissionId, reviewerId, remark) {
  await updateSubmissionStatus(submissionId, 'REVISION_REQUIRED');

  await insertReviewLog({
    submissionId,
    actionType: 'REQUEST_REVISION',
    actionBy: reviewerId,
    remark
  });
}

module.exports = {
  approveSubmission,
  rejectSubmission,
  requestRevision
};
