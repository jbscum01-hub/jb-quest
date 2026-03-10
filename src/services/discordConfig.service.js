const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const {
  findGlobalConfig,
  findProfessionConfig
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

  if (!row || !row.config_value || row.config_value === '0') {
    return null;
  }

  return row.config_value;
}

module.exports = {
  getGlobalConfigValue,
  getProfessionPanelChannelId,
  getProfessionPanelMessageId
};
