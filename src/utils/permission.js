const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const { getGlobalConfigValue } = require('../services/discordConfig.service');

async function isQuestAdmin(member) {
  if (!member) {
    return false;
  }

  const adminRoleId = await getGlobalConfigValue(
    DISCORD_CONFIG_KEYS.QUEST_ADMIN_ROLE
  );

  if (!adminRoleId) {
    return false;
  }

  return member.roles.cache.has(adminRoleId);
}

module.exports = {
  isQuestAdmin
};
