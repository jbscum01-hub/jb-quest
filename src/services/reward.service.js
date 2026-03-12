const { getPool } = require('../db/pool');
const { incrementPlayerFame } = require('../db/queries/playerProfile.repo');

function getDb(dbClient) {
  return dbClient || getPool();
}

function buildRewardValueText(reward) {
  if (reward.reward_display_text) return reward.reward_display_text;

  if (reward.reward_type === 'DISCORD_ROLE') {
    return reward.discord_role_name || reward.discord_role_id || 'DISCORD_ROLE';
  }

  if (reward.reward_type === 'SCUM_ITEM') {
    if (reward.reward_item_name && reward.reward_quantity) {
      return `${reward.reward_item_name} x${reward.reward_quantity}`;
    }
    return reward.reward_item_name || reward.reward_item_spawn_name || 'SCUM_ITEM';
  }

  if (reward.reward_type === 'SCUM_MONEY') {
    return reward.reward_value_text || `SCUM_MONEY ${reward.reward_value_number || 0}`;
  }

  if (reward.reward_type === 'FAME_POINT') {
    return reward.reward_value_text || `FAME_POINT ${reward.reward_value_number || 0}`;
  }

  return reward.reward_type;
}

function buildGeneratedCommandText(reward) {
  if (reward.reward_type === 'SCUM_ITEM') {
    return reward.reward_spawn_command_template || reward.reward_display_text || null;
  }

  if (reward.reward_type === 'SCUM_MONEY') {
    return reward.reward_display_text || reward.reward_value_text || null;
  }

  return null;
}

async function hasSuccessfulGrant({ playerId, rewardId }, db) {
  const result = await db.query(
    `
    SELECT 1
    FROM public.tb_quest_reward_grant_log
    WHERE player_id = $1
      AND reward_id = $2
      AND grant_status = 'SUCCESS'
    LIMIT 1
    `,
    [playerId, rewardId]
  );

  return Boolean(result.rows[0]);
}

async function insertGrantLog({
  playerId,
  questId,
  submissionId = null,
  rewardId,
  rewardType,
  rewardValueText = null,
  rewardValueNumber = null,
  grantedBy = null,
  grantStatus = 'SUCCESS',
  grantRemark = null,
  generatedCommandText = null
}, db) {
  const result = await db.query(
    `
    INSERT INTO public.tb_quest_reward_grant_log
    (
      player_id,
      quest_id,
      submission_id,
      reward_id,
      reward_type,
      reward_value_text,
      reward_value_number,
      granted_at,
      granted_by,
      grant_status,
      grant_remark,
      generated_command_text
    )
    VALUES
    (
      $1, $2, $3, $4, $5,
      $6, $7, NOW(), $8, $9, $10, $11
    )
    RETURNING *
    `,
    [
      playerId,
      questId,
      submissionId,
      rewardId,
      rewardType,
      rewardValueText,
      rewardValueNumber,
      grantedBy,
      grantStatus,
      grantRemark,
      generatedCommandText
    ]
  );

  return result.rows[0];
}

async function resolveGuild(client, guildId = null) {
  if (!client) return null;

  if (guildId) {
    return await client.guilds.fetch(guildId).catch(() => null);
  }

  if (client.guilds?.cache?.size) {
    return client.guilds.cache.first() || null;
  }

  try {
    const guilds = await client.guilds.fetch();
    const first = guilds?.first?.();
    if (!first) return null;

    const resolvedGuildId = first.id || first.guild?.id;
    if (!resolvedGuildId) return null;

    return await client.guilds.fetch(resolvedGuildId).catch(() => null);
  } catch {
    return null;
  }
}

async function fetchMember(client, guildId, discordUserId) {
  if (!client || !discordUserId) return null;

  const guild = await resolveGuild(client, guildId);
  if (!guild) return null;

  const member = await guild.members.fetch(discordUserId).catch(() => null);
  return member || null;
}

async function grantQuestRewards({
  client = null,
  guildId = null,
  playerId,
  questId,
  submissionId = null,
  discordUserId = null,
  grantedBy = 'SYSTEM',
  dbClient = null
}) {
  const db = getDb(dbClient);

  const rewardResult = await db.query(
    `
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND step_id IS NULL
      AND grant_on = 'QUEST_COMPLETE'
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );

  const rewards = rewardResult.rows;
  const results = [];

  if (!rewards.length) {
    return {
      granted: [],
      skipped: [],
      failed: [],
      pending: []
    };
  }

  let member = null;
  const needDiscordRole = rewards.some((row) => row.reward_type === 'DISCORD_ROLE');

  if (needDiscordRole) {
    member = await fetchMember(client, guildId, discordUserId);
  }

  for (const reward of rewards) {
    const rewardValueText = buildRewardValueText(reward);
    const rewardValueNumber = reward.reward_value_number ?? reward.reward_quantity ?? null;
    const generatedCommandText = buildGeneratedCommandText(reward);

    try {
      if (reward.reward_cycle_type === 'ONE_TIME') {
        const alreadyGranted = await hasSuccessfulGrant(
          {
            playerId,
            rewardId: reward.reward_id
          },
          db
        );

        if (alreadyGranted) {
          results.push({
            rewardId: reward.reward_id,
            rewardType: reward.reward_type,
            status: 'SKIPPED',
            remark: 'ALREADY_GRANTED_ONE_TIME'
          });
          continue;
        }
      }

      if (reward.reward_type === 'FAME_POINT') {
        const famePoint = Number(reward.reward_value_number || 0);

        if (famePoint > 0) {
          await incrementPlayerFame(
            {
              playerId,
              famePoint
            },
            db
          );
        }

        await insertGrantLog(
          {
            playerId,
            questId,
            submissionId,
            rewardId: reward.reward_id,
            rewardType: reward.reward_type,
            rewardValueText,
            rewardValueNumber: famePoint,
            grantedBy,
            grantStatus: 'SUCCESS',
            grantRemark: famePoint > 0 ? 'FAME_GRANTED' : 'FAME_ZERO'
          },
          db
        );

        results.push({
          rewardId: reward.reward_id,
          rewardType: reward.reward_type,
          status: 'SUCCESS',
          remark: famePoint > 0 ? 'FAME_GRANTED' : 'FAME_ZERO'
        });
        continue;
      }

      if (reward.reward_type === 'DISCORD_ROLE') {
        if (!reward.discord_role_id) {
          await insertGrantLog(
            {
              playerId,
              questId,
              submissionId,
              rewardId: reward.reward_id,
              rewardType: reward.reward_type,
              rewardValueText,
              rewardValueNumber: null,
              grantedBy,
              grantStatus: 'FAILED',
              grantRemark: 'MISSING_DISCORD_ROLE_ID'
            },
            db
          );

          results.push({
            rewardId: reward.reward_id,
            rewardType: reward.reward_type,
            status: 'FAILED',
            remark: 'MISSING_DISCORD_ROLE_ID'
          });
          continue;
        }

        if (!member) {
          await insertGrantLog(
            {
              playerId,
              questId,
              submissionId,
              rewardId: reward.reward_id,
              rewardType: reward.reward_type,
              rewardValueText,
              rewardValueNumber: null,
              grantedBy,
              grantStatus: 'FAILED',
              grantRemark: 'DISCORD_MEMBER_NOT_FOUND'
            },
            db
          );

          results.push({
            rewardId: reward.reward_id,
            rewardType: reward.reward_type,
            status: 'FAILED',
            remark: 'DISCORD_MEMBER_NOT_FOUND'
          });
          continue;
        }

        const alreadyHasRole = member.roles.cache.has(reward.discord_role_id);

        if (!alreadyHasRole) {
          await member.roles.add(
            reward.discord_role_id,
            `Quest reward: ${questId}`
          ).catch((error) => {
            throw new Error(`DISCORD_ROLE_ADD_FAILED: ${error.message}`);
          });
        }

        await insertGrantLog(
          {
            playerId,
            questId,
            submissionId,
            rewardId: reward.reward_id,
            rewardType: reward.reward_type,
            rewardValueText: reward.discord_role_name || reward.discord_role_id,
            rewardValueNumber: null,
            grantedBy,
            grantStatus: 'SUCCESS',
            grantRemark: alreadyHasRole
              ? 'ROLE_ALREADY_PRESENT'
              : 'ROLE_GRANTED'
          },
          db
        );

        results.push({
          rewardId: reward.reward_id,
          rewardType: reward.reward_type,
          status: 'SUCCESS',
          remark: alreadyHasRole ? 'ROLE_ALREADY_PRESENT' : 'ROLE_GRANTED'
        });
        continue;
      }

      if (reward.reward_type === 'SCUM_ITEM' || reward.reward_type === 'SCUM_MONEY') {
        await insertGrantLog(
          {
            playerId,
            questId,
            submissionId,
            rewardId: reward.reward_id,
            rewardType: reward.reward_type,
            rewardValueText,
            rewardValueNumber,
            grantedBy,
            grantStatus: 'PENDING',
            grantRemark: 'WAIT_MANUAL_GRANT',
            generatedCommandText
          },
          db
        );

        results.push({
          rewardId: reward.reward_id,
          rewardType: reward.reward_type,
          status: 'PENDING',
          remark: 'WAIT_MANUAL_GRANT'
        });
        continue;
      }

      await insertGrantLog(
        {
          playerId,
          questId,
          submissionId,
          rewardId: reward.reward_id,
          rewardType: reward.reward_type,
          rewardValueText,
          rewardValueNumber,
          grantedBy,
          grantStatus: 'FAILED',
          grantRemark: 'UNSUPPORTED_REWARD_TYPE'
        },
        db
      );

      results.push({
        rewardId: reward.reward_id,
        rewardType: reward.reward_type,
        status: 'FAILED',
        remark: 'UNSUPPORTED_REWARD_TYPE'
      });
    } catch (error) {
      await insertGrantLog(
        {
          playerId,
          questId,
          submissionId,
          rewardId: reward.reward_id,
          rewardType: reward.reward_type,
          rewardValueText,
          rewardValueNumber,
          grantedBy,
          grantStatus: 'FAILED',
          grantRemark: String(error.message || 'GRANT_FAILED').slice(0, 1000),
          generatedCommandText
        },
        db
      );

      results.push({
        rewardId: reward.reward_id,
        rewardType: reward.reward_type,
        status: 'FAILED',
        remark: error.message || 'GRANT_FAILED'
      });
    }
  }

  return {
    granted: results.filter((row) => row.status === 'SUCCESS'),
    skipped: results.filter((row) => row.status === 'SKIPPED'),
    failed: results.filter((row) => row.status === 'FAILED'),
    pending: results.filter((row) => row.status === 'PENDING')
  };
}

module.exports = {
  grantQuestRewards,
  grantRewards: grantQuestRewards
};
