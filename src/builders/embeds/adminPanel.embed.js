const { EmbedBuilder } = require('discord.js');

function yesNo(value) {
  return value ? 'Yes' : 'No';
}

function buildAdminPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ QUEST ADMIN PANEL')
    .setDescription([
      'เลือกหมวดที่ต้องการจัดการ',
      '',
      '• Panel Management',
      '• Master Data / Configuration'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System' })
    .setTimestamp();
}

function buildPanelManagementEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧩 PANEL MANAGEMENT')
    .setDescription([
      'ใช้สำหรับจัดการ panel ฝั่งผู้เล่น',
      '',
      '• Deploy Player Panels',
      '• Refresh Player Panels',
      '• Repair Missing Panels',
      '• Refresh Current Quest View',
      '• Panel Status'
    ].join('\n'))
    .setFooter({ text: 'Admin > Panel Management' })
    .setTimestamp();
}

function buildMasterHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('📚 MASTER DATA / CONFIGURATION')
    .setDescription([
      'เลือกเควสก่อนเสมอ แล้วค่อยเข้าไปดูหรือแก้ไข',
      '',
      'Flow: Browse/Search/Create -> Quest Detail'
    ].join('\n'))
    .setFooter({ text: 'Admin > Master Data' })
    .setTimestamp();
}

function buildBrowseProfessionEmbed(professions) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('📚 เลือกสายอาชีพ')
    .setDescription(
      professions.length
        ? professions.map((p) => `• ${p.icon_emoji || '📌'} ${p.profession_name_th} (${p.profession_code})`).join('\n')
        : 'ไม่พบสายอาชีพ'
    )
    .setFooter({ text: 'Master > Browse > Profession' })
    .setTimestamp();
}

function buildBrowseLevelEmbed(profession, levels) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📘 ${profession.icon_emoji || '📌'} ${profession.profession_name_th}`)
    .setDescription(
      levels.length
        ? `เลือกระดับเควสที่ต้องการ\n\n${levels.map((lv) => `• Lv.${lv}`).join('\n')}`
        : 'ไม่พบ level ในสายนี้'
    )
    .setFooter({ text: 'Master > Browse > Level' })
    .setTimestamp();
}

function buildBrowseQuestListEmbed(profession, level, quests) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`🗂️ ${profession.profession_name_th} · Lv.${level}`)
    .setDescription(
      quests.length
        ? quests.map((q) => `• \`${q.quest_code}\` ${q.quest_name}`).join('\n')
        : 'ไม่พบ quest ใน level นี้'
    )
    .setFooter({ text: 'Master > Browse > Quest List' })
    .setTimestamp();
}

function buildQuestDetailEmbed({ quest, requirements, rewards, dependencies, images, steps }) {
  return new EmbedBuilder()
    .setColor(quest.is_active ? 0xfee75c : 0xed4245)
    .setTitle(`${quest.icon_emoji || '📘'} ${quest.profession_name_th || '-'} · Lv.${quest.quest_level || '-'} · ${quest.quest_code}`)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**สถานะ:** ${quest.is_active ? 'Active' : 'Inactive'}`,
      `**ประเภท:** ${quest.is_repeatable ? 'Repeatable' : 'Main'}`,
      `**Step Quest:** ${yesNo(quest.is_step_quest)}`,
      `**Requires Ticket:** ${yesNo(quest.requires_ticket)}`,
      '',
      quest.quest_description || quest.panel_description || '-'
    ].join('\n'))
    .addFields(
      { name: 'Requirement Count', value: String(requirements.length), inline: true },
      { name: 'Reward Count', value: String(rewards.length), inline: true },
      { name: 'Image Count', value: String(images.length), inline: true },
      { name: 'Step Count', value: String(steps.length), inline: true },
      {
        name: 'Dependency Summary',
        value: dependencies.length
          ? dependencies
              .map((d) => {
                if (d.dependency_type === 'PREVIOUS_QUEST') {
                  return `• PREVIOUS_QUEST -> ${d.required_quest_code || '-'} ${d.required_quest_name || ''}`.trim();
                }
                if (d.dependency_type === 'MAIN_LEVEL') {
                  return `• MAIN_LEVEL -> Lv.${d.required_level || '-'}`;
                }
                if (d.dependency_type === 'ROLE') {
                  return `• ROLE -> ${d.required_role_name || d.required_role_id || '-'}`;
                }
                return `• ${d.dependency_type}`;
              })
              .join('\n')
          : 'None'
      }
    )
    .setFooter({ text: `Quest ID: ${quest.quest_id}` })
    .setTimestamp();
}

function buildQuestRequirementsEmbed(quest, requirements) {
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`📦 Requirements · ${quest.quest_code}`)
    .setDescription(
      requirements.length
        ? requirements
            .map((r, index) => {
              const qty = r.required_quantity ? ` x${r.required_quantity}` : '';
              const label = r.item_name || r.input_label || r.requirement_type;
              const text = r.display_text || r.admin_display_text || '-';
              return `${index + 1}. **${label}${qty}**\n${text}`;
            })
            .join('\n\n')
        : 'ไม่มี requirement'
    )
    .setFooter({ text: `Current Quest: ${quest.quest_code}` })
    .setTimestamp();
}

function buildQuestRewardsEmbed(quest, rewards) {
  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`🎁 Rewards · ${quest.quest_code}`)
    .setDescription(
      rewards.length
        ? rewards
            .map((r, index) => {
              const amount = r.reward_quantity || r.reward_value_number || '-';
              const label = r.reward_item_name || r.discord_role_name || r.reward_value_text || r.reward_type;
              const text = r.reward_display_text || '-';
              return `${index + 1}. **${label}** (${r.reward_type})\nจำนวน: ${amount}\n${text}`;
            })
            .join('\n\n')
        : 'ไม่มี reward'
    )
    .setFooter({ text: `Current Quest: ${quest.quest_code}` })
    .setTimestamp();
}

function buildQuestDependenciesEmbed(quest, dependencies) {
  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`🧷 Dependency · ${quest.quest_code}`)
    .setDescription(
      dependencies.length
        ? dependencies
            .map((d, index) => {
              if (d.dependency_type === 'PREVIOUS_QUEST') {
                return `${index + 1}. PREVIOUS_QUEST -> ${d.required_quest_code || '-'} ${d.required_quest_name || ''}`.trim();
              }
              if (d.dependency_type === 'MAIN_LEVEL') {
                return `${index + 1}. MAIN_LEVEL -> Lv.${d.required_level || '-'}`;
              }
              if (d.dependency_type === 'ROLE') {
                return `${index + 1}. ROLE -> ${d.required_role_name || d.required_role_id || '-'}`;
              }
              return `${index + 1}. ${d.dependency_type}`;
            })
            .join('\n')
        : 'None'
    )
    .setFooter({ text: `Current Quest: ${quest.quest_code}` })
    .setTimestamp();
}

function buildQuestImagesEmbed(quest, images) {
  const embed = new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle(`🖼️ Example Images · ${quest.quest_code}`)
    .setDescription(
      images.length
        ? images
            .map((m, index) => {
              return `${index + 1}. **${m.media_title || 'Untitled'}**\n${m.media_description || '-'}\n${m.media_url}`;
            })
            .join('\n\n')
        : 'ยังไม่มีรูปตัวอย่างเควส'
    )
    .setFooter({ text: `Current Quest: ${quest.quest_code}` })
    .setTimestamp();

  if (images[0]?.media_url) {
    embed.setImage(images[0].media_url);
  }

  return embed;
}

function buildPanelStatusEmbed(statusRows) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📊 PANEL STATUS')
    .setDescription(
      statusRows.length
        ? statusRows
            .map((row) => {
              return [
                `${row.icon || '📌'} **${row.professionName}** (${row.professionCode})`,
                `channel: ${row.channelId || '-'}`,
                `message: ${row.messageId || '-'}`,
                `status: ${row.status}`
              ].join('\n');
            })
            .join('\n\n')
        : 'ไม่พบ panel status'
    )
    .setFooter({ text: 'Admin > Panel Management > Status' })
    .setTimestamp();
}

module.exports = {
  buildAdminPanelEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseProfessionEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestListEmbed,
  buildQuestDetailEmbed,
  buildQuestRequirementsEmbed,
  buildQuestRewardsEmbed,
  buildQuestDependenciesEmbed,
  buildQuestImagesEmbed,
  buildPanelStatusEmbed
};
