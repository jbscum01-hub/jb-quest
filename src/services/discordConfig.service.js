const { getPool } = require('../db/pool');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

function db() {
  return getPool();
}

async function getConfigValue(scopeType, scopeKey, configKey) {
  const result = await db().query(
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

async function upsertConfigValue(scopeType, scopeKey, configKey, configValue, displayName = null) {
  const existing = await db().query(
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
    await db().query(
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

  await db().query(
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

async function getGlobalConfigValue(configKey) {
  return getConfigValue('GLOBAL', 'SYSTEM', configKey);
}

async function setGlobalConfigValue(configKey, configValue, displayName = null) {
  return upsertConfigValue('GLOBAL', 'SYSTEM', configKey, configValue, displayName);
}

async function getProfessionPanelChannelId(professionCode) {
  return getConfigValue('PANEL', professionCode, DISCORD_CONFIG_KEYS.QUEST_PANEL);
}

async function getProfessionPanelMessageId(professionCode) {
  return getConfigValue('PANEL', professionCode, DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE);
}

async function saveProfessionPanelMessageId(professionCode, messageId) {
  return upsertConfigValue(
    'PANEL',
    professionCode,
    DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE,
    messageId,
    `Profession Panel Message ${professionCode}`
  );
}

async function getAdminPanelMessageId() {
  return getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_MESSAGE);
}

async function saveAdminPanelMessageId(messageId) {
  return setGlobalConfigValue(
    DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_MESSAGE,
    messageId,
    'Quest Admin Panel Message'
  );
}

module.exports = {
  getConfigValue,
  upsertConfigValue,
  getGlobalConfigValue,
  setGlobalConfigValue,
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  saveProfessionPanelMessageId,
  getAdminPanelMessageId,
  saveAdminPanelMessageId
};
