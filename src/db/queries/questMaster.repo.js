const { getPool } = require('../pool');

async function findQuestById(questId) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT q.*, c.category_code, p.profession_code
    FROM tb_quest_master q
    LEFT JOIN tb_quest_master_category c ON q.category_id = c.category_id
    LEFT JOIN tb_quest_master_profession p ON q.profession_id = p.profession_id
    WHERE q.quest_id = $1
    LIMIT 1
    `,
    [questId]
  );

  return result.rows[0] || null;
}

async function findMainQuestByProfession(professionCode) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT q.*
    FROM tb_quest_master q
    JOIN tb_quest_master_profession p
      ON q.profession_id = p.profession_id
    JOIN tb_quest_master_category c
      ON q.category_id = c.category_id
    WHERE p.profession_code = $1
      AND c.category_code = 'MAIN'
      AND q.is_active = true
    ORDER BY q.quest_level ASC, q.display_order ASC
    `,
    [professionCode]
  );

  return result.rows;
}

async function findRepeatableQuestByProfession(professionCode) {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT q.*
    FROM tb_quest_master q
    JOIN tb_quest_master_profession p
      ON q.profession_id = p.profession_id
    WHERE p.profession_code = $1
      AND q.is_repeatable = true
      AND q.is_active = true
    ORDER BY q.display_order
    `,
    [professionCode]
  );

  return result.rows;
}

module.exports = {
  findQuestById,
  findMainQuestByProfession,
  findRepeatableQuestByProfession
};
