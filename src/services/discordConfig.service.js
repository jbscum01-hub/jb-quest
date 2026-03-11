const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const {
  findGlobalConfig,
  findProfessionConfig,
  upsertGlobalConfig,
  upsertProfessionConfig
} = require('../db/queries/discordConfig.repo');

async function getGlobalConfigValue(configKey) {
  const row = await findGlobalConfig(configKey);
  return row ? row.config_value : null;
}

async function getProfessionPanelChannelId(professionCode) {
  const row = await findProfessionConfig(professionCode, DISCORD_CONFIG_KEYS.QUEST_PANEL);
  return row ? row.config_value : null;
}

async function getProfessionPanelMessageId(professionCode) {
  const row = await findProfessionConfig(professionCode, DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE);
  return row && row.config_value ? row.config_value : null;
}

async function saveProfessionPanelMessageId(professionCode, messageId) {
  return upsertProfessionConfig(professionCode, DISCORD_CONFIG_KEYS.QUEST_PANEL_MESSAGE, messageId, `Profession Panel Message ${professionCode}`);
}

async function getAdminPanelMessageId() {
  const row = await findGlobalConfig(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_MESSAGE);
  return row ? row.config_value : null;
}

async function saveAdminPanelMessageId(messageId) {
  return upsertGlobalConfig(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_MESSAGE, messageId, 'Quest Admin Panel Message');
}

module.exports = {
  getGlobalConfigValue,
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  saveProfessionPanelMessageId,
  getAdminPanelMessageId,
  saveAdminPanelMessageId
};
