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

async function getCurrentQuestSummary(discordUserId, professionCode) {
  const profession = await findProfessionByCode(professionCode);

  if (!profession) {
    return { profession: null, quest: null, requirements: [], rewards: [] };
  }

  const player = await findPlayerByDiscordId(discordUserId);

  // ยังไม่มี player profile -> ใช้เควสแรกของสาย
  if (!player) {
    const firstQuest = await findCurrentMainQuestByProfession(professionCode);

    if (!firstQuest) {
      return { profession, quest: null, requirements: [], rewards: [] };
    }

    return {
      profession,
      quest: firstQuest,
      requirements: await findQuestRequirements(firstQuest.quest_id),
      rewards: await findQuestRewards(firstQuest.quest_id)
    };
  }

  let playerProfession = await findPlayerProfession(
    player.player_id,
    profession.profession_id
  );

  // ยังไม่มี progress ของสายนี้ -> set เควสแรกให้เลย
  if (!playerProfession) {
    const firstQuest = await findCurrentMainQuestByProfession(professionCode);

    if (!firstQuest) {
      return { profession, quest: null, requirements: [], rewards: [] };
    }

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

  // ถ้า current_main_quest_id ว่าง ให้ fallback เป็นเควสแรก
  if (!playerProfession.current_main_quest_id) {
    const firstQuest = await findCurrentMainQuestByProfession(professionCode);

    if (!firstQuest) {
      return { profession, quest: null, requirements: [], rewards: [] };
    }

    await setCurrentMainQuest(
      player.player_id,
      profession.profession_id,
      firstQuest.quest_id,
      firstQuest.quest_level
    );

    return {
      profession,
      quest: firstQuest,
      requirements: await findQuestRequirements(firstQuest.quest_id),
      rewards: await findQuestRewards(firstQuest.quest_id)
    };
  }

  const currentQuest = await findQuestById(playerProfession.current_main_quest_id);

  if (!currentQuest) {
    return { profession, quest: null, requirements: [], rewards: [] };
  }

  return {
    profession,
    quest: currentQuest,
    requirements: await findQuestRequirements(currentQuest.quest_id),
    rewards: await findQuestRewards(currentQuest.quest_id)
  };
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
