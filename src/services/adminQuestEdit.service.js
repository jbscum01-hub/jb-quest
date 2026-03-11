const {
  updateQuestDescription,
  createQuest,
  addRequirement,
  updateRequirement,
  addReward,
  updateReward,
  replaceDependency,
  addImage,
  toggleQuestActive
} = require('../db/queries/adminQuestEdit.repo');
const { insertAuditLog } = require('../db/queries/adminAudit.repo');

async function updateQuestDescriptionWithAudit(questId, actor, payload) {
  const result = await updateQuestDescription(questId, actor.actorTag, payload);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_DESCRIPTION_UPDATED',
    target: questId,
    meta: result
  });
  return result;
}

async function createQuestWithAudit(actor, payload) {
  const created = await createQuest(payload, actor.actorTag);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_CREATED',
    target: created.quest_id,
    meta: created
  });
  return created;
}

async function addRequirementWithAudit(questId, actor, payload) {
  const created = await addRequirement(questId, payload);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_REQUIREMENT_ADDED',
    target: created.requirement_id,
    meta: created
  });
  return created;
}

async function updateRequirementWithAudit(requirementId, actor, payload) {
  const result = await updateRequirement(requirementId, payload);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_REQUIREMENT_UPDATED',
    target: requirementId,
    meta: result
  });
  return result;
}

async function addRewardWithAudit(questId, actor, payload) {
  const created = await addReward(questId, payload);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_REWARD_ADDED',
    target: created.reward_id,
    meta: created
  });
  return created;
}

async function updateRewardWithAudit(rewardId, actor, payload) {
  const result = await updateReward(rewardId, payload);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_REWARD_UPDATED',
    target: rewardId,
    meta: result
  });
  return result;
}

async function replaceDependencyWithAudit(questId, actor, payload) {
  const result = await replaceDependency(questId, payload);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_DEPENDENCY_UPDATED',
    target: questId,
    meta: result
  });
  return result;
}

async function addImageWithAudit(questId, actor, payload) {
  const created = await addImage(questId, payload);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_MEDIA_ADDED',
    target: created.media_id,
    meta: created
  });
  return created;
}

async function toggleQuestActiveWithAudit(questId, actor) {
  const result = await toggleQuestActive(questId, actor.actorTag);
  await insertAuditLog({
    actorId: actor.actorId,
    actorTag: actor.actorTag,
    action: 'QUEST_ACTIVE_TOGGLED',
    target: questId,
    meta: result
  });
  return result;
}

module.exports = {
  updateQuestDescriptionWithAudit,
  createQuestWithAudit,
  addRequirementWithAudit,
  updateRequirementWithAudit,
  addRewardWithAudit,
  updateRewardWithAudit,
  replaceDependencyWithAudit,
  addImageWithAudit,
  toggleQuestActiveWithAudit
};
