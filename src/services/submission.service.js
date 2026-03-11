const { withTransaction } = require('../db/pool');
const { findProfessionByCode, findCurrentMainQuestByProfession, findRepeatableQuestsByProfession, findQuestById } = require('../db/queries/questMaster.repo');
const { findPlayerByDiscordId, createPlayerProfile, updatePlayerNames } = require('../db/queries/playerProfile.repo');
const {
  findPlayerProfession,
  upsertPlayerProfession,
  upsertMainProgress,
  findRepeatableState,
  upsertRepeatableState
} = require('../db/queries/mainProgress.repo');
const { createSubmission, insertSubmissionAttachment } = require('../db/queries/submission.repo');

async function submitQuest({
  discordUserId,
  discordUsername,
  discordDisplayName,
  professionCode,
  submissionMode,
  ingameName,
  submissionText,
  attachments = []
}) {
  return withTransaction(async (client) => {
    const profession = await findProfessionByCode(professionCode, client);
    if (!profession) {
      throw new Error(`Profession not found: ${professionCode}`);
    }

    let playerProfile = await findPlayerByDiscordId(discordUserId, client);
    if (!playerProfile) {
      playerProfile = await createPlayerProfile({
        discordUserId,
        discordUsername,
        discordDisplayName,
        ingameName
      }, client);
    } else {
      playerProfile = await updatePlayerNames({
        playerId: playerProfile.player_id,
        discordUsername,
        discordDisplayName,
        ingameName
      }, client);
    }

    let quest;

    if (submissionMode === 'MAIN') {
      let playerProfession = await findPlayerProfession(playerProfile.player_id, profession.profession_id, client);

      if (!playerProfession || !playerProfession.current_main_quest_id) {
        const firstQuest = await findCurrentMainQuestByProfession(professionCode, client);
        if (!firstQuest) {
          throw new Error(`Main quest not found for profession ${professionCode}`);
        }

        playerProfession = await upsertPlayerProfession({
          playerId: playerProfile.player_id,
          professionId: profession.profession_id,
          currentMainQuestId: firstQuest.quest_id,
          currentMainLevel: firstQuest.quest_level,
          isUnlocked: true
        }, client);

        quest = firstQuest;
      } else {
        quest = await findQuestById(playerProfession.current_main_quest_id, client);
      }

      if (!quest) {
        throw new Error('Current main quest not found');
      }
    } else if (submissionMode === 'REPEATABLE') {
      const repeatableQuests = await findRepeatableQuestsByProfession(professionCode, client);
      quest = repeatableQuests[0] || null;

      if (!quest) {
        throw new Error(`Repeatable quest not found for profession ${professionCode}`);
      }

      const state = await findRepeatableState(playerProfile.player_id, profession.profession_id, quest.quest_id, client);
      if (state?.state_status === 'COOLDOWN' && state.next_available_at && new Date(state.next_available_at) > new Date()) {
        throw new Error(`Quest ยังติดคูลดาวน์ถึง ${new Date(state.next_available_at).toLocaleString('th-TH')}`);
      }
    } else {
      throw new Error(`Unsupported submission mode: ${submissionMode}`);
    }

    const submission = await createSubmission({
      playerId: playerProfile.player_id,
      professionId: profession.profession_id,
      questId: quest.quest_id,
      submissionType: submissionMode,
      playerIngameName: ingameName,
      submissionText
    }, client);

    for (const attachment of attachments) {
      await insertSubmissionAttachment({
        submissionId: submission.submission_id,
        fileUrl: attachment.url,
        fileName: attachment.name,
        fileType: attachment.contentType,
        discordAttachmentId: attachment.id
      }, client);
    }

    if (submissionMode === 'MAIN') {
      await upsertMainProgress({
        playerId: playerProfile.player_id,
        professionId: profession.profession_id,
        questId: quest.quest_id,
        progressStatus: 'PENDING_REVIEW',
        incrementSubmission: true
      }, client);
    }

    if (submissionMode === 'REPEATABLE') {
      await upsertRepeatableState({
        playerId: playerProfile.player_id,
        professionId: profession.profession_id,
        questId: quest.quest_id,
        stateStatus: 'PENDING_REVIEW'
      }, client);
    }

    return {
      submission,
      quest,
      playerProfile,
      profession
    };
  });
}

module.exports = {
  submitQuest
};
