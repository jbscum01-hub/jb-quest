const { PROFESSION_LIST } = require('../../constants/professions');
const { getProfessionPanelChannelId } = require('../../services/discordConfig.service');
const { buildProfessionPanelEmbed } = require('../../builders/embeds/professionPanel.embed');
const { buildProfessionPanelComponents } = require('../../builders/components/professionPanel.components');
const { logger } = require('../../config/logger');

async function deployProfessionPanels(client) {
  const results = [];

  for (const professionCode of PROFESSION_LIST) {
    try {
      const channelId = await getProfessionPanelChannelId(professionCode);

      if (!channelId) {
        results.push({ professionCode, ok: false, reason: 'ไม่พบ channel id ใน config' });
        continue;
      }

      const channel = await client.channels.fetch(channelId).catch(() => null);

      if (!channel) {
        results.push({ professionCode, ok: false, reason: 'ไม่พบ channel ใน Discord' });
        continue;
      }

      const embed = buildProfessionPanelEmbed(professionCode);
      const components = buildProfessionPanelComponents(professionCode);

      const sentMessage = await channel.send({
        embeds: [embed],
        components
      });

      results.push({
        professionCode,
        ok: true,
        channelId,
        messageId: sentMessage.id
      });
    } catch (error) {
      logger.error(`deployProfessionPanels failed for ${professionCode}`, error);
      results.push({
        professionCode,
        ok: false,
        reason: error.message || 'unknown error'
      });
    }
  }

  return results;
}

module.exports = {
  deployProfessionPanels
};
