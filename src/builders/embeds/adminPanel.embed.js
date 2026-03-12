const { EmbedBuilder } = require('discord.js');

function clampText(text, limit = 1024, fallback = '-') {
  const value = String(text || '').trim();
  if (!value) return fallback;
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}

function formatQuestType(quest) {
  if (quest.is_repeatable) return 'REPEATABLE';
  if (quest.is_step_quest) return 'STEP QUEST';
  return 'MAIN';
}

function buildAdminHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🛠️ แผงควบคุมระบบเควสแอดมิน')
    .setDescription([
      'ใช้สำหรับจัดการพาเนลผู้เล่นและมาสเตอร์เควสในระบบ Discord',
      '',
      '**คำอธิบายปุ่ม**',
      '• **จัดการพาเนลผู้เล่น** : ไปยังเมนูสร้าง รีเฟรช และตรวจสอบพาเนลผู้เล่น',
      '• **จัดการมาสเตอร์เควส** : ไปยังเมนูค้นหาและแก้ไขข้อมูลเควส',
      '• **รีเฟรชแผงนี้** : โหลดข้อความและปุ่มของแผงแอดมินใหม่'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Admin Home' })
    .setTimestamp();
}

function buildPanelManagementEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧰 จัดการพาเนลระบบเควส')
    .setDescription([
      'ใช้สำหรับสร้าง รีเฟรช ซ่อม และตรวจสอบพาเนลของผู้เล่นในแต่ละสายอาชีพ',
      '',
      '**คำอธิบายปุ่ม**',
      '• **สร้างพาเนลผู้เล่น** : สร้างข้อความพาเนลใหม่ครบทุกสาย',
      '• **รีเฟรชพาเนลผู้เล่น** : อัปเดตข้อความและปุ่มของพาเนลเดิม',
      '• **ซ่อมพาเนลที่หาย** : ตรวจสอบและสร้างใหม่เฉพาะพาเนลที่หาไม่เจอ',
      '• **รีเฟรชเควสปัจจุบัน** : ให้ระบบโหลดข้อมูลเควสปัจจุบันใหม่',
      '• **ตรวจสอบสถานะพาเนล** : สรุปการตั้งค่า channel/message ของแต่ละสาย'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Panel Management' })
    .setTimestamp();
}

function buildMasterHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('📚 จัดการมาสเตอร์เควส')
    .setDescription([
      'ให้เลือกเควสก่อนเสมอ แล้วระบบจะเปิดหน้ารายละเอียดเควสนั้น พร้อมแสดงข้อมูลทั้งหมดในหน้าเดียว',
      '',
      '**คำอธิบายปุ่ม**',
      '• **เรียกดูเควส** : เลือกสายอาชีพ → เลือกเลเวล → เลือกเควส',
      '• **ค้นหาเควส** : ค้นจากชื่อเควสหรือโค้ดเควส',
      '• **สร้างเควส** : ปุ่มสำรองสำหรับสร้างเควสใหม่ในรอบถัดไป'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Master Data' })
    .setTimestamp();
}

function buildBrowseQuestEmbed() {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('📚 เลือกสายอาชีพ')
    .setDescription('เลือกสายอาชีพที่ต้องการ จากนั้นระบบจะให้เลือกเลเวลและเควส')
    .setFooter({ text: 'SCUM Quest System · Browse Quest' })
    .setTimestamp();
}

function buildBrowseLevelEmbed(professionLabel) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📚 เลือกเลเวลของ ${professionLabel}`)
    .setDescription('เลือกเลเวลที่ต้องการเพื่อดูรายการเควสในสายนั้น')
    .setFooter({ text: 'SCUM Quest System · Browse Quest Level' })
    .setTimestamp();
}

function buildBrowseQuestListEmbed(professionLabel, level, quests = []) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📚 รายการเควส · ${professionLabel} · Lv${level}`)
    .setDescription(
      quests.length
        ? `พบเควสทั้งหมด ${quests.length} เควส เลือกเควสที่ต้องการเพื่อเปิดหน้ารายละเอียด`
        : 'ไม่พบเควสในเงื่อนไขที่เลือก'
    )
    .setFooter({ text: 'SCUM Quest System · Quest List' })
    .setTimestamp();
}

function formatRequirementLine(item, index) {
  const title = item.item_name || item.input_label || item.requirement_type || 'ไม่ระบุรายการ';
  const qty = item.required_quantity ? ` x${item.required_quantity}` : '';
  return `${index + 1}. ${title}${qty}`;
}

function formatRewardLine(item, index) {
  const title = item.reward_display_text
    || (item.reward_item_name && item.reward_quantity ? `${item.reward_item_name} x${item.reward_quantity}` : null)
    || (item.reward_type === 'SCUM_MONEY' && item.reward_value_number != null ? `เงิน ${item.reward_value_number}` : null)
    || (item.reward_type === 'FAME_POINT' && item.reward_value_number != null ? `Fame ${item.reward_value_number}` : null)
    || (item.reward_type === 'DISCORD_ROLE' && item.discord_role_name ? `ยศ ${item.discord_role_name}` : null)
    || item.reward_type
    || 'ไม่ระบุรางวัล';
  return `${index + 1}. ${title}`;
}

function buildQuestDetailEmbed(bundle) {
  const { quest, dependencies = [], requirements = [], rewards = [], images = [], steps = [] } = bundle;
  const professionLabel = quest.profession_name_th || quest.profession_code || 'ไม่ระบุสาย';
  const dependencyText = dependencies.length
    ? dependencies
        .map((dep, index) => {
          const depLabel = dep.required_quest_code
            ? `${dep.required_quest_code}${dep.required_quest_name ? ` · ${dep.required_quest_name}` : ''}`
            : dep.required_level
              ? `Main Level ${dep.required_level}`
              : dep.required_role_name || dep.required_role_id || dep.dependency_type;
          return `${index + 1}. ${depLabel}`;
        })
        .join('\n')
    : 'ไม่มี';

  const requirementText = requirements.length
    ? requirements.map(formatRequirementLine).join('\n')
    : 'ไม่มีรายการ';

  const rewardText = rewards.length
    ? rewards.map(formatRewardLine).join('\n')
    : 'ไม่มีรายการ';

  const stepText = steps.length
    ? steps.map((step) => `${step.step_no}. ${step.step_title}`).join('\n')
    : 'ไม่มีรายการขั้นตอน';

  return new EmbedBuilder()
    .setColor(quest.is_active ? 0x57f287 : 0xed4245)
    .setTitle(`${quest.profession_code || 'QUEST'} · Lv${quest.quest_level || '-'} · ${quest.quest_code}`)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**สถานะ:** ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
      `**ประเภท:** ${formatQuestType(quest)}`,
      `**ใช้ Ticket:** ${quest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`,
      `**ต้องอนุมัติแอดมิน:** ${quest.requires_admin_approval ? 'ใช่' : 'ไม่ใช่'}`,
      `**จำนวนรูปตัวอย่าง:** ${images.length} รูป`
    ].join('\n'))
    .addFields(
      {
        name: '📝 คำอธิบายเควส',
        value: clampText(quest.quest_description || quest.panel_description || '-'),
        inline: false
      },
      {
        name: '🔗 เควสที่ต้องผ่านก่อน',
        value: clampText(dependencyText),
        inline: false
      },
      {
        name: '📦 ของที่ต้องส่ง / เงื่อนไข',
        value: clampText(requirementText),
        inline: false
      },
      {
        name: '🎁 รางวัล',
        value: clampText(rewardText),
        inline: false
      },
      {
        name: '🪜 ขั้นตอน',
        value: clampText(stepText),
        inline: false
      },
      {
        name: '🛠️ เมนูการจัดการ',
        value: clampText([
          '• **แก้คำอธิบาย** : แก้ชื่อและรายละเอียดหลักของเควส',
          '• **แก้ของที่ต้องส่ง** : เลือกรายการ requirement เดิมเพื่อแก้ไข',
          '• **แก้รางวัล** : เลือกรายการ reward เดิมเพื่อแก้ไข',
          '• **แก้เควสก่อนหน้า** : ตั้งหรือเปลี่ยน dependency ของเควสนี้',
          '• **จัดการรูปตัวอย่าง** : เลื่อนดู ลบ และเพิ่มรูปตัวอย่างของเควสนี้',
          '• **เปลี่ยนสถานะเควส** : เปิดหรือปิดการใช้งานเควส',
          '• **เพิ่มของที่ต้องส่ง / เพิ่มรางวัล / เพิ่มรูปตัวอย่าง** : เพิ่มข้อมูลใหม่ให้เควสนี้'
        ].join('\n')),
        inline: false
      }
    )
    .setFooter({ text: `SCUM Quest System · ${professionLabel}` })
    .setTimestamp(quest.updated_at || new Date());
}

function buildQuestDetailImageEmbeds(bundle) {
  const { images = [] } = bundle;
  return images
    .filter((item) => item?.media_url)
    .slice(0, 9)
    .map((item, index) => new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🖼️ รูปตัวอย่าง ${index + 1}`)
      .setDescription(clampText(item.media_title || item.media_description || 'รูปตัวอย่างเควส', 4096, 'รูปตัวอย่างเควส'))
      .setImage(item.media_url)
    );
}

function buildQuestImageManagerEmbed(bundle, currentIndex = 0) {
  const { quest, images = [] } = bundle;
  const professionLabel = quest.profession_name_th || quest.profession_code || 'ไม่ระบุสาย';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🖼️ จัดการรูปตัวอย่าง · ${quest.quest_code}`)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**สาย:** ${professionLabel}`,
      `**เลเวล:** Lv${quest.quest_level || '-'}`,
      `**จำนวนรูปทั้งหมด:** ${images.length} รูป`
    ].join('\n'))
    .setFooter({ text: `SCUM Quest System · Image Manager · ${currentIndex + 1}/${Math.max(images.length, 1)}` })
    .setTimestamp();

  if (!images.length) {
    embed.addFields(
      {
        name: 'สถานะ',
        value: 'ยังไม่มีรูปตัวอย่างสำหรับเควสนี้',
        inline: false
      },
      {
        name: '🛠️ เมนูการจัดการ',
        value: [
          '• **เพิ่มรูปตัวอย่าง** : เพิ่มรูปใหม่ให้เควสนี้',
          '• **กลับหน้าเควส** : กลับไปหน้ารายละเอียดเควส'
        ].join('\n'),
        inline: false
      }
    );

    return embed;
  }

  const safeIndex = Math.min(Math.max(Number(currentIndex) || 0, 0), images.length - 1);
  const currentImage = images[safeIndex];

  embed
    .addFields(
      {
        name: 'รายละเอียดรูปปัจจุบัน',
        value: clampText([
          `**ลำดับ:** ${safeIndex + 1}/${images.length}`,
          `**ชื่อรูป:** ${currentImage.media_title || '-'}`,
          `**คำอธิบาย:** ${currentImage.media_description || '-'}`,
          `**URL:** ${currentImage.media_url || '-'}`
        ].join('\n')),
        inline: false
      },
      {
        name: '🛠️ เมนูการจัดการ',
        value: clampText([
          '• **รูปก่อนหน้า / รูปถัดไป** : เลื่อนดูรูปอื่นของเควสนี้',
          '• **ลบรูปนี้** : ปิดการใช้งานรูปปัจจุบัน',
          '• **เพิ่มรูปตัวอย่าง** : เพิ่มรูปใหม่ให้เควสนี้',
          '• **กลับหน้าเควส** : กลับไปหน้ารายละเอียดเควส'
        ].join('\n')),
        inline: false
      }
    )
    .setImage(currentImage.media_url);

  return embed;
}

function buildRequirementPickerEmbed(bundle) {
  const { quest, requirements = [] } = bundle;
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📦 เลือกรายการของที่ต้องส่ง · ${quest.quest_code}`)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**จำนวนรายการ:** ${requirements.length} รายการ`,
      '',
      'เลือกรายการที่ต้องการแก้ไข จากนั้นระบบจะเปิดฟอร์มให้แก้ชื่อรายการและจำนวน'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Edit Requirements' })
    .setTimestamp();
}

function buildRewardPickerEmbed(bundle) {
  const { quest, rewards = [] } = bundle;
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🎁 เลือกรางวัล · ${quest.quest_code}`)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**จำนวนรายการ:** ${rewards.length} รายการ`,
      '',
      'เลือกรางวัลที่ต้องการแก้ไข จากนั้นระบบจะเปิดฟอร์มให้แก้ข้อมูลของรางวัลนั้น'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Edit Rewards' })
    .setTimestamp();
}

function buildPanelStatusEmbed(statusLines = []) {
  return new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('📋 สถานะพาเนลผู้เล่น')
    .setDescription(statusLines.length ? statusLines.join('\n') : 'ไม่พบข้อมูลพาเนล')
    .setFooter({ text: 'SCUM Quest System · Panel Status' })
    .setTimestamp();
}

module.exports = {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseQuestEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestListEmbed,
  buildQuestDetailEmbed,
  buildQuestDetailImageEmbeds,
  buildQuestImageManagerEmbed,
  buildRequirementPickerEmbed,
  buildRewardPickerEmbed,
  buildPanelStatusEmbed
};
