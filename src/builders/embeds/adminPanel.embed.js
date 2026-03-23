const { EmbedBuilder } = require('discord.js');

function formatQuestType(quest = {}) {
  if (quest.is_step_quest) return 'Step Quest';
  if (quest.is_repeatable) return 'ทำซ้ำได้';
  if (quest.category_code) return quest.category_code;
  return 'ปกติ';
}

function clampText(text, max = 1024) {
  if (!text) return '-';
  const value = String(text);
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function requirementLine(item, index) {
  const title = item.item_name || item.input_label || item.requirement_type || 'ไม่ระบุรายการ';
  const qty = item.required_quantity ? ` x${item.required_quantity}` : '';
  return `${index + 1}. ${title}${qty}`;
}

function rewardLine(item, index) {
  let title = item.reward_display_text;
  if (!title) {
    if (item.reward_type === 'SCUM_ITEM') title = `${item.reward_item_name || 'ไอเทม'}${item.reward_quantity ? ` x${item.reward_quantity}` : ''}`;
    else if (item.reward_type === 'SCUM_MONEY') title = `เงิน ${item.reward_value_number || 0}`;
    else if (item.reward_type === 'FAME_POINT') title = `Fame Point ${item.reward_value_number || 0}`;
    else if (item.reward_type === 'DISCORD_ROLE') title = `ยศ ${item.discord_role_name || item.reward_value_text || '-'}`;
    else title = item.reward_type || 'ไม่ระบุรางวัล';
  }
  return `${index + 1}. ${title}`;
}

function imageTitle(item, index) {
  return item.media_title || item.media_description || `รูปตัวอย่าง ${index + 1}`;
}

function formatThaiDateTime(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function buildTimedWindowAdminBlock(quest) {
  if (quest.category_code !== 'TIMED') return null;
  return [
    `เริ่ม: ${formatThaiDateTime(quest.start_at)}`,
    `ระยะเวลา: ${Number(quest.duration_days || 0) > 0 ? `${quest.duration_days} วัน` : 'ยังไม่ได้ตั้งค่า'}`,
    `สิ้นสุด: ${formatThaiDateTime(quest.end_at)}`
  ].join('\n');
}

function buildAdminHomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle('⚙️ ระบบจัดการเควสแอดมิน')
    .setDescription([
      'ใช้สำหรับจัดการพาเนลผู้เล่น และจัดการข้อมูล Master Quest',
      '',
      '**เมนูหลัก**',
      '• **จัดการพาเนลผู้เล่น** : สร้าง รีเฟรช ซ่อม และตรวจสอบพาเนลของผู้เล่น',
      '• **จัดการมาสเตอร์เควส** : ค้นหา สร้าง และเปิดหน้ารายละเอียดของเควส เพื่อแก้ไขแบบไม่หลงเควส',
      '• **รีเฟรชแผงนี้** : โหลดหน้าปัจจุบันใหม่อีกครั้ง'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Admin Home' })
    .setTimestamp();
}

function buildPanelManagementEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🧩 จัดการพาเนลผู้เล่น')
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
      '• **เรียกดูเควสสายอาชีพ** : เลือกสายอาชีพ → เลือกเลเวล → เลือกเควส',
      '• **เรียกดูเควสพิเศษ / เควสตำนาน** : เปิดรายการเควสที่ไม่ผูกกับสายอาชีพ',
      '• **ค้นหาเควส** : ค้นจากชื่อเควสหรือโค้ดเควส',
      '• **สร้างเควสสายอาชีพ / พิเศษ / ตำนาน** : ใช้ปุ่มแยกตามประเภทเพื่อลดการสร้างผิดหมวด'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Master Data' })
    .setTimestamp();
}

function buildBrowseQuestEmbed(mode = 'browse') {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(mode === 'create' ? '🧱 เลือกสายอาชีพสำหรับสร้างเควส' : '📚 เลือกสายอาชีพ')
    .setDescription(mode === 'create'
      ? 'เลือกสายอาชีพก่อน จากนั้นระบบจะให้เลือกเลเวลที่จะสร้างเควสใหม่'
      : 'เลือกสายอาชีพที่ต้องการ จากนั้นระบบจะให้เลือกเลเวลและเควส')
    .setFooter({ text: 'SCUM Quest System · Browse Quest' })
    .setTimestamp();
}

function buildBrowseLevelEmbed(professionLabel, mode = 'browse') {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(mode === 'create' ? `🧱 เลือกเลเวลสำหรับสร้างเควส · ${professionLabel}` : `📚 เลือกเลเวลของ ${professionLabel}`)
    .setDescription(mode === 'create'
      ? 'เลือกเลเวลที่จะสร้างเควสใหม่ในสายนี้'
      : 'เลือกเลเวลที่ต้องการเพื่อดูรายการเควสในสายนั้น')
    .setFooter({ text: 'SCUM Quest System · Browse Quest Level' })
    .setTimestamp();
}

function buildBrowseQuestListEmbed(professionLabel, level, quests = []) {
  const levelText = level === '-' || level === null || level === undefined ? '' : ` · Lv${level}`;
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📚 รายการเควส · ${professionLabel}${levelText}`)
    .setDescription(
      quests.length
        ? `พบเควสทั้งหมด ${quests.length} เควส เลือกเควสที่ต้องการเพื่อเปิดหน้ารายละเอียด`
        : 'ไม่พบเควสในเงื่อนไขที่เลือก'
    )
    .setFooter({ text: 'SCUM Quest System · Quest List' })
    .setTimestamp();
}

function buildGlobalQuestListEmbed(categoryCode, quests = []) {
  const label = categoryCode === 'TIMED' ? 'เควสพิเศษ' : 'เควสตำนาน';
  const description = categoryCode === 'TIMED'
    ? 'รายการนี้เป็นเควสที่เปิดทำได้เลย ไม่ผูกกับสายอาชีพ'
    : 'รายการนี้เป็นเควสตำนานที่เปิดทำได้เลย ไม่ผูกกับสายอาชีพ';
  return new EmbedBuilder()
    .setColor(categoryCode === 'TIMED' ? 0xfaa61a : 0xeb459e)
    .setTitle(`✨ รายการ${label}`)
    .setDescription(quests.length ? `${description}

พบทั้งหมด ${quests.length} เควส` : `${description}

ยังไม่พบเควสในหมวดนี้`)
    .setFooter({ text: 'SCUM Quest System · Global Quest List' })
    .setTimestamp();
}

function buildQuestDetailEmbed(bundle) {
  const { quest, dependencies = [], requirements = [], rewards = [], images = [], steps = [] } = bundle;
  const professionLabel = quest.profession_name_th || quest.profession_code || (quest.category_code === 'TIMED' ? 'เควสพิเศษ' : quest.category_code === 'LEGENDARY' ? 'เควสตำนาน' : 'ไม่ระบุสาย');
  const dependencyText = dependencies.length
    ? dependencies.map((dep, index) => `${index + 1}. ${dep.required_quest_code || dep.required_role_name || dep.required_level || dep.dependency_type}${dep.required_quest_name ? ` · ${dep.required_quest_name}` : ''}`).join('\n')
    : 'ไม่มี';

  const requirementText = requirements.length ? requirements.map(requirementLine).join('\n') : 'ไม่มีรายการ';
  const rewardText = rewards.length ? rewards.map(rewardLine).join('\n') : 'ไม่มีรายการ';
  const stepText = steps.length
    ? steps.map((step) => `${step.step_no}. ${step.step_title}${step.is_active ? '' : ' (ปิดใช้งาน)'}`).join('\n')
    : 'ไม่มีรายการขั้นตอน';
  const titleText = quest.profession_code
    ? `${quest.icon_emoji || '📘'} ${quest.profession_code} · Lv${quest.quest_level || '-'} · ${quest.quest_code}`
    : `${quest.category_code === 'LEGENDARY' ? '👑' : '✨'} ${quest.category_code === 'LEGENDARY' ? 'LEGENDARY' : quest.category_code === 'TIMED' ? 'SPECIAL' : 'QUEST'} · ${quest.quest_code}`;

  const fields = [
    { name: '📝 คำอธิบายเควส', value: clampText(quest.quest_description || quest.panel_description || '-'), inline: false }
  ];

  if (quest.category_code === 'TIMED') {
    fields.push({ name: '🕒 เวลาเควส', value: clampText(buildTimedWindowAdminBlock(quest) || '-') , inline: false });
  }

  fields.push(
    { name: '🔗 เควสที่ต้องผ่านก่อน', value: clampText(dependencyText), inline: false },
    { name: '📦 ของที่ต้องส่ง / เงื่อนไข', value: clampText(requirementText), inline: false },
    { name: '🎁 รางวัล', value: clampText(rewardText), inline: false },
    { name: '🪜 ขั้นตอน', value: clampText(stepText), inline: false },
    {
      name: '🛠️ เมนูการจัดการ',
      value: clampText([
        '• **แก้คำอธิบาย** : แก้ชื่อและรายละเอียดหลักของเควส',
        '• **แก้เวลา/ลิมิต** : ตั้งเวลาเปิด-ปิด และจำนวนครั้งของเควสนี้',
        '• **แก้ของที่ต้องส่ง** : แก้ชื่อและจำนวนของ requirement',
        '• **แก้รางวัล** : แก้รายการ reward เดิมของเควสนี้',
        '• **แก้เควสก่อนหน้า** : ตั้งหรือเปลี่ยน dependency ของเควสนี้',
        '• **แก้ Fame ขั้นต่ำ** : ตั้งค่า Fame ขั้นต่ำของเควสนี้จากพาเนลแอดมิน',
        '• **จัดการ Step** : เพิ่ม แก้ เปิด/ปิด Step และจัดการรูปของ Step',
        '• **จัดการรูปตัวอย่าง** : ลบและเพิ่มรูปตัวอย่างระดับเควส',
        '• **เพิ่มของที่ต้องส่ง / เพิ่มรางวัล / เพิ่มรูปตัวอย่าง** : เพิ่มข้อมูลใหม่ให้เควสนี้'
      ].join('\n')),
      inline: false
    }
  );

  return new EmbedBuilder()
    .setColor(quest.is_active ? 0x57f287 : 0xed4245)
    .setTitle(titleText)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**สถานะ:** ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
      `**ประเภท:** ${formatQuestType(quest)}`,
      `**สายอาชีพ:** ${quest.profession_name_th || '-'}`,
      `**ใช้ Ticket:** ${quest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`,
      `**Fame ขั้นต่ำ:** ${Number(quest.fame_required_display || 0) > 0 ? Number(quest.fame_required_display).toLocaleString('en-US') : 'ไม่จำกัด'}`,
      `**จำนวนรูปตัวอย่าง:** ${images.length} รูป`
    ].join('\n'))
    .addFields(...fields)
    .setFooter({ text: `SCUM Quest System · ${professionLabel}` })
    .setTimestamp(quest.updated_at || new Date());
}

function buildQuestImageEmbeds(bundle, limit = 8) {
  const { quest, images = [] } = bundle;
  return images.slice(0, limit).map((item, index) => new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🖼️ รูปตัวอย่างเควส ${index + 1}/${images.length} · ${quest.quest_code}`)
    .setDescription(clampText(item.media_title || item.media_description || imageTitle(item, index), 4096))
    .setImage(item.media_url)
    .setFooter({ text: 'SCUM Quest System · Quest Image' }));
}

function buildQuestImageManagerEmbed(bundle, currentIndex = 0) {
  const { quest, images = [] } = bundle;
  const safeIndex = Math.min(Math.max(Number(currentIndex) || 0, 0), Math.max(images.length - 1, 0));
  const currentImage = images[safeIndex];

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🖼️ จัดการรูปตัวอย่าง · ${quest.quest_code}`)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**จำนวนรูปทั้งหมด:** ${images.length} รูป`
    ].join('\n'))
    .setFooter({ text: `SCUM Quest System · Image Manager · ${safeIndex + 1}/${Math.max(images.length, 1)}` })
    .setTimestamp();

  if (!currentImage) {
    embed.addFields({ name: 'สถานะ', value: 'ยังไม่มีรูปตัวอย่างสำหรับเควสนี้', inline: false });
    return embed;
  }

  return embed
    .addFields({
      name: 'รายละเอียดรูปปัจจุบัน',
      value: clampText([
        `**ลำดับ:** ${safeIndex + 1}/${images.length}`,
        `**ชื่อรูป:** ${currentImage.media_title || '-'}`,
        `**คำอธิบาย:** ${currentImage.media_description || '-'}`
      ].join('\n')),
      inline: false
    })
    .setImage(currentImage.media_url);
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
      'เลือกรายการที่ต้องการแก้ไข จากนั้นระบบจะเปิดฟอร์มให้แก้เฉพาะชื่อและจำนวน'
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
    .setTitle('📊 สถานะพาเนลผู้เล่น')
    .setDescription(statusLines.length ? statusLines.join('\n') : 'ยังไม่พบข้อมูลพาเนล')
    .setFooter({ text: 'SCUM Quest System · Panel Status' })
    .setTimestamp();
}

function buildDependencyPickerEmbed(bundle, options = []) {
  const current = bundle.dependencies[0];
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🔗 แก้เควสก่อนหน้า · ${bundle.quest.quest_code}`)
    .setDescription([
      `**เควสปัจจุบัน:** ${bundle.quest.quest_name}`,
      `**Dependency ปัจจุบัน:** ${current ? `${current.required_quest_code} · ${current.required_quest_name || '-'}` : 'ไม่มี'}`,
      `**ตัวเลือกที่ใช้ได้:** ${options.length} เควส`,
      '',
      'เลือกเควสก่อนหน้าที่ต้องผ่านก่อน หรือเลือก **ไม่มี dependency** เพื่อลบเงื่อนไขเดิม'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Dependency Editor' })
    .setTimestamp();
}

function buildCreateQuestSummaryEmbed(profession, level) {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🧱 สร้างเควสใหม่')
    .setDescription([
      `**สายอาชีพ:** ${profession?.icon_emoji || '📘'} ${profession?.profession_name_th || profession?.profession_code || '-'}`,
      `**เลเวล:** Lv${level}`,
      '',
      'ต่อไประบบจะเปิดฟอร์มให้กรอกข้อมูลพื้นฐานของเควสใหม่'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Create Quest' })
    .setTimestamp();
}

function buildStepManagerEmbed(bundle) {
  const { quest, steps = [] } = bundle;
  const lines = steps.length
    ? steps.map((step) => `${step.step_no}. ${step.step_title}${step.is_active ? '' : ' (ปิดใช้งาน)'}`).join('\n')
    : 'ยังไม่มี Step สำหรับเควสนี้';

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🪜 จัดการ Step · ${quest.quest_code}`)
    .setDescription([
      `**ชื่อเควส:** ${quest.quest_name}`,
      `**จำนวน Step:** ${steps.length}`,
      '',
      lines,
      '',
      '**เมนูการจัดการ**',
      '• **เพิ่ม Step** : เพิ่มขั้นตอนใหม่ให้เควสนี้',
      '• **เลือก Step** : เปิดหน้ารายละเอียดของ Step ที่ต้องการแก้ไข'
    ].join('\n'))
    .setFooter({ text: 'SCUM Quest System · Step Manager' })
    .setTimestamp();
}

function buildStepDetailEmbed(bundle) {
  const { step, requirements = [], rewards = [], images = [] } = bundle;
  return new EmbedBuilder()
    .setColor(step.is_active ? 0x57f287 : 0xed4245)
    .setTitle(`🪜 Step ${step.step_no} · ${step.quest_code}`)
    .setDescription([
      `**ชื่อ Step:** ${step.step_title}`,
      `**สถานะ:** ${step.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
      `**ต้องกรอกข้อความ:** ${step.requires_text_input ? 'ใช่' : 'ไม่ใช่'}`,
      `**ต้องแนบรูป:** ${step.requires_attachment ? 'ใช่' : 'ไม่ใช่'}`,
      `**ต้องอนุมัติแอดมิน:** ${step.requires_admin_approval ? 'ใช่' : 'ไม่ใช่'}`,
      `**ยอมให้ส่งใหม่:** ${step.allow_resubmit ? 'ใช่' : 'ไม่ใช่'}`
    ].join('\n'))
    .addFields(
      { name: 'คำอธิบาย Step', value: clampText(step.step_description || '-'), inline: false },
      { name: 'Success Message', value: clampText(step.success_message || '-'), inline: false },
      { name: 'Failure Message', value: clampText(step.failure_message || '-'), inline: false },
      { name: 'Requirement ใน Step', value: clampText(requirements.length ? requirements.map(requirementLine).join('\n') : 'ไม่มี'), inline: false },
      { name: 'Reward ใน Step', value: clampText(rewards.length ? rewards.map(rewardLine).join('\n') : 'ไม่มี'), inline: false },
      { name: 'รูปตัวอย่างใน Step', value: `${images.length} รูป`, inline: false }
    )
    .setFooter({ text: 'SCUM Quest System · Step Detail' })
    .setTimestamp(step.updated_at || new Date());
}

function buildStepImageEmbeds(bundle, limit = 8) {
  const { step, images = [] } = bundle;
  return images.slice(0, limit).map((item, index) => new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🖼️ รูป Step ${step.step_no} · ${index + 1}/${images.length}`)
    .setDescription(clampText(item.media_title || item.media_description || imageTitle(item, index), 4096))
    .setImage(item.media_url)
    .setFooter({ text: 'SCUM Quest System · Step Image' }));
}

function buildStepImageManagerEmbed(bundle, currentIndex = 0) {
  const { step, images = [] } = bundle;
  const safeIndex = Math.min(Math.max(Number(currentIndex) || 0, 0), Math.max(images.length - 1, 0));
  const currentImage = images[safeIndex];
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🖼️ จัดการรูป Step ${step.step_no}`)
    .setDescription(`**จำนวนรูปทั้งหมด:** ${images.length} รูป`)
    .setFooter({ text: `SCUM Quest System · Step Image Manager · ${safeIndex + 1}/${Math.max(images.length, 1)}` })
    .setTimestamp();

  if (!currentImage) {
    embed.addFields({ name: 'สถานะ', value: 'ยังไม่มีรูปตัวอย่างสำหรับ Step นี้', inline: false });
    return embed;
  }

  return embed
    .addFields({
      name: 'รายละเอียดรูปปัจจุบัน',
      value: clampText([
        `**ชื่อรูป:** ${currentImage.media_title || '-'}`,
        `**คำอธิบาย:** ${currentImage.media_description || '-'}`
      ].join('\n')),
      inline: false
    })
    .setImage(currentImage.media_url);
}

module.exports = {
  buildAdminHomeEmbed,
  buildPanelManagementEmbed,
  buildMasterHomeEmbed,
  buildBrowseQuestEmbed,
  buildBrowseLevelEmbed,
  buildBrowseQuestListEmbed,
  buildGlobalQuestListEmbed,
  buildQuestDetailEmbed,
  buildQuestImageEmbeds,
  buildQuestImageManagerEmbed,
  buildRequirementPickerEmbed,
  buildRewardPickerEmbed,
  buildPanelStatusEmbed,
  buildDependencyPickerEmbed,
  buildCreateQuestSummaryEmbed,
  buildStepManagerEmbed,
  buildStepDetailEmbed,
  buildStepImageEmbeds,
  buildStepImageManagerEmbed
};
