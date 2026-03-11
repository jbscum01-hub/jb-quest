const {
  findProfessionByCode,
  findCurrentMainQuestByProfession,
  findRepeatableQuestsByProfession,
  findQuestRequirements,
  findQuestRewards,
  findQuestById
} = require('../db/queries/questMaster.repo');
const {
  findPlayerByDiscordId
} = require('../db/queries/playerProfile.repo');
const {
  findPlayerProfession,
  upsertPlayerProfession,
  setCurrentMainQuest
} = require('../db/queries/mainProgress.repo');

async function resolveCurrentMainQuestForPlayer(discordUserId, professionCode) {
  const profession = await findProfessionByCode(professionCode);
  if (!profession) return { profession: null, quest: null, requirements: [], rewards: [] };

  const player = await findPlayerByDiscordId(discordUserId);

  if (!player) {
    const defaultQuest = await findCurrentMainQuestByProfession(professionCode);
    if (!defaultQuest) return { profession, quest: null, requirements: [], rewards: [] };
    return {
      profession,
      quest: defaultQuest,
      requirements: await findQuestRequirements(defaultQuest.quest_id),
      rewards: await findQuestRewards(defaultQuest.quest_id)
    };
  }

  let playerProfession = await findPlayerProfession(player.player_id, profession.profession_id);

  if (!playerProfession) {
    const firstQuest = await findCurrentMainQuestByProfession(professionCode);
    if (!firstQuest) return { profession, quest: null, requirements: [], rewards: [] };

    playerProfession = await upsertPlayerProfession({
      playerId: player.player_id,
      professionId: profession.profession_id,
      currentMainQuestId: firstQuest.quest_id,
      currentMainLevel: firstQuest.quest_level,
      isUnlocked: true
    });

    return {
      profession,
      quest: firstQuest,
      requirements: await findQuestRequirements(firstQuest.quest_id),
      rewards: await findQuestRewards(firstQuest.quest_id)
    };
  }

  if (!playerProfession.current_main_quest_id) {
    const fallbackQuest = await findCurrentMainQuestByProfession(professionCode);
    if (!fallbackQuest) return { profession, quest: null, requirements: [], rewards: [] };

    await setCurrentMainQuest(player.player_id, profession.profession_id, fallbackQuest.quest_id, fallbackQuest.quest_level);

    return {
      profession,
      quest: fallbackQuest,
      requirements: await findQuestRequirements(fallbackQuest.quest_id),
      rewards: await findQuestRewards(fallbackQuest.quest_id)
    };
  }

  const quest = await findQuestById(playerProfession.current_main_quest_id);

  if (!quest) {
    const fallbackQuest = await findCurrentMainQuestByProfession(professionCode);
    if (!fallbackQuest) return { profession, quest: null, requirements: [], rewards: [] };

    await setCurrentMainQuest(player.player_id, profession.profession_id, fallbackQuest.quest_id, fallbackQuest.quest_level);

    return {
      profession,
      quest: fallbackQuest,
      requirements: await findQuestRequirements(fallbackQuest.quest_id),
      rewards: await findQuestRewards(fallbackQuest.quest_id)
    };
  }

  return {
    profession,
    quest,
    requirements: await findQuestRequirements(quest.quest_id),
    rewards: await findQuestRewards(quest.quest_id)
  };
}

async function getCurrentQuestSummary(discordUserId, professionCode) {
  return resolveCurrentMainQuestForPlayer(discordUserId, professionCode);
}

async function getFirstRepeatableQuest(professionCode) {
  const quests = await findRepeatableQuestsByProfession(professionCode);
  const quest = quests[0] || null;

  if (!quest) {
    return { quest: null, requirements: [], rewards: [] };
  }

  return {
    quest,
    requirements: await findQuestRequirements(quest.quest_id),
    rewards: await findQuestRewards(quest.quest_id)
  };
}

module.exports = {
  getCurrentQuestSummary,
  getFirstRepeatableQuest
};
