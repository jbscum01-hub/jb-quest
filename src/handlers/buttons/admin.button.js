const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { refreshAdminPanel } = require('../../services/adminPanel.service');
const {
  buildPanelStatusEmbed,
  buildPanelActionResultEmbed,
  buildBrowseProfessionView,
  buildQuestDetailView,
  buildImageManagerView,
  buildMasterHomeView
} = require('../../services/adminPanel.service');
const {
  deployProfessionPanels,
  repairMissingProfessionPanels,
  getProfessionPanelStatuses
} = require('../../services/panelAutoDeploy.service');
const { autoDeployAdminPanel } = require('../../services/adminPanelAutoDeploy.service');
const { insertAuditLog } = require('../../db/queries/audit.repo');
const { isQuestAdmin } = require('../../utils/permission');
const { findQuestById, findQuestGuideMedia, toggleQuestActive } = require('../../db/queries/questMaster.repo');

function buildSingleInputModal(customId, title, label, value = '', style = TextInputStyle.Short, required = true) {
  const input = new TextInputBuilder()
    .setCustomId('value')
    .setLabel(label)
    .setStyle(style)
    .setRequired(required);

  if (value) input.setValue(String(value).slice(0, style === TextInputStyle.Paragraph ? 4000 : 100));

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(new ActionRowBuilder().addComponents(input));
}

function buildDescriptionEditModal(quest) {
  return new ModalBuilder()
    .setCustomId(`quest:admin:modal_edit_description:${quest.quest_id}`)
    .setTitle('แก้คำอธิบายเควส')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quest_name')
          .setLabel('ชื่อเควส')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue((quest.quest_name || '').slice(0, 100))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('quest_description')
          .setLabel('คำอธิบายเควส')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setValue((quest.quest_description || '').slice(0, 4000))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('panel_title')
          .setLabel('หัวข้อบนพาเนล')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue((quest.panel_title || '').slice(0, 100))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('button_label')
          .setLabel('ชื่อปุ่มส่งเควส')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue((quest.button_label || '').slice(0, 100))
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('admin_note')
          .setLabel('หมายเหตุแอดมิน')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setValue((quest.admin_note || '').slice(0, 4000))
      )
    );
}

async function ensureAdmin(interaction) {
  const ok = await isQuestAdmin(interaction.member);
  if (!ok) {
    await interaction.reply({ content: 'คุณไม่มีสิทธิ์ใช้งานเมนูแอดมิน', flags: 64 });
    return false;
  }
  return true;
}

async function handleAdminButtons(interaction) {
  if (!await ensureAdmin(interaction)) return;

  const parts = interaction.customId.split(':');
  const action = parts[2];
  const extra = parts[3] || null;

  if (action === 'refresh_panels') {
    await refreshAdminPanel(interaction.message);
    const results = await deployProfessionPanels(interaction.client);
    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_PANEL_REFRESHED', target: 'player_panels', meta: results });
    await interaction.reply({ embeds: [buildPanelActionResultEmbed('✅ รีเฟรชพาเนลผู้เล่นเรียบร้อยแล้ว', results)], flags: 64 });
    return;
  }

  if (action === 'create_panels') {
    await autoDeployAdminPanel(interaction.client);
    const results = await deployProfessionPanels(interaction.client);
    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_PANEL_CREATED', target: 'player_panels', meta: results });
    await interaction.reply({ embeds: [buildPanelActionResultEmbed('✅ สร้าง / อัปเดตพาเนลผู้เล่นเรียบร้อยแล้ว', results)], flags: 64 });
    return;
  }

  if (action === 'repair_panels') {
    const results = await repairMissingProfessionPanels(interaction.client);
    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_PANEL_REPAIRED', target: 'player_panels', meta: results });
    await interaction.reply({ embeds: [buildPanelActionResultEmbed('🛠️ ซ่อมพาเนลที่หายเรียบร้อยแล้ว', results)], flags: 64 });
    return;
  }

  if (action === 'refresh_current_quest') {
    const results = await deployProfessionPanels(interaction.client);
    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_CURRENT_REFRESHED', target: 'player_panels', meta: results });
    await interaction.reply({ content: '🔄 รีเฟรชข้อมูลเควสปัจจุบันเรียบร้อยแล้ว', flags: 64 });
    return;
  }

  if (action === 'panel_status') {
    const rows = await getProfessionPanelStatuses(interaction.client);
    await interaction.reply({ embeds: [buildPanelStatusEmbed(rows)], flags: 64 });
    return;
  }

  if (action === 'master_home') {
    await interaction.reply({ ...(await buildMasterHomeView()), flags: 64 });
    return;
  }

  if (action === 'browse_quest') {
    await interaction.reply({ ...(await buildBrowseProfessionView()), flags: 64 });
    return;
  }

  if (action === 'search_quest') {
    const modal = buildSingleInputModal('quest:admin:modal_search_quest', 'ค้นหาเควส', 'พิมพ์ชื่อเควสหรือโค้ดเควส');
    await interaction.showModal(modal);
    return;
  }

  if (action === 'create_quest') {
    const modal = new ModalBuilder()
      .setCustomId('quest:admin:modal_create_quest')
      .setTitle('สร้างเควสใหม่')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('profession_code').setLabel('สายอาชีพ (เช่น MEDIC)').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('quest_level').setLabel('เลเวลเควส (ตัวเลข)').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('quest_code').setLabel('Quest Code').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('quest_name').setLabel('ชื่อเควส').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('quest_description').setLabel('คำอธิบายเควส').setStyle(TextInputStyle.Paragraph).setRequired(false)
        )
      );
    await interaction.showModal(modal);
    return;
  }

  if (action === 'open_detail' && extra) {
    await interaction.update(await buildQuestDetailView(extra));
    return;
  }

  if (action === 'edit_description' && extra) {
    const quest = await findQuestById(extra);
    await interaction.showModal(buildDescriptionEditModal(quest));
    return;
  }

  if (action === 'add_requirement' && extra) {
    const modal = new ModalBuilder()
      .setCustomId(`quest:admin:modal_add_requirement:${extra}`)
      .setTitle('เพิ่มของที่ต้องส่ง')
      .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('requirement_type').setLabel('ประเภท requirement เช่น SCUM_ITEM').setStyle(TextInputStyle.Short).setRequired(true).setValue('SCUM_ITEM')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('item_name').setLabel('ชื่อของ / ชื่อ requirement').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('required_quantity').setLabel('จำนวน').setStyle(TextInputStyle.Short).setRequired(false).setValue('1')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('display_text').setLabel('ข้อความแสดงผล').setStyle(TextInputStyle.Paragraph).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sort_order').setLabel('ลำดับแสดงผล').setStyle(TextInputStyle.Short).setRequired(false).setValue('1'))
      );
    await interaction.showModal(modal);
    return;
  }

  if (action === 'add_reward' && extra) {
    const modal = new ModalBuilder()
      .setCustomId(`quest:admin:modal_add_reward:${extra}`)
      .setTitle('เพิ่มรางวัล')
      .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_type').setLabel('ประเภท reward เช่น SCUM_MONEY / FAME_POINT / SCUM_ITEM').setStyle(TextInputStyle.Short).setRequired(true).setValue('SCUM_MONEY')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_item_name').setLabel('ชื่อรางวัล').setStyle(TextInputStyle.Short).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_value_number').setLabel('ตัวเลขรางวัล เช่น เงิน / FP').setStyle(TextInputStyle.Short).setRequired(false).setValue('0')),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reward_display_text').setLabel('ข้อความแสดงผล').setStyle(TextInputStyle.Paragraph).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sort_order').setLabel('ลำดับแสดงผล').setStyle(TextInputStyle.Short).setRequired(false).setValue('1'))
      );
    await interaction.showModal(modal);
    return;
  }

  if (action === 'add_image' && extra) {
    const modal = new ModalBuilder()
      .setCustomId(`quest:admin:modal_add_image:${extra}`)
      .setTitle('เพิ่มรูปตัวอย่าง')
      .addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('media_url').setLabel('URL รูป').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('media_title').setLabel('ชื่อรูป').setStyle(TextInputStyle.Short).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('media_description').setLabel('คำอธิบายรูป').setStyle(TextInputStyle.Paragraph).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('display_order').setLabel('ลำดับแสดงผล').setStyle(TextInputStyle.Short).setRequired(false).setValue('1'))
      );
    await interaction.showModal(modal);
    return;
  }

  if (action === 'edit_requirements' && extra) {
    await interaction.reply({ content: 'เลือก requirement ที่ต้องการแก้จากเมนูเลือกด้านล่างของหน้าถัดไป', flags: 64 });
    const view = await buildQuestDetailView(extra);
    const bundle = await require('../../db/queries/questMaster.repo').getQuestDetailBundle(extra);
    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    if (bundle.requirements.length) {
      view.components.unshift(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`quest:admin:pick_requirement:${extra}`)
          .setPlaceholder('เลือกของที่ต้องส่งที่ต้องการแก้')
          .addOptions(bundle.requirements.slice(0, 25).map((item) => ({
            label: (item.item_name || item.display_text || item.requirement_type).slice(0, 100),
            value: item.requirement_id,
            description: `${item.required_quantity || 0}`.slice(0, 100)
          })))
      ));
      await interaction.followUp({ ...view, flags: 64 });
      return;
    }
    await interaction.followUp({ content: 'เควสนี้ยังไม่มี requirement ให้แก้', flags: 64 });
    return;
  }

  if (action === 'edit_rewards' && extra) {
    await interaction.reply({ content: 'เลือก reward ที่ต้องการแก้จากเมนูเลือกด้านล่างของหน้าถัดไป', flags: 64 });
    const view = await buildQuestDetailView(extra);
    const bundle = await require('../../db/queries/questMaster.repo').getQuestDetailBundle(extra);
    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    if (bundle.rewards.length) {
      view.components.unshift(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`quest:admin:pick_reward:${extra}`)
          .setPlaceholder('เลือกรางวัลที่ต้องการแก้')
          .addOptions(bundle.rewards.slice(0, 25).map((item) => ({
            label: (item.reward_display_text || item.reward_item_name || item.reward_type).slice(0, 100),
            value: item.reward_id,
            description: `${item.reward_quantity || item.reward_value_number || 0}`.slice(0, 100)
          })))
      ));
      await interaction.followUp({ ...view, flags: 64 });
      return;
    }
    await interaction.followUp({ content: 'เควสนี้ยังไม่มี reward ให้แก้', flags: 64 });
    return;
  }

  if (action === 'edit_dependency' && extra) {
    const quest = await findQuestById(extra);
    const candidates = await require('../../db/queries/questMaster.repo').listDependencyCandidateQuests(extra, quest.profession_code, quest.quest_level);
    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    const options = [{ label: 'ไม่มีเควสก่อนหน้า', value: 'NONE', description: 'ลบ dependency ออก' }].concat(
      candidates.map((item) => ({ label: item.quest_code.slice(0, 100), value: item.quest_id, description: item.quest_name.slice(0, 100) }))
    );
    await interaction.reply({
      content: `เลือกเควสก่อนหน้าสำหรับ **${quest.quest_code}**`,
      components: [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`quest:admin:pick_dependency:${extra}`).setPlaceholder('เลือกเควสก่อนหน้า').addOptions(options.slice(0, 25))
      )],
      flags: 64
    });
    return;
  }

  if (action === 'manage_images' && extra) {
    await interaction.reply({ ...(await buildImageManagerView(extra)), flags: 64 });
    return;
  }

  if (action === 'remove_image' && extra) {
    const images = await findQuestGuideMedia(extra);
    if (!images.length) {
      await interaction.reply({ content: 'เควสนี้ยังไม่มีรูปตัวอย่างให้ลบ', flags: 64 });
      return;
    }
    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    await interaction.reply({
      content: 'เลือกรูปที่ต้องการลบ',
      components: [new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`quest:admin:pick_remove_image:${extra}`)
          .setPlaceholder('เลือกรูปที่ต้องการลบ')
          .addOptions(images.slice(0, 25).map((img) => ({
            label: (img.media_title || 'ไม่มีชื่อรูป').slice(0, 100),
            value: img.media_id,
            description: (img.media_description || img.media_url || '-').slice(0, 100)
          })))
      )],
      flags: 64
    });
    return;
  }

  if (action === 'toggle_active' && extra) {
    const result = await toggleQuestActive(extra, interaction.user.id);
    await insertAuditLog({ guildId: interaction.guildId, actorId: interaction.user.id, actorTag: interaction.user.tag, action: 'QUEST_TOGGLE_ACTIVE', target: extra, meta: result });
    await interaction.reply({ content: `✅ เปลี่ยนสถานะเควสแล้ว: ${result.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`, flags: 64 });
    await interaction.followUp({ ...(await buildQuestDetailView(extra)), flags: 64 });
  }
}

module.exports = {
  handleAdminButtons
};
