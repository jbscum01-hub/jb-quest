const { getPool } = require('../pool');

async function findGlobalConfig(configKey) {
  const result = await getPool().query(
    `
    SELECT *
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = 'GLOBAL'
      AND scope_key = 'SYSTEM'
      AND config_key = $1
      AND is_active = TRUE
    LIMIT 1
    `,
    [configKey]
  );

  return result.rows[0] || null;
}

async function findProfessionConfig(scopeKey, configKey) {
  const result = await getPool().query(
    `
    SELECT *
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = 'PANEL'
      AND scope_key = $1
      AND config_key = $2
      AND is_active = TRUE
    LIMIT 1
    `,
    [scopeKey, configKey]
  );

  return result.rows[0] || null;
}

async function upsertGlobalConfig(configKey, configValue, displayName = null) {
  const result = await getPool().query(
    `
    INSERT INTO public.tb_quest_master_discord_config
    (scope_type, scope_key, config_key, config_value, display_name)
    VALUES ('GLOBAL', 'SYSTEM', $1, $2, $3)
    ON CONFLICT (scope_type, scope_key, config_key)
    DO UPDATE SET
      config_value = EXCLUDED.config_value,
      display_name = COALESCE(EXCLUDED.display_name, public.tb_quest_master_discord_config.display_name),
      updated_at = NOW()
    RETURNING *
    `,
    [configKey, String(configValue), displayName]
  );

  return result.rows[0];
}

async function upsertProfessionConfig(professionCode, configKey, configValue, displayName = null) {
  const result = await getPool().query(
    `
    INSERT INTO public.tb_quest_master_discord_config
    (scope_type, scope_key, config_key, config_value, display_name)
    VALUES ('PANEL', $1, $2, $3, $4)
    ON CONFLICT (scope_type, scope_key, config_key)
    DO UPDATE SET
      config_value = EXCLUDED.config_value,
      display_name = COALESCE(EXCLUDED.display_name, public.tb_quest_master_discord_config.display_name),
      updated_at = NOW()
    RETURNING *
    `,
    [professionCode, configKey, String(configValue), displayName]
  );

  return result.rows[0];
}

module.exports = {
  findGlobalConfig,
  findProfessionConfig,
  upsertGlobalConfig,
  upsertProfessionConfig
};
