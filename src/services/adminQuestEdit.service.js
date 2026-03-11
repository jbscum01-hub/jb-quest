const {
  findQuestByIdForEdit,
  updateQuestDescriptionFields
} = require('../db/queries/adminQuestEdit.repo');
const { insertAdminAudit } = require('../db/queries/adminPanel.repo');

async function updateQuestDescriptionWithAudit({
  questId,
  actorDiscordId,
  actorDiscordTag,
  payload
}) {
  const before = await findQuestByIdForEdit(questId);

  if (!before) {
    throw new Error('ไม่พบเควสที่ต้องการแก้ไข');
  }

  const after = await updateQuestDescriptionFields(questId, {
    questName: payload.questName,
    questDescription: payload.questDescription,
    panelTitle: payload.panelTitle,
    panelDescription: payload.panelDescription,
    buttonLabel: payload.buttonLabel,
    updatedBy: actorDiscordTag || actorDiscordId
  });

  await insertAdminAudit({
    actionType: 'QUEST_DESCRIPTION_UPDATED',
    actorDiscordId,
    actorDiscordTag,
    questId,
    targetTable: 'tb_quest_master',
    targetId: questId,
    beforeJson: before,
    afterJson: after,
    note: 'แก้ไขคำอธิบาย/ข้อความแสดงผลของเควสจาก Admin Panel'
  });

  return { before, after };
}

module.exports = {
  updateQuestDescriptionWithAudit
};
