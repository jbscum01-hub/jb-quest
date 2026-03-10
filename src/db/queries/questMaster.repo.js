const { getPool } = require('../pool');

async function findCurrentMainQuestByProfession(professionCode) {
  const query = `
    SELECT
      qm.id,
      qm.quest_code,
      qm.quest_name,
      qm.quest_name_th,
      qm.quest_description,
      qm.quest_description_th,
      qm.quest_category,
      qm.profession_code,
      qm.level_no,
      qm.display_order,
      qm.fame_required_display,
      qm.fame_note,
      qm.is_active,
      qm.is_step_quest,
      qm.requires_ticket,
      qm.requires_admin_approval
    FROM public.tb_quest_master qm
    WHERE qm.quest_category = 'MAIN'
      AND qm.profession_code = $1
      AND qm.is_active = TRUE
    ORDER BY qm.level_no ASC, qm.display_order ASC, qm.created_at ASC
    LIMIT 1
  `;

  const result = await getPool().query(query, [professionCode]);
  return result.rows[0] || null;
}

async function findMainQuestsByProfession(professionCode) {
  const query = `
    SELECT
      qm.id,
      qm.quest_code,
      qm.quest_name,
      qm.quest_name_th,
      qm.quest_description,
      qm.quest_description_th,
      qm.quest_category,
      qm.profession_code,
      qm.level_no,
      qm.display_order,
      qm.fame_required_display,
      qm.fame_note,
      qm.is_active,
      qm.is_step_quest,
      qm.requires_ticket,
      qm.requires_admin_approval
    FROM public.tb_quest_master qm
    WHERE qm.quest_category = 'MAIN'
      AND qm.profession_code = $1
      AND qm.is_active = TRUE
    ORDER BY qm.level_no ASC, qm.display_order ASC
  `;

  const result = await getPool().query(query, [professionCode]);
  return result.rows;
}

async function findRepeatableQuestsByProfession(professionCode) {
  const query = `
    SELECT
      qm.id,
      qm.quest_code,
      qm.quest_name,
      qm.quest_name_th,
      qm.quest_description,
      qm.quest_description_th,
      qm.quest_category,
      qm.profession_code,
      qm.level_no,
      qm.display_order,
      qm.repeat_cooldown_days,
      qm.fame_required_display,
      qm.fame_note,
      qm.is_active
    FROM public.tb_quest_master qm
    WHERE qm.quest_category = 'REPEATABLE'
      AND qm.profession_code = $1
      AND qm.is_active = TRUE
    ORDER BY qm.level_no ASC, qm.display_order ASC
  `;

  const result = await getPool().query(query, [professionCode]);
  return result.rows;
}

module.exports = {
  findCurrentMainQuestByProfession,
  findMainQuestsByProfession,
  findRepeatableQuestsByProfession
};
