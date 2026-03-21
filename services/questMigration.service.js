const { EmbedBuilder } = require('discord.js');
const { withTransaction, getPool } = require('../db/pool');
const {
  findProfessionByCode,
  findQuestById,
  findActiveMainQuestsByProfession,
  findQuestRewards
} = require('../db/queries/questMaster.repo');
const {
  findPlayerByDiscordId,
  createPlayerProfile,
  updatePlayerNames
} = require('../db/queries/playerProfile.repo');
const {
  upsertMainProgress,
  upsertPlayerProfession,
  setCurrentMainQuest,
  markProfessionCompleted,
  findMainProgress
} = require('../db/queries/mainProgress.repo');
const { insertCompletionLog } = require('../db/queries/review.repo');
const { grantQuestRewards } = require('./reward.service');

function normalizeDiscordUserId(raw) {
  const value = String(raw || '').trim();
  const match = value.match(/^(?:<@!?)?(\d{15,25})>?$/);
  if (!match) {
    throw new Error('กรุณากรอก Discord User ID หรือ mention ให้ถูกต้อง');
  }
  return match[1];
}

function parseYesNo(raw, defaultValue = false) {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return defaultValue;
  return ['Y', 'YES', 'TRUE', '1', 'เปิด'].includes(value);
}

async function ensurePlayerProfileFromGuild({ client, guildId, discordUserId, ingameName, db }) {
  let discordUsername = null;
  let discordDisplayName = null;

  if (client && guildId && discordUserId) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    const member = guild ? await guild.members.fetch(discordUserId).catch(() => null) : null;
    if (member) {
      discordUsername = member.user?.tag || member.user?.username || null;
      discordDisplayName = member.displayName || member.nickname || member.user?.globalName || member.user?.username || null;
    }
  }

  let player = await findPlayerByDiscordId(discordUserId, db);

  if (!player) {
    player = await createPlayerProfile(
      {
        discordUserId,
        discordUsername,
        discordDisplayName,
        ingameName: ingameName || null
      },
      db
    );
  } else {
    player = await updatePlayerNames(
      {
        playerId: player.player_id,
        discordUsername,
        discordDisplayName,
        ingameName: ingameName || null
      },
      db
    );
  }

  return player;
}

async function applyQuestCompletion({
  client,
  guildId,
  db,
  player,
  profession,
  quest,
  completedBy,
  remark,
  grantRoleNow
}) {
  const existing = await findMainProgress(player.player_id, profession.profession_id, quest.quest_id, db);
  const alreadyCompleted = existing?.progress_status === 'COMPLETED';

  await upsertMainProgress(
    {
      playerId: player.player_id,
      professionId: profession.profession_id,
      questId: quest.quest_id,
      progressStatus: 'COMPLETED',
      reviewedBy: completedBy,
      reviewRemark: remark,
      incrementSubmission: false
    },
    db
  );

  if (!alreadyCompleted) {
    await insertCompletionLog(
      {
        playerId: player.player_id,
        professionId: profession.profession_id,
        questId: quest.quest_id,
        submissionId: null,
        completedBy,
        completionType: 'MAIN',
        remark
      },
      db
    );
  }

  let rewardSummary = null;
  if (grantRoleNow) {
    const rewards = await findQuestRewards(quest.quest_id, db);
    const hasDiscordRole = rewards.some((row) => row.reward_type === 'DISCORD_ROLE' && row.is_active !== false);
    if (hasDiscordRole) {
      rewardSummary = await grantQuestRewards({
        client,
        playerId: player.player_id,
        questId: quest.quest_id,
        submissionId: null,
        discordUserId: player.discord_user_id,
        grantedBy: completedBy,
        dbClient: db
      });
    }
  }

  return {
    alreadyCompleted,
    rewardSummary
  };
}

async function finalizeProfessionProgress({ db, playerId, professionId, remainingQuest }) {
  await upsertPlayerProfession(
    {
      playerId,
      professionId,
      currentMainQuestId: remainingQuest?.quest_id || null,
      currentMainLevel: remainingQuest?.quest_level || null,
      isUnlocked: true
    },
    db
  );

  if (remainingQuest) {
    await setCurrentMainQuest(playerId, professionId, remainingQuest.quest_id, remainingQuest.quest_level, db);
    return;
  }

  await markProfessionCompleted(playerId, professionId, db);
}

function buildImportResultEmbed({ mode, player, profession, importedQuests, skippedQuests, nextQuest, grantRoleNow, roleSummary }) {
  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(mode === 'SINGLE' ? '🗂 Legacy Import · Single Quest' : '🗂 Legacy Import · Up To Level')
    .setDescription([
      `**ผู้เล่น:** <@${player.discord_user_id}>`,
      `**ชื่อในเกม:** ${player.ingame_name || '-'}`,
      `**สายอาชีพ:** ${profession.profession_name_th || profession.profession_code}`,
      `**Grant Role ทันที:** ${grantRoleNow ? 'ใช่' : 'ไม่ใช่'}`
    ].join('\n'))
    .addFields(
      {
        name: '✅ เควสที่บันทึกสำเร็จ',
        value: importedQuests.length
          ? importedQuests.map((q) => `• Lv${q.quest_level} · ${q.quest_code} · ${q.quest_name}`).join('\n').slice(0, 1024)
          : 'ไม่มี',
        inline: false
      },
      {
        name: '↩️ เควสที่ข้ามเพราะเคยครบแล้ว',
        value: skippedQuests.length
          ? skippedQuests.map((q) => `• Lv${q.quest_level} · ${q.quest_code}`).join('\n').slice(0, 1024)
          : 'ไม่มี',
        inline: false
      },
      {
        name: '🎯 เควสปัจจุบันหลัง import',
        value: nextQuest ? `Lv${nextQuest.quest_level} · ${nextQuest.quest_code} · ${nextQuest.quest_name}` : 'จบสายนี้แล้ว',
        inline: false
      }
    )
    .setFooter({ text: 'ไม่มีการส่ง DM ให้ผู้เล่น' })
    .setTimestamp();

  if (grantRoleNow) {
    const lines = [];
    for (const item of roleSummary) {
      if (!item.summary) continue;
      const granted = item.summary.granted?.length || 0;
      const skipped = item.summary.skipped?.length || 0;
      const failed = item.summary.failed?.length || 0;
      const pending = item.summary.pending?.length || 0;
      lines.push(`• ${item.questCode}: success ${granted}, skipped ${skipped}, failed ${failed}, pending ${pending}`);
    }
    embed.addFields({
      name: '🎖 ผลการแอด Role/Reward',
      value: lines.length ? lines.join('\n').slice(0, 1024) : 'ไม่มี role reward ที่ต้องดำเนินการ',
      inline: false
    });
  }

  return embed;
}

async function migrateMainQuestUpToLevel({ client, guildId, rawDiscordUserId, professionCode, uptoLevel, ingameName, note, grantRoleNow, adminTag }) {
  return withTransaction(async (db) => {
    const discordUserId = normalizeDiscordUserId(rawDiscordUserId);
    const profession = await findProfessionByCode(professionCode, db);
    if (!profession) throw new Error(`ไม่พบสายอาชีพ ${professionCode}`);

    const allMainQuests = await findActiveMainQuestsByProfession(professionCode, db);
    const targetQuests = allMainQuests.filter((q) => Number(q.quest_level) <= Number(uptoLevel));
    if (!targetQuests.length) {
      throw new Error(`ไม่พบ Main Quest ของสาย ${professionCode} ถึง Lv${uptoLevel}`);
    }

    const player = await ensurePlayerProfileFromGuild({
      client,
      guildId,
      discordUserId,
      ingameName,
      db
    });

    const importedQuests = [];
    const skippedQuests = [];
    const roleSummary = [];
    const remark = note || 'LEGACY_IMPORT_FROM_DISCORD';

    for (const quest of targetQuests) {
      const result = await applyQuestCompletion({
        client,
        guildId,
        db,
        player,
        profession,
        quest,
        completedBy: adminTag,
        remark,
        grantRoleNow
      });

      if (result.alreadyCompleted) skippedQuests.push(quest);
      else importedQuests.push(quest);

      if (result.rewardSummary) {
        roleSummary.push({ questCode: quest.quest_code, summary: result.rewardSummary });
      }
    }

    const nextQuest = allMainQuests.find((q) => Number(q.quest_level) > Number(uptoLevel)) || null;
    await finalizeProfessionProgress({
      db,
      playerId: player.player_id,
      professionId: profession.profession_id,
      remainingQuest: nextQuest
    });

    return buildImportResultEmbed({
      mode: 'UPTO',
      player,
      profession,
      importedQuests,
      skippedQuests,
      nextQuest,
      grantRoleNow,
      roleSummary
    });
  });
}

async function migrateSingleQuest({ client, guildId, rawDiscordUserId, questId, ingameName, note, grantRoleNow, autoFillPrevious, adminTag }) {
  return withTransaction(async (db) => {
    const discordUserId = normalizeDiscordUserId(rawDiscordUserId);
    const quest = await findQuestById(questId, db);
    if (!quest) throw new Error('ไม่พบเควสที่เลือก');
    if (quest.category_code !== 'MAIN') throw new Error('รองรับเฉพาะ Main Quest สำหรับ legacy import');

    const profession = await findProfessionByCode(quest.profession_code, db);
    if (!profession) throw new Error(`ไม่พบสายอาชีพ ${quest.profession_code}`);

    const allMainQuests = await findActiveMainQuestsByProfession(quest.profession_code, db);
    const targetQuests = autoFillPrevious
      ? allMainQuests.filter((q) => Number(q.quest_level) <= Number(quest.quest_level))
      : allMainQuests.filter((q) => q.quest_id === quest.quest_id);

    const player = await ensurePlayerProfileFromGuild({
      client,
      guildId,
      discordUserId,
      ingameName,
      db
    });

    const importedQuests = [];
    const skippedQuests = [];
    const roleSummary = [];
    const remark = note || 'LEGACY_IMPORT_SINGLE_FROM_DISCORD';

    for (const row of targetQuests) {
      const result = await applyQuestCompletion({
        client,
        guildId,
        db,
        player,
        profession,
        quest: row,
        completedBy: adminTag,
        remark,
        grantRoleNow
      });

      if (result.alreadyCompleted) skippedQuests.push(row);
      else importedQuests.push(row);

      if (result.rewardSummary) {
        roleSummary.push({ questCode: row.quest_code, summary: result.rewardSummary });
      }
    }

    const nextQuest = allMainQuests.find((q) => Number(q.quest_level) > Number(quest.quest_level)) || null;
    await finalizeProfessionProgress({
      db,
      playerId: player.player_id,
      professionId: profession.profession_id,
      remainingQuest: nextQuest
    });

    return buildImportResultEmbed({
      mode: 'SINGLE',
      player,
      profession,
      importedQuests,
      skippedQuests,
      nextQuest,
      grantRoleNow,
      roleSummary
    });
  });
}

async function buildMigrationHistoryEmbed({ rawDiscordUserId, professionCode }) {
  const db = getPool();
  const discordUserId = normalizeDiscordUserId(rawDiscordUserId);
  const player = await findPlayerByDiscordId(discordUserId, db);
  const profession = await findProfessionByCode(professionCode, db);

  if (!player) {
    throw new Error('ยังไม่พบโปรไฟล์ผู้เล่นนี้ในระบบ');
  }
  if (!profession) {
    throw new Error(`ไม่พบสายอาชีพ ${professionCode}`);
  }

  const progressResult = await db.query(
    `
    SELECT q.quest_code,
           q.quest_name,
           q.quest_level,
           mp.progress_status,
           mp.last_completed_at,
           mp.reviewed_by,
           mp.review_remark
    FROM public.tb_quest_player_main_progress mp
    JOIN public.tb_quest_master q
      ON q.quest_id = mp.quest_id
    WHERE mp.player_id = $1
      AND mp.profession_id = $2
    ORDER BY q.quest_level ASC, q.display_order ASC, q.quest_code ASC
    `,
    [player.player_id, profession.profession_id]
  );

  const profResult = await db.query(
    `
    SELECT pp.current_main_level,
           pp.current_main_quest_id,
           q.quest_code AS current_quest_code,
           q.quest_name AS current_quest_name,
           pp.completed_at
    FROM public.tb_quest_player_profession pp
    LEFT JOIN public.tb_quest_master q
      ON q.quest_id = pp.current_main_quest_id
    WHERE pp.player_id = $1
      AND pp.profession_id = $2
    LIMIT 1
    `,
    [player.player_id, profession.profession_id]
  );

  const completed = progressResult.rows.filter((row) => row.progress_status === 'COMPLETED');
  const current = profResult.rows[0] || null;

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🧾 ประวัติ Legacy / Main Progress · ${profession.profession_name_th || profession.profession_code}`)
    .setDescription([
      `**ผู้เล่น:** <@${player.discord_user_id}>`,
      `**ชื่อในเกม:** ${player.ingame_name || '-'}`,
      `**จำนวนเควสที่มีสถานะ COMPLETED:** ${completed.length}`,
      `**เควสปัจจุบัน:** ${current?.current_quest_code ? `Lv${current.current_main_level || '-'} · ${current.current_quest_code} · ${current.current_quest_name}` : (current?.completed_at ? 'จบสายนี้แล้ว' : 'ยังไม่เริ่ม')}`
    ].join('\n'))
    .addFields({
      name: '📚 รายการเควสที่เคยบันทึกไว้',
      value: completed.length
        ? completed.map((row) => `• Lv${row.quest_level} · ${row.quest_code} · ${row.quest_name}`).join('\n').slice(0, 1024)
        : 'ยังไม่มีข้อมูล',
      inline: false
    })
    .setFooter({ text: 'ไม่มีการส่ง DM ให้ผู้เล่น' })
    .setTimestamp();
}

module.exports = {
  normalizeDiscordUserId,
  parseYesNo,
  migrateMainQuestUpToLevel,
  migrateSingleQuest,
  buildMigrationHistoryEmbed
};
