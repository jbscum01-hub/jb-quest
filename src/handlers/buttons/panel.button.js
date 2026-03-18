const { buildQuestSubmissionModal } = require('../../builders/modals/questSubmission.modal');
const { buildCurrentQuestEmbed, buildCurrentQuestImageEmbeds } = require('../../builders/embeds/currentQuest.embed');
const { getCurrentQuestSummary } = require('../../services/panel.service');
const { openStepQuestTicket } = require('../../services/stepTicket.service');
const { findQuestById } = require('../../db/queries/questMaster.repo');
const { getLegendaryClaimDetail, claimLegendaryReward } = require('../../services/legendary.service');
const { grantQuestRewards } = require('../../services/reward.service');

const VIEW_CURRENT_COOLDOWN_MS = 4000;
const lastViewQuestAt = new Map();
const activeViewQuestRequests = new Set();

function getViewQuestKey(userId, professionCode) {
  return `${userId}:${professionCode}`;
}

function isViewQuestCoolingDown(userId, professionCode) {
  const key = getViewQuestKey(userId, professionCode);
  const now = Date.now();
  const lastAt = lastViewQuestAt.get(key) || 0;
  return (now - lastAt) < VIEW_CURRENT_COOLDOWN_MS;
}

function markViewQuestCompleted(userId, professionCode) {
  const key = getViewQuestKey(userId, professionCode);
  lastViewQuestAt.set(key, Date.now());
  activeViewQuestRequests.delete(key);
}

async function handlePanelButton(interaction, parsedCustomId) {
  const { action, extra } = parsedCustomId;
  const professionCode = extra;

  if (action === 'view_current') {
    const viewKey = getViewQuestKey(interaction.user.id, professionCode);

    if (activeViewQuestRequests.has(viewKey) || isViewQuestCoolingDown(interaction.user.id, professionCode)) {
      await interaction.deferUpdate().catch(async () => {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '⏳ กรุณารอสักครู่แล้วค่อยกดดูเควสอีกครั้ง', flags: 64 }).catch(() => null);
        }
      });
      return;
    }

    activeViewQuestRequests.add(viewKey);

    try {
      await interaction.deferReply({ flags: 64 });

      const summary = await getCurrentQuestSummary(interaction.user.id, professionCode);

      const embed = buildCurrentQuestEmbed({
        professionCode,
        profession: summary.profession,
        quest: summary.quest,
        requirements: summary.requirements,
        rewards: summary.rewards,
        guideMedia: summary.guideMedia,
        completedAllMain: summary.completedAllMain
      });

      await interaction.editReply({
        embeds: [embed, ...buildCurrentQuestImageEmbeds(summary.guideMedia, 'รูปตัวอย่างเควส')]
      });
    } finally {
      markViewQuestCompleted(interaction.user.id, professionCode);
    }
    return;
  }

  if (action === 'submit_main') {
    const summary = await getCurrentQuestSummary(interaction.user.id, professionCode);
    const quest = summary?.quest;

    if (!quest) {
      await interaction.reply({
        content: '❌ ไม่พบเควสปัจจุบันของสายนี้',
        flags: 64
      });
      return;
    }

    if (quest.is_repeatable) {
      await interaction.reply({
        content: '❌ ปุ่มส่งเควสซ้ำถูกปิดใช้งานแล้ว กรุณาใช้ flow เควสที่แอดมินตั้งไว้แทน',
        flags: 64
      });
      return;
    }

    if (quest.is_step_quest && quest.requires_ticket) {
      await interaction.deferReply({ flags: 64 });

      const result = await openStepQuestTicket({
        client: interaction.client,
        guild: interaction.guild,
        user: interaction.user,
        member: interaction.member,
        professionCode,
        quest
      });

      await interaction.editReply({
        content: result.created
          ? `✅ เปิด Ticket สำหรับ **${quest.quest_name}** เรียบร้อยแล้ว: <#${result.channel.id}>`
          : `ℹ️ คุณมี Ticket ของเควสนี้อยู่แล้ว: <#${result.channel?.id || result.ticket.discord_channel_id}>`
      });
      return;
    }

    const modal = buildQuestSubmissionModal({
      submissionMode: 'MAIN',
      professionCode
    });

    await interaction.showModal(modal);
    return;
  }


  if (action === 'submit_global') {
    const quest = await findQuestById(extra);
    if (!quest || !['TIMED', 'LEGENDARY'].includes(quest.category_code)) {
      await interaction.reply({ content: '❌ ไม่พบเควสนี้', flags: 64 });
      return;
    }

    if (!quest.is_active) {
      await interaction.reply({ content: '❌ เควสนี้ปิดรับอยู่', flags: 64 });
      return;
    }

    const modal = buildQuestSubmissionModal({
      submissionMode: 'GLOBAL',
      questId: quest.quest_id,
      title: `ส่งเควส ${quest.quest_name}`
    });

    await interaction.showModal(modal);
    return;
  }


  if (action === 'legendary_detail') {
    const detail = await getLegendaryClaimDetail({
      playerId: interaction.user.id,
      questId: extra
    });

    await interaction.reply({
      content: `👑 **${detail.title}**\n\n${detail.lines.join('\n')}`,
      flags: 64
    });
    return;
  }

  if (action === 'legendary_claim') {
    await interaction.deferReply({ flags: 64 });

    const result = await claimLegendaryReward({
      playerId: interaction.user.id,
      questId: extra
    });

    await grantQuestRewards({
      client: interaction.client,
      playerId: result.state.player_id,
      questId: result.quest.quest_id,
      submissionId: null,
      discordUserId: interaction.user.id,
      grantedBy: interaction.user.tag
    });

    await interaction.editReply({
      content: [
        `🎁 เคลม **${result.quest.quest_name}** สำเร็จแล้ว`,
        `เคลมสะสม: ${result.claimCount} ครั้ง`,
        `เคลมได้อีกครั้ง: ${require('../../services/legendary.service').formatThaiDateTime(result.nextClaimAvailableAt)}`
      ].join('\n')
    });
    return;
  }

  if (action === 'submit_repeatable') {
    await interaction.reply({
      content: '❌ ปุ่มส่งเควสซ้ำถูกถอดออกจากพาเนลแล้ว',
      flags: 64
    });
    return;
  }

  await interaction.reply({
    content: 'ไม่พบ action ของ panel นี้',
    flags: 64
  });
}

module.exports = {
  handlePanelButton
};
