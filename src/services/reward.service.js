const { getPool } = require('../db/pool');

function getDb(dbClient) {
  return dbClient || getPool();
}

function buildRewardValueText(reward) {
  if (reward.reward_display_text) return reward.reward_display_text;
  if (reward.reward_type === 'DISCORD_ROLE') return reward.discord_role_id || 'DISCORD_ROLE';
  return reward.reward_type || 'REWARD';
}

function buildGeneratedCommandText(reward) {
  if (reward.reward_type === 'SCUM_ITEM') {
    return reward.reward_spawn_command_template || null;
  }
  return null;
}

async function insertGrantLog({ playerId, questId, submissionId = null, rewardId, rewardType, rewardValueText = null, rewardValueNumber = null, grantedBy = null, grantStatus = 'SUCCESS', grantRemark = null, generatedCommandText = null }, db) {
  const result = await db.query(`
    INSERT INTO public.tb_quest_reward_grant_log
    (player_id, quest_id, submission_id, reward_id, reward_type, reward_value_text, reward_value_number, granted_at, granted_by, grant_status, grant_remark, generated_command_text)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11)
    RETURNING *
  `, [playerId, questId, submissionId, rewardId, rewardType, rewardValueText, rewardValueNumber, grantedBy, grantStatus, grantRemark, generatedCommandText]);
  return result.rows[0];
}

async function resolveGuild(client) {
  if (!client) return null;
  if (client.guilds?.cache?.size) return client.guilds.cache.first() || null;
  try {
    const guilds = await client.guilds.fetch();
    const first = guilds?.first?.();
    const guildId = first?.id || first?.guild?.id;
    if (!guildId) return null;
    return await client.guilds.fetch(guildId).catch(() => null);
  } catch {
    return null;
  }
}

async function fetchMember(client, discordUserId) {
  if (!client || !discordUserId) return null;
  const guild = await resolveGuild(client);
  if (!guild) return null;
  return guild.members.fetch(discordUserId).catch(() => null);
}

async function grantQuestRewards({ client = null, playerId, questId, submissionId = null, discordUserId = null, grantedBy = 'SYSTEM', dbClient = null }) {
  const db = getDb(dbClient);
  const rewardResult = await db.query(`
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND step_id IS NULL
      AND grant_on = 'QUEST_COMPLETE'
      AND is_active = TRUE
      AND reward_type IN ('SCUM_ITEM', 'DISCORD_ROLE')
    ORDER BY sort_order ASC, created_at ASC
  `, [questId]);

  const rewards = rewardResult.rows;
  const results = [];
  if (!rewards.length) return { granted: [], skipped: [], failed: [], pending: [] };

  let member = null;
  if (rewards.some((row) => row.reward_type === 'DISCORD_ROLE')) {
    member = await fetchMember(client, discordUserId);
  }

  for (const reward of rewards) {
    const rewardValueText = buildRewardValueText(reward);
    const generatedCommandText = buildGeneratedCommandText(reward);

    try {
      if (reward.reward_type === 'DISCORD_ROLE') {
        if (!reward.discord_role_id) {
          await insertGrantLog({ playerId, questId, submissionId, rewardId: reward.reward_id, rewardType: reward.reward_type, rewardValueText, grantedBy, grantStatus: 'FAILED', grantRemark: 'ROLE_ID_MISSING' }, db);
          results.push({ rewardId: reward.reward_id, rewardType: reward.reward_type, status: 'FAILED', remark: 'ROLE_ID_MISSING' });
          continue;
        }
        if (!member) {
          await insertGrantLog({ playerId, questId, submissionId, rewardId: reward.reward_id, rewardType: reward.reward_type, rewardValueText, grantedBy, grantStatus: 'FAILED', grantRemark: 'MEMBER_NOT_FOUND' }, db);
          results.push({ rewardId: reward.reward_id, rewardType: reward.reward_type, status: 'FAILED', remark: 'MEMBER_NOT_FOUND' });
          continue;
        }

        const role = member.guild.roles.cache.get(reward.discord_role_id) || await member.guild.roles.fetch(reward.discord_role_id).catch(() => null);
        if (!role) {
          await insertGrantLog({ playerId, questId, submissionId, rewardId: reward.reward_id, rewardType: reward.reward_type, rewardValueText, grantedBy, grantStatus: 'FAILED', grantRemark: 'ROLE_NOT_FOUND' }, db);
          results.push({ rewardId: reward.reward_id, rewardType: reward.reward_type, status: 'FAILED', remark: 'ROLE_NOT_FOUND' });
          continue;
        }

        if (!member.roles.cache.has(role.id)) {
          await member.roles.add(role).catch((error) => { throw new Error(`ROLE_ADD_FAILED: ${error.message}`); });
        }

        await insertGrantLog({ playerId, questId, submissionId, rewardId: reward.reward_id, rewardType: reward.reward_type, rewardValueText, grantedBy, grantStatus: 'SUCCESS', grantRemark: 'ROLE_GRANTED' }, db);
        results.push({ rewardId: reward.reward_id, rewardType: reward.reward_type, status: 'SUCCESS', remark: 'ROLE_GRANTED' });
        continue;
      }

      await insertGrantLog({ playerId, questId, submissionId, rewardId: reward.reward_id, rewardType: reward.reward_type, rewardValueText, grantedBy, grantStatus: 'PENDING', grantRemark: 'ITEM_COMMAND_FOR_ADMIN', generatedCommandText }, db);
      results.push({ rewardId: reward.reward_id, rewardType: reward.reward_type, status: 'PENDING', remark: 'ITEM_COMMAND_FOR_ADMIN', generatedCommandText });
    } catch (error) {
      await insertGrantLog({ playerId, questId, submissionId, rewardId: reward.reward_id, rewardType: reward.reward_type, rewardValueText, grantedBy, grantStatus: 'FAILED', grantRemark: error.message, generatedCommandText }, db);
      results.push({ rewardId: reward.reward_id, rewardType: reward.reward_type, status: 'FAILED', remark: error.message });
    }
  }

  return {
    granted: results.filter((r) => r.status === 'SUCCESS'),
    skipped: results.filter((r) => r.status === 'SKIPPED'),
    failed: results.filter((r) => r.status === 'FAILED'),
    pending: results.filter((r) => r.status === 'PENDING')
  };
}

module.exports = { grantQuestRewards, buildRewardValueText, buildGeneratedCommandText };