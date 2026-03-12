const { EmbedBuilder } = require('discord.js');
const { buildAdminPanelEmbed } = require('../builders/embeds/adminPanel.embed');
const { buildAdminPanelButtons } = require('../builders/components/adminPanel.components');
const { buildAdminMasterHomeEmbed, buildSimpleInfoEmbed } = require('../builders/embeds/adminMaster.embed');
const {
  buildMasterHomeButtons,
  buildProfessionSelectRow,
  buildLevelSelectRow,
  buildQuestSelectRow,
  buildQuestDetailButtons,
  buildImageManagerButtons
} = require('../builders/components/adminMaster.components');
const { buildQuestDetailEmbed, buildImageManagerEmbed } = require('../builders/embeds/questDetail.embed');
const {
  getQuestDetailBundle,
  listActiveProfessions,
  listQuestLevelsByProfession,
  listQuestsByProfessionAndLevel
} = require('../db/queries/questMaster.repo');

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  });
}

function buildPanelStatusEmbed(rows) {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('📋 สถานะพาเนลผู้เล่น')
    .setDescription(rows.map((row) => {
      const map = {
        OK: 'ใช้งานได้',
        NO_CHANNEL: 'ยังไม่ตั้งค่าห้อง',
        CHANNEL_NOT_FOUND: 'ไม่พบห้อง',
        MESSAGE_NOT_FOUND: 'ไม่พบข้อความพาเนล',
        CREATED: 'สร้างใหม่แล้ว',
        REFRESHED: 'รีเฟรชแล้ว'
      };
      return `• **${row.professionCode}** : ${map[row.status] || row.status}\n  - ห้อง: ${row.channelId || '-'}\n  - ข้อความ: ${row.messageId || '-'}`;
    }).join('\n'))
    .setTimestamp();
}

function buildPanelActionResultEmbed(title, results) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(title)
    .setDescription(results.map((row) => `• **${row.professionCode}** : ${row.status}`).join('\n') || '-')
    .setTimestamp();
}

async function buildBrowseProfessionView() {
  const professions = await listActiveProfessions();
  return {
    embeds: [buildSimpleInfoEmbed('📚 เรียกดูเควส', 'เลือกสายอาชีพที่ต้องการดูเควส')],
    components: buildProfessionSelectRow(
      professions.slice(0, 25).map((profession) => ({
        label: `${profession.icon_emoji || '📘'} ${profession.profession_code}`.slice(0, 100),
        value: profession.profession_code,
        description: (profession.profession_name_th || profession.profession_name_en || profession.profession_code).slice(0, 100)
      }))
    )
  };
}

async function buildBrowseLevelView(professionCode) {
  const levels = await listQuestLevelsByProfession(professionCode);
  return {
    embeds: [buildSimpleInfoEmbed('📚 เรียกดูเควส', `สายอาชีพ **${professionCode}**\nเลือกเลเวลที่ต้องการ`)],
    components: buildLevelSelectRow(professionCode, levels)
  };
}

async function buildBrowseQuestView(professionCode, level) {
  const quests = await listQuestsByProfessionAndLevel(professionCode, Number(level));
  return {
    embeds: [buildSimpleInfoEmbed('📚 เรียกดูเควส', `สายอาชีพ **${professionCode}** · Lv${level}\nเลือกเควสที่ต้องการดูรายละเอียด`)],
    components: buildQuestSelectRow('quest:admin:select_quest', quests)
  };
}

async function buildQuestDetailView(questId) {
  const bundle = await getQuestDetailBundle(questId);
  if (!bundle) {
    return {
      embeds: [buildSimpleInfoEmbed('ไม่พบเควส', 'ไม่พบข้อมูลเควสที่เลือก', 0xed4245)],
      components: buildMasterHomeButtons()
    };
  }

  return {
    embeds: [buildQuestDetailEmbed(bundle)],
    components: buildQuestDetailButtons(questId)
  };
}

async function buildImageManagerView(questId) {
  const bundle = await getQuestDetailBundle(questId);
  return {
    embeds: [buildImageManagerEmbed(bundle)],
    components: buildImageManagerButtons(questId, bundle.images.length > 0)
  };
}

async function buildMasterHomeView() {
  return {
    embeds: [buildAdminMasterHomeEmbed()],
    components: buildMasterHomeButtons()
  };
}

module.exports = {
  refreshAdminPanel,
  buildPanelStatusEmbed,
  buildPanelActionResultEmbed,
  buildBrowseProfessionView,
  buildBrowseLevelView,
  buildBrowseQuestView,
  buildQuestDetailView,
  buildImageManagerView,
  buildMasterHomeView
};
