const {
  createSubmission
} = require('../db/queries/submission.repo');

async function submitQuest({
  playerId,
  professionId,
  questId,
  submissionType,
  ingameName,
  text
}) {
  return createSubmission({
    playerId,
    professionId,
    questId,
    submissionType,
    ingameName,
    submissionText: text
  });
}

module.exports = {
  submitQuest
};
