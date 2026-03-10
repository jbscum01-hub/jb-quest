const { getPool } = require('../db/pool');

async function getCurrentQuestSummary(professionCode) {
  const pool = getPool();

  const result = await pool.query(`
    SELECT
      q.quest_id,
      q.quest_name,
      q.quest_description,
      q.quest_level,
      q.fame_required_display,
      q.fame_note
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

  if (!result.rows.length) return null;

  const quest = result.rows[0];

  const req = await pool.query(`
    SELECT requirement_type, item_name, required_quantity, display_text
    FROM tb_quest_master_requirement
    WHERE quest_id = $1
    ORDER BY sort_order
  `,[quest.quest_id]);

  const reward = await pool.query(`
    SELECT reward_type, reward_item_name, reward_quantity, reward_value_number
    FROM tb_quest_master_reward
    WHERE quest_id = $1
    ORDER BY sort_order
  `,[quest.quest_id]);

  return {
    quest,
    requirements: req.rows,
    rewards: reward.rows
  };
}

module.exports = {
  getCurrentQuestSummary
};
