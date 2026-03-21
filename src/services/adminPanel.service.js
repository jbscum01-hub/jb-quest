
async function updateQuestFame(db, questId, fame) {
  await db.query(
    'UPDATE tb_quest_master SET fame_required_display = $1 WHERE quest_id = $2',
    [fame, questId]
  );
}

module.exports = { updateQuestFame };
