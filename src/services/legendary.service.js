const { withTransaction } = require('../db/pool');
const { findQuestById } = require('../db/queries/questMaster.repo');
const { findLatestSubmissionByPlayerAndQuest } = require('../db/queries/submission.repo');
const {
  findLegendaryStateByPlayerAndQuest,
  lockLegendaryStateByPlayerAndQuest,
  insertLegendaryState,
  updateLegendaryState
} = require('../db/queries/legendaryState.repo');

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatThaiDateTime(value) {
  const date = toDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

function getCooldownDays(quest) {
  return Number(quest.legendary_claim_cooldown_days || quest.duration_days || 7);
}

function buildRemainingText(nextClaimAt, now = new Date()) {
  const nextDate = toDate(nextClaimAt);
  if (!nextDate) return '-';
  const diffMs = nextDate.getTime() - now.getTime();
  if (diffMs <= 0) return 'พร้อมเคลมแล้ว';

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} วัน`);
  if (hours > 0) parts.push(`${hours} ชั่วโมง`);
  if (minutes > 0 || !parts.length) parts.push(`${minutes} นาที`);
  return parts.join(' ');
}

async function ensureLegendaryQuest(questId, client) {
  const quest = await findQuestById(questId, client);
  if (!quest || quest.category_code !== 'LEGENDARY') {
    throw new Error('ไม่พบเควสตำนานนี้');
  }
  return quest;
}

async function canSubmitLegendary({ playerId, questId }, client) {
  const quest = await ensureLegendaryQuest(questId, client);
  const state = await findLegendaryStateByPlayerAndQuest({ playerId, questId }, client);
  const latestSubmission = await findLatestSubmissionByPlayerAndQuest({ playerId, questId }, client);

  if (state?.is_unlocked) {
    return {
      allowed: false,
      reason: 'ALREADY_UNLOCKED',
      message: 'คุณผ่านเควสตำนานนี้แล้ว ไม่ต้องส่งใหม่ ให้ไปเคลมจากห้องเคลมตำนานแทน',
      quest,
      state,
      latestSubmission
    };
  }

  if (!latestSubmission) {
    return { allowed: true, reason: 'FIRST_SUBMISSION', quest, state, latestSubmission };
  }

  if (latestSubmission.submission_status === 'REVISION_REQUIRED') {
    return { allowed: true, reason: 'REVISION_REQUIRED', quest, state, latestSubmission };
  }

  if (latestSubmission.submission_status === 'PENDING_REVIEW') {
    return {
      allowed: false,
      reason: 'PENDING_REVIEW',
      message: 'คุณมีเควสตำนานนี้ที่ส่งค้างตรวจอยู่แล้ว กรุณารอแอดมินตรวจสอบก่อน',
      quest,
      state,
      latestSubmission
    };
  }

  if (latestSubmission.submission_status === 'APPROVED') {
    return {
      allowed: false,
      reason: 'APPROVED_ALREADY',
      message: 'คุณผ่านเควสตำนานนี้แล้ว ไม่สามารถส่งซ้ำได้',
      quest,
      state,
      latestSubmission
    };
  }

  return {
    allowed: false,
    reason: 'UNKNOWN_STATE',
    message: 'ยังไม่สามารถส่งเควสตำนานนี้ได้',
    quest,
    state,
    latestSubmission
  };
}

async function markLegendarySubmissionPending({ playerId, questId }, client) {
  const state = await findLegendaryStateByPlayerAndQuest({ playerId, questId }, client);
  if (!state) {
    return insertLegendaryState({
      playerId,
      questId,
      claimStatus: 'PENDING_REVIEW',
      isUnlocked: false
    }, client);
  }

  if (state.is_unlocked) return state;

  return updateLegendaryState({
    legendaryStateId: state.legendary_state_id,
    claimStatus: 'PENDING_REVIEW'
  }, client);
}

async function markLegendaryRevisionRequired({ playerId, questId, reviewedBy = null, reviewRemark = null }, client) {
  const state = await findLegendaryStateByPlayerAndQuest({ playerId, questId }, client);
  if (!state) {
    return insertLegendaryState({
      playerId,
      questId,
      claimStatus: 'REVISION_REQUIRED',
      isUnlocked: false,
      lastReviewedBy: reviewedBy,
      lastReviewRemark: reviewRemark
    }, client);
  }

  if (state.is_unlocked) return state;

  return updateLegendaryState({
    legendaryStateId: state.legendary_state_id,
    claimStatus: 'REVISION_REQUIRED',
    lastReviewedBy: reviewedBy,
    lastReviewRemark: reviewRemark
  }, client);
}

async function activateLegendaryFromApproval({ playerId, questId, submissionId, reviewedBy = null, reviewRemark = null }, client) {
  const quest = await ensureLegendaryQuest(questId, client);
  const cooldownDays = getCooldownDays(quest);
  const now = new Date();
  const nextClaimAt = addDays(now, cooldownDays);

  const state = await findLegendaryStateByPlayerAndQuest({ playerId, questId }, client);
  if (!state) {
    return insertLegendaryState({
      playerId,
      questId,
      claimStatus: 'COOLDOWN',
      isUnlocked: true,
      firstSubmissionId: submissionId,
      unlockedAt: now,
      lastClaimedAt: now,
      nextClaimAvailableAt: nextClaimAt,
      claimCount: 1,
      lastReviewedBy: reviewedBy,
      lastReviewRemark: reviewRemark
    }, client);
  }

  if (state.is_unlocked) return state;

  return updateLegendaryState({
    legendaryStateId: state.legendary_state_id,
    claimStatus: 'COOLDOWN',
    isUnlocked: true,
    firstSubmissionId: submissionId,
    unlockedAt: now,
    lastClaimedAt: now,
    nextClaimAvailableAt: nextClaimAt,
    claimCount: 1,
    lastReviewedBy: reviewedBy,
    lastReviewRemark: reviewRemark
  }, client);
}

async function getLegendaryClaimDetail({ playerId, questId }, client) {
  const quest = await ensureLegendaryQuest(questId, client);
  const state = await findLegendaryStateByPlayerAndQuest({ playerId, questId }, client);
  const latestSubmission = await findLatestSubmissionByPlayerAndQuest({ playerId, questId }, client);
  const now = new Date();

  if (!state && !latestSubmission) {
    return {
      status: 'LOCKED',
      title: quest.quest_name,
      lines: [
        'สถานะ: ยังไม่ปลดล็อก',
        'คุณต้องส่งเควสตำนานนี้ให้ผ่านครั้งแรกก่อน จึงจะใช้ระบบเคลมได้'
      ]
    };
  }

  if (latestSubmission?.submission_status === 'PENDING_REVIEW' && !state?.is_unlocked) {
    return {
      status: 'PENDING_REVIEW',
      title: quest.quest_name,
      lines: [
        'สถานะ: รอตรวจสอบ',
        `ส่งล่าสุด: ${formatThaiDateTime(latestSubmission.submitted_at)}`,
        'ยังไม่สามารถเคลมได้จนกว่าแอดมินจะอนุมัติครั้งแรก'
      ]
    };
  }

  if (latestSubmission?.submission_status === 'REVISION_REQUIRED' && !state?.is_unlocked) {
    return {
      status: 'REVISION_REQUIRED',
      title: quest.quest_name,
      lines: [
        'สถานะ: ขอแก้ไข',
        `ตรวจล่าสุด: ${formatThaiDateTime(latestSubmission.reviewed_at)}`,
        `หมายเหตุ: ${latestSubmission.review_remark || '-'}`,
        'คุณสามารถกลับไปส่งเควสนี้ใหม่ได้อีกครั้ง'
      ]
    };
  }

  if (!state?.is_unlocked) {
    return {
      status: 'LOCKED',
      title: quest.quest_name,
      lines: [
        'สถานะ: ยังไม่ปลดล็อก',
        'คุณต้องผ่านเควสครั้งแรกก่อน จึงจะเคลมรอบถัดไปได้'
      ]
    };
  }

  const nextClaimAt = toDate(state.next_claim_available_at);
  const readyToClaim = nextClaimAt && now >= nextClaimAt;

  return {
    status: readyToClaim ? 'READY_TO_CLAIM' : 'COOLDOWN',
    title: quest.quest_name,
    lines: [
      `สถานะ: ${readyToClaim ? 'พร้อมเคลม' : 'ยังไม่ถึงเวลาเคลม'}`,
      `ปลดล็อกครั้งแรก: ${formatThaiDateTime(state.unlocked_at)}`,
      `เคลมล่าสุด: ${formatThaiDateTime(state.last_claimed_at)}`,
      `เคลมได้อีกเมื่อ: ${formatThaiDateTime(state.next_claim_available_at)}`,
      `เวลาที่เหลือ: ${buildRemainingText(state.next_claim_available_at, now)}`,
      `จำนวนครั้งสะสม: ${Number(state.claim_count || 0)} ครั้ง`
    ],
    quest,
    state,
    readyToClaim
  };
}

async function claimLegendaryReward({ playerId, questId }, client) {
  return withTransaction(async (tx) => {
    const quest = await ensureLegendaryQuest(questId, tx);
    const state = await lockLegendaryStateByPlayerAndQuest({ playerId, questId }, tx);

    if (!state || !state.is_unlocked) {
      throw new Error('คุณยังไม่ผ่านเควสตำนานนี้ครั้งแรก');
    }

    const now = new Date();
    const nextClaimAt = toDate(state.next_claim_available_at);
    if (!nextClaimAt || now < nextClaimAt) {
      throw new Error(`เควสนี้ยังไม่ถึงเวลาเคลมใหม่ สามารถเคลมได้อีกครั้ง ${formatThaiDateTime(nextClaimAt)}`);
    }

    const cooldownDays = getCooldownDays(quest);
    const updated = await updateLegendaryState({
      legendaryStateId: state.legendary_state_id,
      claimStatus: 'COOLDOWN',
      lastClaimedAt: now,
      nextClaimAvailableAt: addDays(now, cooldownDays),
      claimCount: Number(state.claim_count || 0) + 1
    }, tx);

    return {
      quest,
      state: updated,
      claimCount: Number(updated.claim_count || 0),
      lastClaimedAt: updated.last_claimed_at,
      nextClaimAvailableAt: updated.next_claim_available_at
    };
  });
}

module.exports = {
  canSubmitLegendary,
  markLegendarySubmissionPending,
  markLegendaryRevisionRequired,
  activateLegendaryFromApproval,
  getLegendaryClaimDetail,
  claimLegendaryReward,
  formatThaiDateTime
};
