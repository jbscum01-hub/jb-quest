const {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildProfessionBrowseEmbed,
  buildLevelBrowseEmbed,
  buildQuestBrowseEmbed,
  buildQuestDetailEmbed,
  buildSimpleListEmbed,
  buildPanelStatusEmbed
} = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminHomeComponents,
  buildPanelManagementComponents,
  buildMasterHomeComponents,
  buildProfessionSelectRow,
  buildLevelSelectRow,
  buildQuestSelectRow,
  buildQuestDetailComponents,
  buildBackRows
} = require('../builders/components/adminPanel.components');
const {
  findActiveProfessions,
  findProfessionById,
  findQuestLevelsByProfession,
  findQuestsByProfessionAndLevel,
  findQuestSteps,
  findQuestDependenciesWithNames,
  insertAdminAudit
} = require('../db/queries/adminPanel.repo');
const {
  findQuestById,
  findQuestRequirements,
  findQuestRewards,
  findQuestGuideMedia
} = require('../db/queries/questMaster.repo');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  getGlobalConfigValue,
  getAdminPanelMessageId
} = require('./discordConfig.service');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

async function renderAdminHome(target) {
  return target.editReply
    ? target.editReply({ embeds: [buildAdminHomeEmbed()], components: buildAdminHomeComponents() })
    : target.edit({ embeds: [buildAdminHomeEmbed()], components: buildAdminHomeComponents() });
}

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminHomeEmbed()],
    components: buildAdminHomeComponents()
  });
}

function buildReplyMethod(interaction) {
  return interaction.deferred || interaction.replied
    ? (payload) => interaction.editReply(payload)
    : (payload) => interaction.update(payload);
}

async function showPanelManagement(interaction) {
  const send = buildReplyMethod(interaction);
  return send({ embeds: [buildPanelManagementEmbed()], components: buildPanelManagementComponents() });
}

async function showMasterHome(interaction) {
  const send = buildReplyMethod(interaction);
  return send({ embeds: [buildMasterHomeEmbed()], components: buildMasterHomeComponents() });
}

async function showProfessionBrowse(interaction) {
  const professions = await findActiveProfessions();
  const send = buildReplyMethod(interaction);
  return send({
    embeds: [buildProfessionBrowseEmbed(professions)],
    components: [...buildProfessionSelectRow(professions), ...buildBackRows('quest:admin:master_home')]
  });
}

async function showLevelBrowse(interaction, professionId) {
  const [profession, levels] = await Promise.all([
    findProfessionById(professionId),
    findQuestLevelsByProfession(professionId)
  ]);

  if (!profession) {
    throw new Error('ไม่พบข้อมูลสายอาชีพที่เลือก');
  }

  const send = buildReplyMethod(interaction);
  return send({
    embeds: [buildLevelBrowseEmbed(profession, levels)],
    components: levels.length
      ? [...buildLevelSelectRow(professionId, levels), ...buildBackRows('quest:admin:browse_start')]
      : buildBackRows('quest:admin:browse_start')
  });
}

async function showQuestBrowse(interaction, professionId, level) {
  const [profession, quests] = await Promise.all([
    findProfessionById(professionId),
    findQuestsByProfessionAndLevel(professionId, level)
  ]);

  if (!profession) {
    throw new Error('ไม่พบข้อมูลสายอาชีพ');
  }

  const send = buildReplyMethod(interaction);
  return send({
    embeds: [buildQuestBrowseEmbed(profession, level, quests)],
    components: quests.length
      ? [...buildQuestSelectRow(professionId, level, quests), ...buildBackRows('quest:admin:browse_start')]
      : buildBackRows('quest:admin:browse_start')
  });
}

async function showQuestDetail(interaction, questId) {
  const [quest, requirements, rewards, dependencies, images, steps] = await Promise.all([
    findQuestById(questId),
    findQuestRequirements(questId),
    findQuestRewards(questId),
    findQuestDependenciesWithNames(questId),
    findQuestGuideMedia(questId),
    findQuestSteps(questId)
  ]);

  if (!quest) {
    throw new Error('ไม่พบเควสที่เลือก');
  }

  const send = buildReplyMethod(interaction);
  return send({
    embeds: [buildQuestDetailEmbed({ quest, requirements, rewards, dependencies, images, steps })],
    components: buildQuestDetailComponents(questId, steps.length > 0)
  });
}

async function showRequirements(interaction, questId) {
  const [quest, requirements] = await Promise.all([findQuestById(questId), findQuestRequirements(questId)]);
  const send = buildReplyMethod(interaction);
  return send({
    embeds: [
      buildSimpleListEmbed({
        title: `📦 ของที่ต้องส่ง · ${quest.quest_name}`,
        color: 0x5865f2,
        description: `เควสนี้มี requirement ทั้งหมด ${requirements.length} รายการ`,
        lines: requirements.map((row, idx) => `• ${idx + 1}. ${row.item_name || row.display_text || row.requirement_type}${row.required_quantity ? ` x${row.required_quantity}` : ''}`)
      })
    ],
    components: buildBackRows(`quest:admin:detail:${questId}`)
  });
}

async function showRewards(interaction, questId) {
  const [quest, rewards] = await Promise.all([findQuestById(questId), findQuestRewards(questId)]);
  const send = buildReplyMethod(interaction);
  return send({
    embeds: [
      buildSimpleListEmbed({
        title: `🎁 รางวัล · ${quest.quest_name}`,
        color: 0x57f287,
        description: `เควสนี้มี reward ทั้งหมด ${rewards.length} รายการ`,
        lines: rewards.map((row, idx) => `• ${idx + 1}. ${row.reward_display_text || row.reward_item_name || row.reward_type}${row.reward_quantity ? ` x${row.reward_quantity}` : row.reward_value_number ? ` (${row.reward_value_number})` : ''}`)
      })
    ],
    components: buildBackRows(`quest:admin:detail:${questId}`)
  });
}

async function showDependencies(interaction, questId) {
  const [quest, dependencies] = await Promise.all([findQuestById(questId), findQuestDependenciesWithNames(questId)]);
  const send = buildReplyMethod(interaction);
  return send({
    embeds: [
      buildSimpleListEmbed({
        title: `🔓 เงื่อนไขปลดล็อก · ${quest.quest_name}`,
        color: 0xfaa61a,
        description: 'แสดง dependency ของเควสนี้เท่านั้น',
        lines: dependencies.map((dep, idx) => {
          if (dep.dependency_type === 'PREVIOUS_QUEST') {
            return `• ${idx + 1}. ผ่าน ${dep.required_quest_code || '-'} ${dep.required_quest_name || ''}`.trim();
          }
          if (dep.dependency_type === 'MAIN_LEVEL') {
            return `• ${idx + 1}. ต้องมี Main Level Lv.${dep.required_level}`;
          }
          if (dep.dependency_type === 'ROLE') {
            return `• ${idx + 1}. ต้องมี Role ${dep.required_role_name || dep.required_role_id}`;
          }
          return `• ${idx + 1}. ${dep.dependency_type}`;
        })
      })
    ],
    components: buildBackRows(`quest:admin:detail:${questId}`)
  });
}

async function showImages(interaction, questId) {
  const [quest, images] = await Promise.all([findQuestById(questId), findQuestGuideMedia(questId)]);
  const send = buildReplyMethod(interaction);
  return send({
    embeds: [
      buildSimpleListEmbed({
        title: `🖼️ รูปตัวอย่าง · ${quest.quest_name}`,
        color: 0xeb459e,
        description: 'ใช้หน้านี้เช็กว่ารูปตัวอย่างของเควสถูกใส่ไว้ครบหรือยัง',
        lines: images.map((image, idx) => `• ${idx + 1}. ${image.media_title || 'ไม่มีชื่อ'}${image.media_description ? ` — ${image.media_description}` : ''}\n${image.media_url}`)
      })
    ],
    components: buildBackRows(`quest:admin:detail:${questId}`)
  });
}

async function getPanelStatusRows(client) {
  const professions = await findActiveProfessions();
  const adminPanelChannelId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_CHANNEL);
  const adminPanelMessageId = await getAdminPanelMessageId();

  const rows = [];

  for (const profession of professions) {
    const channelId = await getProfessionPanelChannelId(profession.profession_code);
    const messageId = await getProfessionPanelMessageId(profession.profession_code);
    let status = 'ไม่พบ config';

    if (channelId) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) {
        status = 'ไม่พบห้องใน Discord';
      } else if (!messageId) {
        status = 'พบห้อง แต่ยังไม่มี message id';
      } else {
        const message = await channel.messages.fetch(messageId).catch(() => null);
        status = message ? 'พร้อมใช้งาน' : 'ไม่พบข้อความพาเนล';
      }
    }

    rows.push({ professionCode: profession.profession_code, status });
  }

  rows.unshift({
    professionCode: 'ADMIN_PANEL',
    status: adminPanelChannelId && adminPanelMessageId ? 'ตั้งค่าแล้ว' : 'ยังตั้งค่าไม่ครบ'
  });

  return rows;
}

async function showPanelStatus(interaction) {
  const rows = await getPanelStatusRows(interaction.client);
  const send = buildReplyMethod(interaction);
  return send({ embeds: [buildPanelStatusEmbed(rows)], components: buildBackRows('quest:admin:panel_home') });
}

async function logAdminAction(interaction, payload) {
  try {
    await insertAdminAudit({
      actorDiscordId: interaction.user.id,
      actorDiscordTag: interaction.user.tag,
      ...payload
    });
  } catch (error) {
    // intentionally swallow to not break UI flow
  }
}

module.exports = {
  refreshAdminPanel,
  renderAdminHome,
  showPanelManagement,
  showMasterHome,
  showProfessionBrowse,
  showLevelBrowse,
  showQuestBrowse,
  showQuestDetail,
  showRequirements,
  showRewards,
  showDependencies,
  showImages,
  showPanelStatus,
  logAdminAction
};
