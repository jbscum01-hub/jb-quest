const { getPool } = require('../db/pool');

function getDb(client) {
  return client || getPool();
}

async function findQuestByIdForEdit(questId, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT
      quest_id,
      quest_code,
      quest_name,
      quest_description,
      panel_title,
      panel_description,
      button_label,
      updated_at,
      updated_by
    FROM public.tb_quest_master
    WHERE quest_id = $1
    LIMIT 1
    `,
    [questId]
  );

  return result.rows[0] || null;
}

async function updateQuestDescriptionFields(questId, payload, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    UPDATE public.tb_quest_master
    SET
      quest_name = $2,
      quest_description = $3,
      panel_title = $4,
      panel_description = $5,
      button_label = $6,
      updated_at = now(),
      updated_by = $7
    WHERE quest_id = $1
    RETURNING
      quest_id,
      quest_code,
      quest_name,
      quest_description,
      panel_title,
      panel_description,
      button_label,
      updated_at,
      updated_by
    `,
    [
      questId,
      payload.questName,
      payload.questDescription,
      payload.panelTitle,
      payload.panelDescription,
      payload.buttonLabel,
      payload.updatedBy
    ]
  );

  return result.rows[0] || null;
}

module.exports = {
  findQuestByIdForEdit,
  updateQuestDescriptionFields
};
