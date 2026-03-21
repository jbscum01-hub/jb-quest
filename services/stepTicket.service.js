const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { withTransaction, getPool } = require('../db/pool');
const { findProfessionByCode } = require('../db/queries/questMaster.repo');
const {
  findPlayerByDiscordId,
  createPlayerProfile,
  updatePlayerNames
} = require('../db/queries/playerProfile.repo');
const {
  createTicket,
  updateTicketStatus,
  findTicketById,
  findTicketByChannel,
  findOpenTicketByPlayerQuest
} = require('../db/queries/ticket.repo');
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
const { grantQuestRewards } = require('./reward.service');
const { getGlobalConfigValue } = require('./discordConfig.service');
const { buildTicketStepEmbed } = require('../builders/embeds/ticketStep.embed');
const {
  buildTicketStepComponents,
  buildTicketCloseComponents
} = require('../builders/components/ticketStep.components');
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

async function ensurePlayerProfile(
  {
    discordUserId,
    discordUsername,
    discordDisplayName,
    ingameName
  },
  client
) {
  let player = await findPlayerByDiscordId(discordUserId, client);

  if (!player) {
    player = await createPlayerProfile(
      {
        discordUserId,
        discordUsername,
        discordDisplayName,
        ingameName
      },
      client
    );
  } else {
    player = await updatePlayerNames(
      {
        playerId: player.player_id,
        discordUsername,
        discordDisplayName,
        ingameName
      },
      client
    );
  }

  return player;
}

async function getTicketFromChannel(channelId) {
  const ticketByChannel = await findTicketByChannel(channelId);
  if (!ticketByChannel) return null;

  const fullTicket = await findTicketById(ticketByChannel.ticket_id);
  return fullTicket || ticketByChannel;
}

async function clearOldActionMessage(message) {
  if (!message) return;
  await message.edit({ components: [] }).catch(() => null);
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

  const components = buildTicketStepComponents(ticket.ticket_id, currentStep.step_no);

  return channel.send({
    embeds: [embed],
    components
  });
}

async function findLatestTicketSubmission(ticketId) {
  const db = getPool();

  const result = await db.query(
    `
    SELECT s.*,
           a.file_url
    FROM public.tb_quest_submission s
    LEFT JOIN LATERAL (
      SELECT file_url
      FROM public.tb_quest_submission_attachment a
      WHERE a.submission_id = s.submission_id
      ORDER BY a.uploaded_at DESC
      LIMIT 1
    ) a ON TRUE
    WHERE s.ticket_id = $1
      AND s.submission_type = 'STEP'
    ORDER BY s.submitted_at DESC, s.created_at DESC
    LIMIT 1
    `,
    [ticketId]
  );

  return result.rows[0] || null;
}

async function sendQuestCompletionLog(client, ticket, reviewerTag = null) {
  const logChannelId = await getGlobalConfigValue(
    DISCORD_CONFIG_KEYS.QUEST_SUBMISSION_LOG_CHANNEL
  );
  if (!logChannelId) return;

  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;

  const latestSubmission = await findLatestTicketSubmission(ticket.ticket_id);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('✅ Step Quest Completed')
    .setDescription(
      [
        `Submission ID: ${latestSubmission?.submission_id || '-'}`,
        `ผู้เล่น: <@${ticket.discord_user_id}>`,
        `ชื่อในเกม: ${latestSubmission?.player_ingame_name || ticket.ingame_name || '-'}`,
        `สายอาชีพ: ${ticket.profession_name_th || ticket.profession_code || '-'}`,
        `เควส: ${ticket.quest_name || '-'}`,
        `ผู้ตรวจ: ${reviewerTag || '-'}`,
        `หมายเหตุ: STEP_QUEST_COMPLETED`
      ].join('\n')
    )
    .setTimestamp();

  if (latestSubmission?.file_url) {
    embed.setImage(latestSubmission.file_url);
  }

  await channel.send({ embeds: [embed] });
}

async function closeTicketRoom({
  client,
  channelId,
  reviewerTag
}) {
  const ticket = await getTicketFromChannel(channelId);
  if (!ticket) {
    throw new Error('ไม่พบ Ticket ของห้องนี้');
  }

  await updateTicketStatus(ticket.ticket_id, 'CLOSED', {
    closedBy: reviewerTag,
    closeRemark: 'MANUAL_CLOSE'
  });

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('🔒 ปิดห้อง Ticket')
        .setDescription('ห้องนี้จะถูกลบในอีก 5 วินาที')
        .setTimestamp()
    ]
  });

  setTimeout(async () => {
    await channel.delete('Step quest ticket closed').catch(() => null);
  }, 5000);
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

  const ticketCategoryId = await getGlobalConfigValue(
    DISCORD_CONFIG_KEYS.QUEST_TICKET_CATEGORY
  );
  const adminRoleId = await getGlobalConfigValue(
    DISCORD_CONFIG_KEYS.QUEST_ADMIN_ROLE
  );

  const player = await ensurePlayerProfile({
    discordUserId: user.id,
    discordUsername: user.tag,
    discordDisplayName: member?.displayName || user.username,
    ingameName: null
  });

  const existing = await findOpenTicketByPlayerQuest(player.player_id, quest.quest_id);
  if (existing) {
    const existingChannel = existing.discord_channel_id
      ? guild.channels.cache.get(existing.discord_channel_id)
      : null;

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

    const createdTicket = await createTicket(
      {
        ticketCode: makeTicketCode(professionCode),
        playerId: player.player_id,
        professionId: profession.profession_id,
        questId: quest.quest_id,
        discordChannelId: channel.id
      },
      db
    );

    await createTicketStepProgress(
      {
        ticketId: createdTicket.ticket_id,
        questId: quest.quest_id,
        stepId: firstStep.step_id,
        stepNo: firstStep.step_no
      },
      db
    );

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
  userId,
  actionMessage = null
}) {
  const ticket = await getTicketFromChannel(channelId);

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
    await updateTicketStepProgressStatus(
      {
        ticketStepProgressId: currentStep.ticket_step_progress_id,
        status: 'SUBMITTED',
        incrementAttempt: true,
        markSubmitted: true
      },
      db
    );

    await updateTicketStatus(ticket.ticket_id, 'WAITING_ADMIN', {}, db);
  });

  await clearOldActionMessage(actionMessage);

  const refreshed = await findTicketById(ticket.ticket_id);
  const channel = await client.channels.fetch(channelId);
  await sendTicketStateMessage(channel, refreshed);

  return refreshed;
}

async function approveCurrentStep({
  client,
  channelId,
  reviewerTag,
  actionMessage = null
}) {
  const ticket = await getTicketFromChannel(channelId);

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

  const latestSubmission = await findLatestTicketSubmission(ticket.ticket_id);

  const result = await withTransaction(async (db) => {
    await updateTicketStepProgressStatus(
      {
        ticketStepProgressId: currentStep.ticket_step_progress_id,
        status: 'APPROVED',
        reviewedBy: reviewerTag,
        reviewRemark: 'APPROVED'
      },
      db
    );

    const nextStep = await findNextQuestStep(ticket.quest_id, currentStep.step_no, db);

    if (nextStep) {
      await createTicketStepProgress(
        {
          ticketId: ticket.ticket_id,
          questId: ticket.quest_id,
          stepId: nextStep.step_id,
          stepNo: nextStep.step_no
        },
        db
      );

      await updateTicketStatus(ticket.ticket_id, 'IN_PROGRESS', {}, db);

      return {
        completed: false,
        rewardGrantPayload: null
      };
    }

    await updateTicketStatus(
      ticket.ticket_id,
      'COMPLETED',
      {
        closedBy: reviewerTag,
        closeRemark: 'STEP_QUEST_COMPLETED'
      },
      db
    );

    await upsertMainProgress(
      {
        playerId: ticket.player_id,
        professionId: ticket.profession_id,
        questId: ticket.quest_id,
        progressStatus: 'COMPLETED',
        reviewedBy: reviewerTag,
        reviewRemark: 'STEP_QUEST_COMPLETED'
      },
      db
    );

    await insertCompletionLog(
      {
        playerId: ticket.player_id,
        professionId: ticket.profession_id,
        questId: ticket.quest_id,
        submissionId: latestSubmission?.submission_id || null,
        completedBy: reviewerTag,
        completionType: 'MAIN',
        remark: 'STEP_QUEST_COMPLETED'
      },
      db
    );

    await resolveCurrentMainQuestByPlayer(
      ticket.discord_user_id,
      ticket.profession_code,
      db
    );

    return {
      completed: true,
      rewardGrantPayload: {
        playerId: ticket.player_id,
        questId: ticket.quest_id,
        submissionId: latestSubmission?.submission_id || null,
        discordUserId: ticket.discord_user_id
      }
    };
  });

  if (result.completed && result.rewardGrantPayload) {
    await grantQuestRewards({
      client,
      playerId: result.rewardGrantPayload.playerId,
      questId: result.rewardGrantPayload.questId,
      submissionId: result.rewardGrantPayload.submissionId,
      discordUserId: result.rewardGrantPayload.discordUserId,
      grantedBy: reviewerTag
    });
  }

  await clearOldActionMessage(actionMessage);

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
      ],
      components: buildTicketCloseComponents(ticket.ticket_id)
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
  reviewerTag,
  actionMessage = null
}) {
  const ticket = await getTicketFromChannel(channelId);

  if (!ticket) {
    throw new Error('ไม่พบ Ticket ของห้องนี้');
  }

  const currentStep = await findCurrentTicketStepProgress(ticket.ticket_id);
  if (!currentStep) {
    throw new Error('ไม่พบ Step ปัจจุบัน');
  }

  if (!['SUBMITTED', 'ACTIVE'].includes(currentStep.step_status)) {
    throw new Error('Step นี้ยังไม่พร้อมส่งกลับแก้ไข');
  }

  await withTransaction(async (db) => {
    await updateTicketStepProgressStatus(
      {
        ticketStepProgressId: currentStep.ticket_step_progress_id,
        status: 'ACTIVE',
        reviewedBy: reviewerTag,
        reviewRemark: 'REVISION_REQUIRED'
      },
      db
    );

    await updateTicketStatus(ticket.ticket_id, 'WAITING_PLAYER', {}, db);
  });

  await clearOldActionMessage(actionMessage);

  const refreshed = await findTicketById(ticket.ticket_id);
  const channel = await client.channels.fetch(channelId);

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('📝 กรุณาแก้ไข Step')
        .setDescription(`Step ${currentStep.step_no} ถูกส่งกลับให้แก้ไขแล้ว`)
        .setTimestamp()
    ]
  });

  await sendTicketStateMessage(channel, refreshed);
  return refreshed;
}

module.exports = {
  openStepQuestTicket,
  submitCurrentStep,
  approveCurrentStep,
  revisionCurrentStep,
  closeTicketRoom
};
