const { getPool } = require('../db/pool');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

function getDb(client) {
  return client || getPool();
}

async function getGlobalConfigValue(configKey, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT config_value
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = 'GLOBAL'
      AND scope_key = 'SYSTEM'
      AND config_key = $1
      AND is_active = TRUE
    LIMIT 1
    `,
    [configKey]
  );

  return result.rows[0]?.config_value || null;
}

async function setGlobalConfigValue(configKey, configValue, displayName = null, client) {
  const db = getDb(client);

  const existing = await db.query(
    `
    SELECT config_id
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = 'GLOBAL'
      AND scope_key = 'SYSTEM'
      AND config_key = $1
    LIMIT 1
    `,
    [configKey]
  );

  if (existing.rows.length) {
    await db.query(
      `
      UPDATE public.tb_quest_master_discord_config
      SET config_value = $2,
          display_name = COALESCE($3, display_name),
          is_active = TRUE,
          updated_at = now()
      WHERE config_id = $1
      `,
      [existing.rows[0].config_id, configValue, displayName]
    );
    return;
  }

  await db.query(
    `
    INSERT INTO public.tb_quest_master_discord_config
    (
      scope_type,
      scope_key,
      config_key,
      config_value,
      display_name,
      is_active,
      created_at,
      updated_at
    )
    VALUES
    (
      'GLOBAL',
      'SYSTEM',
      $1,
      $2,
      $3,
      TRUE,
      now(),
      now()
    )
    `,
    [configKey, configValue, displayName]
  );
}

async function getAdminPanelMessageId(client) {
  return getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_MESSAGE, client);
}

async function getProfessionPanelChannelId(professionCode, client) {
  return getGlobalConfigValue(`${DISCORD_CONFIG_KEYS.QUEST_PANEL_CHANNEL_PREFIX}${professionCode}`, client);
}

async function getProfessionPanelMessageId(professionCode, client) {
  return getGlobalConfigValue(`${DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE_PREFIX}${professionCode}`, client);
}

module.exports = {
  getGlobalConfigValue,
  setGlobalConfigValue,
  getAdminPanelMessageId,
  getProfessionPanelChannelId,
  getProfessionPanelMessageId
};
