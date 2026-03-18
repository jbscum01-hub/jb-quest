const { withTransaction } = require('../db/pool');
const {
  findProfessionByCode,
  findRepeatableQuestsByProfession,
  findQuestById
} = require('../db/queries/questMaster.repo');

const {
  findPlayerByDiscordId,
  createPlayerProfile,
  updatePlayerNames
} = require('../db/queries/playerProfile.repo');

const {
  upsertMainProgress,
  findRepeatableState,
  upsertRepeatableState
} = require('../db/queries/mainProgress.repo');

const {
  createSubmission,
  insertSubmissionAttachment,
  findPendingSubmissionByPlayer,
  countApprovedSubmissionsInWindow
} = require('../db/queries/submission.repo');
const { canSubmitLegendary, markLegendarySubmissionPending } = require('./legendary.service');

const {
  resolveCurrentMainQuestByPlayer
} = require('./questProgress.service');

async function submitQuest({
  discordUserId,
  discordUsername,
  discordDisplayName,
  professionCode = null,
  questId = null,
  submissionMode,
  ingameName,
  submissionText,
  attachments = []
}) {
  return withTransaction(async (client) => {
    const profession = professionCode ? await findProfessionByCode(professionCode, client) : null;

    if (professionCode && !profession) {
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
    let effectiveProfessionId = profession?.profession_id || null;
    let effectiveSubmissionType = submissionMode;

    if (submissionMode === 'MAIN') {
      const pendingSubmission = await findPendingSubmissionByPlayer({
        playerId: playerProfile.player_id,
        professionId: profession.profession_id,
        submissionType: submissionMode
      }, client);

      if (pendingSubmission) {
        throw new Error('คุณมีเควสที่ส่งค้างตรวจอยู่แล้ว กรุณารอแอดมินตรวจสอบก่อน');
      }

      const resolved = await resolveCurrentMainQuestByPlayer(discordUserId, professionCode, client);
      quest = resolved.quest || null;

      if (!quest && resolved.completedAllMain) {
        throw new Error('คุณจบเควสหลักทั้งหมดแล้ว รออัปเดตเควสใหม่');
      }

      if (!quest) {
        throw new Error('Current main quest not found');
      }
    } else if (submissionMode === 'REPEATABLE') {
      const pendingSubmission = await findPendingSubmissionByPlayer({
        playerId: playerProfile.player_id,
        professionId: profession.profession_id,
        submissionType: submissionMode
      }, client);

      if (pendingSubmission) {
        throw new Error('คุณมีเควสที่ส่งค้างตรวจอยู่แล้ว กรุณารอแอดมินตรวจสอบก่อน');
      }

      const repeatableQuests = await findRepeatableQuestsByProfession(professionCode, client);
      quest = repeatableQuests[0] || null;

      if (!quest) {
        throw new Error(`Repeatable quest not found for profession ${professionCode}`);
      }

      const state = await findRepeatableState(
        playerProfile.player_id,
        profession.profession_id,
        quest.quest_id,
        client
      );

      if (
        state?.state_status === 'COOLDOWN' &&
        state.next_available_at &&
        new Date(state.next_available_at) > new Date()
      ) {
        throw new Error(`Quest ยังติดคูลดาวน์ถึง ${new Date(state.next_available_at).toLocaleString('th-TH')}`);
      }

      const submissionLimitCount = Number(quest.submission_limit_count || 0);
      const submissionLimitPeriodDays = Number(quest.submission_limit_period_days || 0);

      if (submissionLimitCount > 0 && submissionLimitPeriodDays > 0) {
        const approvedCount = await countApprovedSubmissionsInWindow({
          playerId: playerProfile.player_id,
          professionId: profession.profession_id,
          questId: quest.quest_id,
          periodDays: submissionLimitPeriodDays
        }, client);

        if (approvedCount >= submissionLimitCount) {
          throw new Error(`เควสนี้ส่งได้สูงสุด ${submissionLimitCount} ครั้ง ภายใน ${submissionLimitPeriodDays} วัน`);
        }
      }
    } else if (submissionMode === 'GLOBAL') {
      quest = await findQuestById(questId, client);

      if (!quest || !['TIMED', 'LEGENDARY'].includes(quest.category_code)) {
        throw new Error('ไม่พบเควสพิเศษ/เควสตำนานที่ต้องการส่ง');
      }

      effectiveSubmissionType = quest.category_code;

      const pendingSubmission = await findPendingSubmissionByPlayer({
        playerId: playerProfile.player_id,
        professionId: null,
        submissionType: effectiveSubmissionType,
        questId: quest.quest_id
      }, client);

      if (pendingSubmission) {
        throw new Error('คุณมีเควสนี้ที่ส่งค้างตรวจอยู่แล้ว กรุณารอแอดมินตรวจสอบก่อน');
      }

      if (!quest.is_active) {
        throw new Error('เควสนี้ปิดรับอยู่');
      }

      if (quest.category_code === 'TIMED') {
        const now = new Date();
        if (quest.start_at && now < new Date(quest.start_at)) throw new Error('เควสนี้ยังไม่ถึงเวลาเปิด');
        if (quest.end_at && now > new Date(quest.end_at)) throw new Error('เควสนี้หมดเวลาแล้ว');

        const submissionLimitCount = Number(quest.submission_limit_count || 0);
        const submissionLimitPeriodDays = Number(quest.submission_limit_period_days || 0);
        if (submissionLimitCount > 0 && submissionLimitPeriodDays > 0) {
          const approvedCount = await countApprovedSubmissionsInWindow({
            playerId: playerProfile.player_id,
            professionId: null,
            questId: quest.quest_id,
            periodDays: submissionLimitPeriodDays
          }, client);
          if (approvedCount >= submissionLimitCount) {
            throw new Error(`เควสนี้ส่งได้สูงสุด ${submissionLimitCount} ครั้ง ภายใน ${submissionLimitPeriodDays} วัน`);
          }
        }
      }

      if (quest.category_code === 'LEGENDARY') {
        const submitCheck = await canSubmitLegendary({
          playerId: playerProfile.player_id,
          questId: quest.quest_id
        }, client);

        if (!submitCheck.allowed) {
          throw new Error(submitCheck.message || 'ยังไม่สามารถส่งเควสตำนานนี้ได้');
        }
      }
    } else {
      throw new Error(`Unsupported submission mode: ${submissionMode}`);
    }

    const submission = await createSubmission({
      playerId: playerProfile.player_id,
      professionId: effectiveProfessionId,
      questId: quest.quest_id,
      submissionType: effectiveSubmissionType,
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

    if (submissionMode === 'GLOBAL' && quest.category_code === 'LEGENDARY') {
      await markLegendarySubmissionPending({
        playerId: playerProfile.player_id,
        questId: quest.quest_id
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
