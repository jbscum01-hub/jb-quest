const { getPool } = require('../db/pool');

async function getCurrentQuestSummary(professionCode) {

  const pool = getPool();

  const result = await pool.query(`
    SELECT
      q.quest_id,
      q.quest_name,
      q.quest_description,
      q.quest_level
    FROM tb_quest_master q
    JOIN tb_quest_master_profession p
      ON q.profession_id = p.profession_id
    JOIN tb_quest_master_category c
      ON q.category_id = c.category_id
    WHERE p.profession_code = $1
      AND c.category_code = 'MAIN'
      AND q.is_active = true
    ORDER BY q.quest_level ASC
    LIMIT 1
  `,[professionCode]);

  if (!result.rows.length) {
    return null;
  }

  return result.rows[0];
}

async function getRepeatableQuests(professionCode) {

  const pool = getPool();

  const result = await pool.query(`
    SELECT
      q.quest_id,
      q.quest_name,
      q.quest_description
    FROM tb_quest_master q
    JOIN tb_quest_master_profession p
      ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.is_repeatable = true
      AND q.is_active = true
    ORDER BY q.display_order
  `,[professionCode]);

  return result.rows;

}

module.exports = {
  getCurrentQuestSummary,
  getRepeatableQuests
};
