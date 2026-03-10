const {
  findMainQuestByProfession,
  findRepeatableQuestByProfession
} = require('../db/queries/questMaster.repo');

async function getMainQuests(professionCode) {
  return findMainQuestByProfession(professionCode);
}

async function getRepeatableQuests(professionCode) {
  return findRepeatableQuestByProfession(professionCode);
}

module.exports = {
  getMainQuests,
  getRepeatableQuests
};
