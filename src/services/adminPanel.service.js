const repo = require('../db/queries/adminPanel.repo');
const embeds = require('../builders/embeds/adminPanel.embed');
const components = require('../builders/components/adminPanel.components');

async function buildAdminHomePayload() {
  return {
    embeds: [embeds.buildAdminHomeEmbed()],
    components: components.buildAdminHomeComponents()
  };
}

async function buildPanelManagementPayload() {
  return {
    embeds: [embeds.buildPanelManagementEmbed()],
    components: components.buildPanelManagementComponents()
  };
}

async function buildPanelStatusPayload() {
  const rows = await repo.findPanelStatusRows();
  return {
    embeds: [embeds.buildPanelStatusEmbed(rows)],
    components: components.buildPanelManagementComponents()
  };
}

async function buildMasterHomePayload() {
  return {
    embeds: [embeds.buildMasterHomeEmbed()],
    components: components.buildMasterHomeComponents()
  };
}

async function buildBrowseProfessionPayload() {
  const professions = await repo.findActiveProfessions();
  return {
    embeds: [embeds.buildBrowseProfessionEmbed()],
    components: components.buildProfessionSelectComponents(professions)
  };
}

async function buildBrowseLevelPayload(professionId) {
  const profession = await repo.findProfessionById(professionId);
  if (!profession) throw new Error('ไม่พบสายอาชีพ');
  const levels = await repo.findQuestLevelsByProfession(professionId);
  return {
    embeds: [embeds.buildBrowseLevelEmbed(profession)],
    components: components.buildLevelSelectComponents(professionId, levels),
    context: { profession }
  };
}

async function buildBrowseQuestPayload(professionId, level) {
  const profession = await repo.findProfessionById(professionId);
  if (!profession) throw new Error('ไม่พบสายอาชีพ');
  const quests = await repo.findQuestsByProfessionAndLevel(professionId, Number(level));
  return {
    embeds: [embeds.buildBrowseQuestEmbed(profession, Number(level), quests)],
    components: components.buildQuestSelectComponents(professionId, Number(level), quests),
    context: { profession, level: Number(level), quests }
  };
}

async function buildQuestDetailPayload(questId, ctx = {}) {
  const quest = await repo.findQuestDetailById(questId);
  if (!quest) throw new Error('ไม่พบข้อมูลเควส');

  const [requirements, rewards, dependencies, images, steps] = await Promise.all([
    repo.findQuestRequirements(questId),
    repo.findQuestRewards(questId),
    repo.findQuestDependencies(questId),
    repo.findQuestGuideMedia(questId),
    repo.findQuestSteps(questId)
  ]);

  return {
    embeds: [embeds.buildQuestDetailEmbed(quest, { requirements, rewards, dependencies, images, steps })],
    components: components.buildQuestDetailComponents(questId, {
      professionId: ctx.professionId || quest.profession_id,
      level: ctx.level || quest.quest_level
    })
  };
}

async function buildSearchResultPayload(query) {
  const rows = await repo.searchQuests(query);
  return {
    embeds: [embeds.buildSearchResultEmbed(query, rows)],
    components: components.buildSearchResultComponents(rows),
    meta: { rows }
  };
}

function buildNotReadyPayload(title = 'เมนูนี้ยังไม่เปิดใช้งาน', description = 'ตอนนี้ยังเป็นโครงหน้าแอดมินก่อน เดี๋ยวค่อยต่อ logic แก้ไขจริงในรอบถัดไป') {
  return {
    embeds: [embeds.buildPlaceholderEditEmbed({ quest_name: title })],
    components: []
  };
}

module.exports = {
  buildAdminHomePayload,
  buildPanelManagementPayload,
  buildPanelStatusPayload,
  buildMasterHomePayload,
  buildBrowseProfessionPayload,
  buildBrowseLevelPayload,
  buildBrowseQuestPayload,
  buildQuestDetailPayload,
  buildSearchResultPayload,
  buildNotReadyPayload
};
