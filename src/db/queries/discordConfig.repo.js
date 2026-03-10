const { getPool } = require('../pool');

async function findGlobalConfig(configKey) {
  const query = `
    SELECT id, scope_type, scope_key, config_key, config_value, display_name, is_active
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = 'GLOBAL'
      AND scope_key = 'SYSTEM'
      AND config_key = $1
      AND is_active = TRUE
    LIMIT 1
  `;

  const result = await getPool().query(query, [configKey]);
  return result.rows[0] || null;
}

async function findProfessionConfig(scopeKey, configKey) {
  const query = `
    SELECT id, scope_type, scope_key, config_key, config_value, display_name, is_active
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = 'PROFESSION'
      AND scope_key = $1
      AND config_key = $2
      AND is_active = TRUE
    LIMIT 1
  `;

  const result = await getPool().query(query, [scopeKey, configKey]);
  return result.rows[0] || null;
}

module.exports = {
  findGlobalConfig,
  findProfessionConfig
};
