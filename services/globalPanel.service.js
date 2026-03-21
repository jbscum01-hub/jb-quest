const { getConfig } = require('./config.service');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');
const { getQuestDetailBundle, findQuestsByCategory } = require('../db/queries/questMaster.repo');
const { buildGlobalQuestPanelEmbed } = require('../builders/embeds/globalQuestPanel.embed');
const { buildGlobalQuestPanelComponents } = require('../builders/components/globalQuestPanel.components');
const { findScopedConfig, upsertScopedConfig } = require('../db/queries/discordConfig.repo');

function getQuestPanelConfigKey() {
  return 'QUEST_PANEL_MESSAGE';
}

function parseDateInput(value) {
  if (!value) return null;
  const normalized = String(value).trim().replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getGlobalQuestRuntime(quest, now = new Date()) {
  const runtime = {
    acceptingSubmissions: Boolean(quest.is_active),
    startsAt: quest.start_at ? new Date(quest.start_at) : null,
    endsAt: quest.end_at ? new Date(quest.end_at) : null
  };

  if (!quest.is_active) {
    runtime.acceptingSubmissions = false;
    return runtime;
  }

  if (quest.category_code === 'TIMED') {
    if (runtime.startsAt && now < runtime.startsAt) runtime.acceptingSubmissions = false;
    if (runtime.endsAt && now > runtime.endsAt) runtime.acceptingSubmissions = false;
  }

  return runtime;
}

async function getQuestPanelMessageId(questId) {
  const row = await findScopedConfig('QUEST', questId, getQuestPanelConfigKey());
  return row?.config_value || null;
}

async function saveQuestPanelMessageId(questId, messageId) {
  return upsertScopedConfig('QUEST', questId, getQuestPanelConfigKey(), messageId, `Quest Panel Message ${questId}`);
}

async function getGlobalQuestChannelId(categoryCode) {
  if (categoryCode === 'TIMED') return getConfig(DISCORD_CONFIG_KEYS.QUEST_SPECIAL_CHANNEL);
  if (categoryCode === 'LEGENDARY') return getConfig(DISCORD_CONFIG_KEYS.QUEST_LEGENDARY_CHANNEL);
  return null;
}

async function buildGlobalQuestPanelPayload(questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) throw new Error('ไม่พบข้อมูลเควส');
  const runtime = getGlobalQuestRuntime(bundle.quest);
  return {
    bundle,
    runtime,
    payload: {
      embeds: [buildGlobalQuestPanelEmbed(bundle, runtime)],
      components: buildGlobalQuestPanelComponents(bundle.quest, runtime)
    }
  };
}

async function deployOrRefreshGlobalQuestPanel(client, questId) {
  const { bundle, payload } = await buildGlobalQuestPanelPayload(questId);
  const channelId = await getGlobalQuestChannelId(bundle.quest.category_code);
  if (!channelId) throw new Error(`ยังไม่ตั้งค่า channel ของ ${bundle.quest.category_code}`);

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) throw new Error('ไม่พบห้อง panel ที่ตั้งค่าไว้');

  const messageId = await getQuestPanelMessageId(questId);
  if (messageId) {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      await existing.edit(payload);
      return { created: false, message: existing, bundle };
    }
  }

  const message = await channel.send(payload);
  await saveQuestPanelMessageId(questId, message.id);
  return { created: true, message, bundle };
}

async function deployAllGlobalQuestPanels(client, categoryCode = null) {
  const categories = categoryCode ? [categoryCode] : ['TIMED', 'LEGENDARY'];
  for (const code of categories) {
    const quests = await findQuestsByCategory(code);
    for (const quest of quests) {
      await deployOrRefreshGlobalQuestPanel(client, quest.quest_id);
    }
  }
}

module.exports = {
  parseDateInput,
  getGlobalQuestRuntime,
  getQuestPanelMessageId,
  saveQuestPanelMessageId,
  getGlobalQuestChannelId,
  buildGlobalQuestPanelPayload,
  deployOrRefreshGlobalQuestPanel,
  deployAllGlobalQuestPanels
};
