const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { withTransaction } = require('../db/pool');
const { findProfessionByCode } = require('../db/queries/questMaster.repo');
const { findPlayerByDiscordId, createPlayerProfile, updatePlayerNames } = require('../db/queries/playerProfile.repo');
const { createTicket, updateTicketStatus, findTicketById, findOpenTicketByPlayerQuest } = require('../db/queries/ticket.repo');
const {
  findFirstQuestStep,
  findNextQuestStep,
  createTicketStepProgress,
  findCurrentTicketStepProgress,
  updateTicketStepProgressStatus,
  countQuestSteps
} = require('../db/queries/step.repo');
const { upsertMainProgress } = require('../db/queries/mainProgress.repo');
const { insertCompletionLog } = require('../db/queries/review.repo');
const { resolveCurrentMainQuestByPlayer } = require('./questProgress.service');
const { getGlobalConfigValue } = require('./discordConfig.service');
const { buildTicketStepEmbed } = require('../builders/embeds/ticketStep.embed');
const { buildTicketStepComponents } = require('../builders/components/ticketStep.components');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

function makeTicketCode(professionCode) {
  const stamp = Date.now().toString().slice(-8);
  return `QT-${professionCode}-${stamp}`;
}

function makeTicketChannelName(professionCode, username) {
  const safeUser = String(username || 'player')
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙_-]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

  return `quest-${professionCode.toLowerCase()}-${safeUser}`.slice(0, 90);
}

async function ensurePlayerProfile({
  discordUserId,
  discordUsername,
  discordDisplayName,
  ingameName
}, client) {
  let player = await findPlayerByDiscordId(discordUserId, client);

  if (!player) {
    player = await createPlayerProfile({
      discordUserId,
      discordUsername,
      discordDisplayName,
      ingameName
    }, client);
  } else {
    player = await updatePlayerNames({
      playerId: player.player_id,
      discordUsername,
      discordDisplayName,
      ingameName
    }, client);
  }

  return player;
}

async function sendTicketStateMessage(channel, ticket) {
  const currentStep = await findCurrentTicketStepProgress(ticket.ticket_id);
  const totalSteps = await countQuestSteps(ticket.quest_id);

  if (!currentStep) return null;

  const embed = buildTicketStepEmbed({
    ticket,
    currentStep,
    totalSteps
  });

  const components = buildTicketStepComponents(ticket.ticket_id);

  return channel.send({
    embeds: [embed],
    components
  });
}

async function sendQuestCompletionLog(client, ticket, reviewerTag = null) {
  const logChannelId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_SUBMISSION_LOG_CHANNEL);
  if (!logChannelId) return;

  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🏁 Step Quest Completed')
    .setDescription(
      [
        `ผู้เล่น: <@${ticket.discord_user_id}>`,
        `สายอาชีพ: ${ticket.profession_name_th || ticket.profession_code || '-'}`,
        `เควส: ${ticket.quest_name || '-'}`,
        `Ticket: ${ticket.ticket_code}`,
        `ห้อง Ticket: <#${ticket.discord_channel_id}>`,
        `ผู้ปิดเควส: ${reviewerTag || '-'}`,
        `สถานะ: สำเร็จ`
      ].join('\n')
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

async function openStepQuestTicket({
  client,
  guild,
  user,
  member,
  professionCode,
  quest
}) {
  if (!quest?.is_step_quest || !quest?.requires_ticket) {
    throw new Error('เควสนี้ไม่ใช่ Step Ticket Quest');
  }

  const profession = await findProfessionByCode(professionCode);
  if (!profession) {
    throw new Error(`ไม่พบสายอาชีพ ${professionCode}`);
  }

  let ticketRow;
  let created = false;

  const ticketCategoryId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_TICKET_CATEGORY);
  const adminRoleId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_ROLE);

  const player = await ensurePlayerProfile({
    discordUserId: user.id,
    discordUsername: user.tag,
    discordDisplayName: member?.displayName || user.username,
    ingameName: null
  });

  const existing = await findOpenTicketByPlayerQuest(player.player_id, quest.quest_id);
  if (existing) {
    const existingChannel = existing.discord_channel_id ? guild.channels.cache.get(existing.discord_channel_id) : null;
    return {
      created: false,
      ticket: existing,
      channel: existingChannel || null
    };
  }

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    }
  ];

  if (adminRoleId) {
    permissionOverwrites.push({
      id: adminRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles
      ]
    });
  }

  const channel = await guild.channels.create({
    name: makeTicketChannelName(professionCode, member?.displayName || user.username),
    type: ChannelType.GuildText,
    parent: ticketCategoryId || null,
    permissionOverwrites
  });

  ticketRow = await withTransaction(async (db) => {
    const firstStep = await findFirstQuestStep(quest.quest_id, db);
    if (!firstStep) {
      throw new Error('ยังไม่มี Step ของเควสนี้ในฐานข้อมูล');
    }

    const createdTicket = await createTicket({
      ticketCode: makeTicketCode(professionCode),
      playerId: player.player_id,
      professionId: profession.profession_id,
      questId: quest.quest_id,
      discordChannelId: channel.id
    }, db);

    await createTicketStepProgress({
      ticketId: createdTicket.ticket_id,
      questId: quest.quest_id,
      stepId: firstStep.step_id,
      stepNo: firstStep.step_no
    }, db);

    await updateTicketStatus(createdTicket.ticket_id, 'IN_PROGRESS', {}, db);

    created = true;
    return createdTicket;
  });

  const fullTicket = await findTicketById(ticketRow.ticket_id);

  await channel.send({
    content: `<@${user.id}> เปิด Ticket สำหรับ **${quest.quest_name}** เรียบร้อยแล้ว`
  });

  await sendTicketStateMessage(channel, fullTicket);

  return {
    created,
    ticket: fullTicket,
    channel
  };
}

async function submitCurrentStep({
  client,
  channelId,
  userId
}) {
  const ticket = await findTicketById((await require('../db/queries/ticket.repo').findTicketByChannel(channelId))?.ticket_id);
  if (!ticket) {
    throw new Error('ไม่พบ Ticket ของห้องนี้');
  }

  if (ticket.discord_user_id !== userId) {
    throw new Error('เฉพาะเจ้าของ Ticket เท่านั้นที่ส่งขั้นตอนได้');
  }

  const currentStep = await findCurrentTicketStepProgress(ticket.ticket_id);
  if (!currentStep) {
    throw new Error('ไม่พบ Step ปัจจุบันของ Ticket นี้');
  }

  if (currentStep.step_status !== 'ACTIVE') {
    throw new Error('ขั้นตอนนี้ถูกส่งหรือถูกตรวจแล้ว');
  }

  await withTransaction(async (db) => {
    await updateTicketStepProgressStatus({
      ticketStepProgressId: currentStep.ticket_step_progress_id,
      status: 'SUBMITTED',
      incrementAttempt: true,
      markSubmitted: true
    }, db);

    await updateTicketStatus(ticket.ticket_id, 'WAITING_ADMIN', {}, db);
  });

  const refreshed = await findTicketById(ticket.ticket_id);
  const channel = await client.channels.fetch(channelId);
  await sendTicketStateMessage(channel, refreshed);

  return refreshed;
}

async function approveCurrentStep({
  client,
  channelId,
  reviewerId,
  reviewerTag
}) {
  const ticket = await findTicketById((await require('../db/queries/ticket.repo').findTicketByChannel(channelId))?.ticket_id);
  if (!ticket) {
    throw new Error('ไม่พบ Ticket ของห้องนี้');
  }

  const currentStep = await findCurrentTicketStepProgress(ticket.ticket_id);
  if (!currentStep) {
    throw new Error('ไม่พบ Step ปัจจุบัน');
  }

  if (!['SUBMITTED', 'ACTIVE'].includes(currentStep.step_status)) {
    throw new Error('Step นี้ยังไม่พร้อมอนุมัติ');
  }

  const result = await withTransaction(async (db) => {
    await updateTicketStepProgressStatus({
      ticketStepProgressId: currentStep.ticket_step_progress_id,
      status: 'APPROVED',
      reviewedBy: reviewerTag,
      reviewRemark: 'APPROVED'
    }, db);

    const nextStep = await findNextQuestStep(ticket.quest_id, currentStep.step_no, db);

    if (nextStep) {
      await createTicketStepProgress({
        ticketId: ticket.ticket_id,
        questId: ticket.quest_id,
        stepId: nextStep.step_id,
        stepNo: nextStep.step_no
      }, db);

      await updateTicketStatus(ticket.ticket_id, 'IN_PROGRESS', {}, db);

      return { completed: false };
    }

    await updateTicketStatus(ticket.ticket_id, 'COMPLETED', {
      closedBy: reviewerTag,
      closeRemark: 'STEP_QUEST_COMPLETED'
    }, db);

    await upsertMainProgress({
      playerId: ticket.player_id,
      professionId: ticket.profession_id,
      questId: ticket.quest_id,
      progressStatus: 'COMPLETED',
      reviewedBy: reviewerTag,
      reviewRemark: 'STEP_QUEST_COMPLETED'
    }, db);

    await insertCompletionLog({
      playerId: ticket.player_id,
      professionId: ticket.profession_id,
      questId: ticket.quest_id,
      submissionId: null,
      completedBy: reviewerTag,
      completionType: 'MAIN',
      remark: 'STEP_QUEST_COMPLETED'
    }, db);

    await resolveCurrentMainQuestByPlayer(ticket.discord_user_id, ticket.profession_code, db);

    return { completed: true };
  });

  const refreshed = await findTicketById(ticket.ticket_id);
  const channel = await client.channels.fetch(channelId);

  if (result.completed) {
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('✅ จบ Step Quest สำเร็จ')
          .setDescription(`เควส **${ticket.quest_name}** เสร็จสมบูรณ์แล้ว`)
          .setTimestamp()
      ]
    });

    await sendQuestCompletionLog(client, refreshed, reviewerTag);
    return refreshed;
  }

  await sendTicketStateMessage(channel, refreshed);
  return refreshed;
}

async function revisionCurrentStep({
  client,
  channelId,
  reviewerId,
  reviewerTag
}) {
  const ticket = await findTicketById((await require('../db/queries/ticket.repo').findTicketByChannel(channelId))?.ticket_id);
  if (!ticket) {
    throw new Error('ไม่พบ Ticket ของห้องนี้');
  }

  const currentStep = await findCurrentTicketStepProgress(ticket.ticket_id);
  if (!currentStep) {
    throw new Error('ไม่พบ Step ปัจจุบัน');
  }

  await withTransaction(async (db) => {
    await updateTicketStepProgressStatus({
      ticketStepProgressId: currentStep.ticket_step_progress_id,
      status: 'ACTIVE',
      reviewedBy: reviewerTag,
      reviewRemark: 'REQUEST_REVISION'
    }, db);

    await updateTicketStatus(ticket.ticket_id, 'WAITING_PLAYER', {}, db);
  });

  const refreshed = await findTicketById(ticket.ticket_id);
  const channel = await client.channels.fetch(channelId);

  await channel.send({
    content: `<@${ticket.discord_user_id}> ขั้นตอน **${currentStep.step_no}** ต้องแก้ไขและส่งใหม่ใน Ticket นี้`
  });

  await sendTicketStateMessage(channel, refreshed);
  return refreshed;
}

module.exports = {
  openStepQuestTicket,
  submitCurrentStep,
  approveCurrentStep,
  revisionCurrentStep
};
