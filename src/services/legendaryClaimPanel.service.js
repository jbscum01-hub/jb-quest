const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const { getConfig } = require('./config.service');
const { getQuestDetailBundle, findQuestsByCategory } = require('../db/queries/questMaster.repo');
const { findScopedConfig, upsertScopedConfig } = require('../db/queries/discordConfig.repo');
const { buildLegendaryClaimPanelEmbed } = require('../builders/embeds/legendaryClaimPanel.embed');
const { buildLegendaryClaimPanelComponents } = require('../builders/components/legendaryClaimPanel.components');

const QUEST_LEGENDARY_CLAIM_PANEL_MESSAGE = 'QUEST_LEGENDARY_CLAIM_PANEL_MESSAGE';

async function getClaimChannelId() {
  return getConfig(DISCORD_CONFIG_KEYS.QUEST_LEGENDARY_CLAIM_CHANNEL);
}

async function getQuestClaimPanelMessageId(questId) {
  const row = await findScopedConfig('QUEST', questId, QUEST_LEGENDARY_CLAIM_PANEL_MESSAGE);
  return row?.config_value || null;
}

async function saveQuestClaimPanelMessageId(questId, messageId) {
  return upsertScopedConfig('QUEST', questId, QUEST_LEGENDARY_CLAIM_PANEL_MESSAGE, messageId, `Legendary Claim Panel Message ${questId}`);
}

async function buildLegendaryClaimPanelPayload(questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle || bundle.quest.category_code !== 'LEGENDARY') {
    throw new Error('ไม่พบเควสตำนานที่ต้องการสร้างพาเนลเคลม');
  }

  return {
    bundle,
    payload: {
      embeds: [buildLegendaryClaimPanelEmbed(bundle)],
      components: buildLegendaryClaimPanelComponents(bundle.quest.quest_id)
    }
  };
}

async function deployOrRefreshLegendaryClaimPanel(client, questId) {
  const channelId = await getClaimChannelId();
  if (!channelId) {
    throw new Error('ยังไม่ได้ตั้งค่า QUEST_LEGENDARY_CLAIM_CHANNEL');
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    throw new Error('ไม่พบห้องพาเนลเคลมตำนานที่ตั้งค่าไว้');
  }

  const { bundle, payload } = await buildLegendaryClaimPanelPayload(questId);
  const messageId = await getQuestClaimPanelMessageId(questId);

  if (messageId) {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      await existing.edit(payload);
      return { created: false, message: existing, bundle };
    }
  }

  const sent = await channel.send(payload);
  await saveQuestClaimPanelMessageId(questId, sent.id);
  return { created: true, message: sent, bundle };
}

async function deployAllLegendaryClaimPanels(client) {
  const quests = await findQuestsByCategory('LEGENDARY');
  for (const quest of quests) {
    await deployOrRefreshLegendaryClaimPanel(client, quest.quest_id);
  }
}

module.exports = {
  QUEST_LEGENDARY_CLAIM_PANEL_MESSAGE,
  buildLegendaryClaimPanelPayload,
  deployOrRefreshLegendaryClaimPanel,
  deployAllLegendaryClaimPanels,
  getQuestClaimPanelMessageId,
  saveQuestClaimPanelMessageId
};
