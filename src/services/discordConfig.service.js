const { getPool } = require('../db/pool');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

function getDb(client) {
  return client || getPool();
}

async function getConfigValue(scopeType, scopeKey, configKey, client) {
  const db = getDb(client);
  const result = await db.query(
    `
    SELECT config_value
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = $1
      AND scope_key = $2
      AND config_key = $3
      AND is_active = TRUE
    LIMIT 1
    `,
    [scopeType, scopeKey, configKey]
  );

  return result.rows[0]?.config_value || null;
}

async function upsertConfigValue(scopeType, scopeKey, configKey, configValue, displayName = null, client) {
  const db = getDb(client);

  const existing = await db.query(
    `
    SELECT config_id
    FROM public.tb_quest_master_discord_config
    WHERE scope_type = $1
      AND scope_key = $2
      AND config_key = $3
    LIMIT 1
    `,
    [scopeType, scopeKey, configKey]
  );

  if (existing.rows.length > 0) {
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
      $1, $2, $3, $4, $5, TRUE, now(), now()
    )
    `,
    [scopeType, scopeKey, configKey, configValue, displayName]
  );
}

/* =========================
 * GLOBAL / SYSTEM
 * ========================= */

async function getGlobalConfigValue(configKey, client) {
  return getConfigValue('GLOBAL', 'SYSTEM', configKey, client);
}

async function setGlobalConfigValue(configKey, configValue, displayName = null, client) {
  return upsertConfigValue('GLOBAL', 'SYSTEM', configKey, configValue, displayName, client);
}

async function getAdminPanelMessageId(client) {
  return getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_MESSAGE, client);
}

/* =========================
 * PANEL / profession_code
 * ========================= */

async function getProfessionPanelChannelId(professionCode, client) {
  return getConfigValue('PANEL', professionCode, DISCORD_CONFIG_KEYS.QUEST_PANEL, client);
}

async function setProfessionPanelChannelId(professionCode, channelId, displayName = null, client) {
  return upsertConfigValue(
    'PANEL',
    professionCode,
    DISCORD_CONFIG_KEYS.QUEST_PANEL,
    channelId,
    displayName || `Quest Panel Channel ${professionCode}`,
    client
  );
}

async function getProfessionPanelMessageId(professionCode, client) {
  return getConfigValue('PANEL', professionCode, DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE, client);
}

async function setProfessionPanelMessageId(professionCode, messageId, displayName = null, client) {
  return upsertConfigValue(
    'PANEL',
    professionCode,
    DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE,
    messageId,
    displayName || `Quest Panel Message ${professionCode}`,
    client
  );
}

module.exports = {
  getConfigValue,
  upsertConfigValue,

  getGlobalConfigValue,
  setGlobalConfigValue,
  getAdminPanelMessageId,

  getProfessionPanelChannelId,
  setProfessionPanelChannelId,
  getProfessionPanelMessageId,
  setProfessionPanelMessageId
};
