const {
  findActiveMainQuestsByProfession,
  findProfessionByCode,
  findQuestDependencies
} = require('../db/queries/questMaster.repo');

const {
  findPlayerProfession,
  upsertPlayerProfession,
  setCurrentMainQuest,
  markProfessionCompleted,
  findCompletedMainQuestIds
} = require('../db/queries/mainProgress.repo');

const {
  findPlayerByDiscordId
} = require('../db/queries/playerProfile.repo');

function dependencyPassed(dep, completedQuestIds, currentMainLevel) {
  if (dep.dependency_type === 'PREVIOUS_QUEST') {
    return dep.required_quest_id && completedQuestIds.has(dep.required_quest_id);
  }

  if (dep.dependency_type === 'MAIN_LEVEL') {
    return Number(currentMainLevel || 0) >= Number(dep.required_level || 0);
  }

  return true;
}

async function isQuestUnlocked(quest, completedQuestIds, client) {
  const deps = await findQuestDependencies(quest.quest_id, client);

  if (!deps.length) return true;

  const andDeps = deps.filter((d) => d.condition_operator === 'AND');
  const orDeps = deps.filter((d) => d.condition_operator === 'OR');

  const andPassed = andDeps.every((dep) => dependencyPassed(dep, completedQuestIds, quest.quest_level));
  const orPassed = !orDeps.length || orDeps.some((dep) => dependencyPassed(dep, completedQuestIds, quest.quest_level));

  return andPassed && orPassed;
}

async function resolveCurrentMainQuestByPlayer(discordUserId, professionCode, client) {
  const profession = await findProfessionByCode(professionCode, client);

  if (!profession) {
    return {
      profession: null,
      quest: null,
      completedAllMain: false
    };
  }

  const allMainQuests = await findActiveMainQuestsByProfession(professionCode, client);

  if (!allMainQuests.length) {
    return {
      profession,
      quest: null,
      completedAllMain: false
    };
  }

  const player = await findPlayerByDiscordId(discordUserId, client);

  if (!player) {
    return {
      profession,
      quest: allMainQuests[0],
      completedAllMain: false
    };
  }

  const playerProfession = await findPlayerProfession(player.player_id, profession.profession_id, client);
  const completedIds = new Set(await findCompletedMainQuestIds(player.player_id, profession.profession_id, client));

  let resolvedQuest = null;

  for (const quest of allMainQuests) {
    const unlocked = await isQuestUnlocked(quest, completedIds, client);
    if (!unlocked) continue;
    if (!completedIds.has(quest.quest_id)) {
      resolvedQuest = quest;
      break;
    }
  }

  if (!resolvedQuest) {
    if (playerProfession?.current_main_quest_id || !playerProfession?.completed_at) {
      if (playerProfession) {
        await markProfessionCompleted(player.player_id, profession.profession_id, client);
      }
    }

    return {
      profession,
      quest: null,
      completedAllMain: true
    };
  }

  if (!playerProfession) {
    await upsertPlayerProfession({
      playerId: player.player_id,
      professionId: profession.profession_id,
      currentMainQuestId: resolvedQuest.quest_id,
      currentMainLevel: resolvedQuest.quest_level,
      isUnlocked: true
    }, client);
  } else if (playerProfession.current_main_quest_id !== resolvedQuest.quest_id) {
    await setCurrentMainQuest(
      player.player_id,
      profession.profession_id,
      resolvedQuest.quest_id,
      resolvedQuest.quest_level,
      client
    );
  }

  return {
    profession,
    quest: resolvedQuest,
    completedAllMain: false
  };
}

module.exports = {
  resolveCurrentMainQuestByPlayer
};
