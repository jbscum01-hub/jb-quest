const { PROFESSION_LIST } = require('../constants/professions');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId
} = require('./discordConfig.service');

const { buildProfessionPanelEmbed } = require('../builders/embeds/professionPanel.embed');
const { buildProfessionPanelComponents } = require('../builders/components/professionPanel.components');

const { getPool } = require('../db/pool');

async function savePanelMessageId(professionCode, messageId) {
  const query = `
  UPDATE public.tb_quest_master_discord_config
  SET config_value = $2
  WHERE scope_type='PROFESSION'
  AND scope_key=$1
  AND config_key='QUEST_PANEL_MESSAGE'
  `;

  await getPool().query(query, [professionCode, messageId]);
}

async function autoDeployPanels(client) {

  for (const professionCode of PROFESSION_LIST) {

    const messageId = await getProfessionPanelMessageId(professionCode);

    if (messageId) {
      console.log(`Panel exists for ${professionCode}`);
      continue;
    }

    const channelId = await getProfessionPanelChannelId(professionCode);

    if (!channelId) {
      console.log(`Missing channel config for ${professionCode}`);
      continue;
    }

    const channel = await client.channels.fetch(channelId).catch(()=>null);

    if (!channel) {
      console.log(`Channel not found ${professionCode}`);
      continue;
    }

    const embed = buildProfessionPanelEmbed(professionCode);
    const components = buildProfessionPanelComponents(professionCode);

    const message = await channel.send({
      embeds:[embed],
      components
    });

    await savePanelMessageId(professionCode, message.id);

    console.log(`Panel created for ${professionCode}`);
  }

}

module.exports = {
  autoDeployPanels
};
