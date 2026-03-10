const { SUBMISSION_STATES } = require('../constants/questStates');
const {
  findOrCreatePlayerProfile
} = require('../db/queries/playerProfile.repo');
const {
  findCurrentMainQuestByProfession,
  findRepeatableQuestsByProfession
} = require('../db/queries/questMaster.repo');
const { createSubmission } = require('../db/queries/submission.repo');

async function resolveQuestForSubmission({ professionCode, submissionMode }) {
  if (submissionMode === 'MAIN') {
    return findCurrentMainQuestByProfession(professionCode);
  }

  if (submissionMode === 'REPEATABLE') {
    const quests = await findRepeatableQuestsByProfession(professionCode);
    return quests[0] || null;
  }

  return null;
}

async function submitQuest({
  discordUserId,
  discordUsername,
  professionCode,
  submissionMode,
  title,
  description,
  proofText
}) {
  const playerProfile = await findOrCreatePlayerProfile({
    discordUserId,
    discordUsername
  });

  const quest = await resolveQuestForSubmission({
    professionCode,
    submissionMode
  });

  if (!quest) {
    throw new Error('ไม่พบเควสที่สามารถส่งได้สำหรับสายนี้');
  }

  const submission = await createSubmission({
    playerProfileId: playerProfile.id,
    questId: quest.id,
    submissionType: submissionMode,
    submissionState: SUBMISSION_STATES.PENDING_REVIEW,
    professionCode,
    title,
    description,
    proofText,
    submittedByDiscordId: discordUserId,
    submittedByDiscordTag: discordUsername
  });

  return {
    playerProfile,
    quest,
    submission
  };
}

module.exports = {
  resolveQuestForSubmission,
  submitQuest
};
