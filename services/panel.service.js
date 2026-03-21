const {
  findProfessionByCode,
  findRepeatableQuestsByProfession,
  findQuestRequirements,
  findQuestRewards,
  findQuestGuideMedia
} = require('../db/queries/questMaster.repo');

const {
  resolveCurrentMainQuestByPlayer
} = require('./questProgress.service');

async function getCurrentQuestSummary(discordUserId, professionCode) {
  const resolved = await resolveCurrentMainQuestByPlayer(discordUserId, professionCode);

  if (!resolved.profession) {
    return {
      profession: null,
      quest: null,
      requirements: [],
      rewards: [],
      guideMedia: [],
      completedAllMain: false
    };
  }

  if (!resolved.quest) {
    return {
      profession: resolved.profession,
      quest: null,
      requirements: [],
      rewards: [],
      guideMedia: [],
      completedAllMain: resolved.completedAllMain
    };
  }

  return {
    profession: resolved.profession,
    quest: resolved.quest,
    requirements: await findQuestRequirements(resolved.quest.quest_id),
    rewards: await findQuestRewards(resolved.quest.quest_id),
    guideMedia: await findQuestGuideMedia(resolved.quest.quest_id),
    completedAllMain: false
  };
}

async function getFirstRepeatableQuest(professionCode) {
  const profession = await findProfessionByCode(professionCode);
  const quests = await findRepeatableQuestsByProfession(professionCode);
  const quest = quests[0] || null;

  if (!quest) {
    return { profession, quest: null, requirements: [], rewards: [], guideMedia: [] };
  }

  return {
    profession,
    quest,
    requirements: await findQuestRequirements(quest.quest_id),
    rewards: await findQuestRewards(quest.quest_id),
    guideMedia: await findQuestGuideMedia(quest.quest_id)
  };
}

module.exports = {
  getCurrentQuestSummary,
  getFirstRepeatableQuest
};
