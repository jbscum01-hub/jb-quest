const { EmbedBuilder } = require('discord.js');

function formatRequirement(req, index) {
  return `${index + 1}. ${req.display_text || '-'}`;
}

function formatReward(reward, index) {
  const text = reward.reward_display_text || (reward.reward_type === 'DISCORD_ROLE' && reward.discord_role_id ? `Role ID: ${reward.discord_role_id}` : reward.reward_type);
  return `${index + 1}. ${text}`;
}

function formatSteps(steps) {
  if (!steps.length) return 'ไม่มี';
  return steps.map((step) => `${step.step_no}. ${step.step_title}`).join('\n');
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

function formatSubmissionLimit(quest) {
  if (quest.category_code === 'LEGENDARY') return `${Number(quest.weekly_claim_limit || 1)} ครั้ง / สัปดาห์`;
  const limitCount = Number(quest.submission_limit_count || 0);
  const limitPeriodDays = Number(quest.submission_limit_period_days || 0);
  if (!limitCount || !limitPeriodDays) return 'ไม่จำกัดจำนวนครั้งต่อรอบ';
  return `${limitCount} ครั้ง / ${limitPeriodDays} วัน`;
}

function buildTimedWindowAdminBlock(quest) {
  if (quest.category_code !== 'TIMED') return null;
  return [
    `เริ่ม: ${formatThaiDateTime(quest.start_at)}`,
    `ระยะเวลา: ${Number(quest.duration_days || 0) > 0 ? `${quest.duration_days} วัน` : 'ยังไม่ได้ตั้งค่า'}`,
    `สิ้นสุด: ${formatThaiDateTime(quest.end_at)}`
  ].join('\n');
}

function resolveQuestType(quest) {
  if (quest.category_code === 'TIMED') return 'Special Quest';
  if (quest.category_code === 'LEGENDARY') return 'Legendary Quest';
  return quest.is_repeatable ? 'Repeatable' : (quest.is_step_quest ? 'Step Quest' : 'Main Quest');
}

function buildQuestDetailEmbed(bundle) {
  const { quest, requirements, rewards, images, steps, panelMessageId = null } = bundle;
  const titleParts = [
    quest.icon_emoji || (quest.category_code === 'LEGENDARY' ? '👑' : quest.category_code === 'TIMED' ? '✨' : '📘'),
    quest.profession_code || (quest.category_code === 'TIMED' ? 'SPECIAL' : quest.category_code === 'LEGENDARY' ? 'LEGENDARY' : 'NO_PROF'),
    `Lv${quest.quest_level || '-'}`,
    quest.quest_code
  ];

  const infoLines = [
    `สถานะ: ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
    `ประเภท: ${resolveQuestType(quest)}`,
    `ใช้ Ticket: ${quest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`,
    `อนุมัติโดยแอดมิน: ${quest.requires_admin_approval ? 'ใช่' : 'ไม่ใช่'}`,
    `ลิมิตส่งเควส: ${formatSubmissionLimit(quest)}`,
    `Panel Message: ${panelMessageId || 'ยังไม่ deploy'}`,
    `จำนวนรูปตัวอย่าง: ${images.length} รูป`
  ];

  const fields = [
    { name: 'ข้อมูลหลัก', value: infoLines.join('\n') },
    { name: 'คำอธิบายเควส', value: (quest.quest_description || quest.panel_description || '-').slice(0, 1024) }
  ];

  if (quest.category_code === 'TIMED') {
    fields.push({ name: '🕒 เวลาเควส', value: buildTimedWindowAdminBlock(quest) });
  }

  fields.push(
    { name: `ของที่ต้องส่ง / เงื่อนไข (${requirements.length})`, value: requirements.length ? requirements.slice(0, 15).map(formatRequirement).join('\n').slice(0, 1024) : 'ไม่มี' },
    { name: `รางวัล (${rewards.length})`, value: rewards.length ? rewards.slice(0, 15).map(formatReward).join('\n').slice(0, 1024) : 'ไม่มี' },
    { name: `ขั้นตอน (${steps.length})`, value: formatSteps(steps).slice(0, 1024) },
    {
      name: 'เมนูการจัดการ',
      value: [
        '• แก้คำอธิบาย : แก้ชื่อเควสและรายละเอียดหลัก',
        '• แก้ของที่ต้องส่ง : แก้ข้อความเงื่อนไขแบบยกชุด',
        '• แก้รางวัลไอเทม : แก้ข้อความรางวัล SCUM_ITEM',
        '• แก้คำสั่งไอเทม : แก้ reward_spawn_command_template แยกต่างหาก',
        '• ตั้ง Role Reward : ตั้ง role 1 อันต่อ 1 เควส',
        '• ดูเควส / แก้ Fame / เพิ่มรูปตัวอย่าง : ใช้งานต่อได้เหมือนเดิม'
      ].join('\n').slice(0, 1024)
    }
  );

  return new EmbedBuilder()
    .setColor(quest.is_active ? 0x57f287 : 0xed4245)
    .setTitle(titleParts.join(' · '))
    .setDescription(`**ชื่อเควส:** ${quest.quest_name}`)
    .addFields(fields)
    .setFooter({ text: `Quest ID: ${quest.quest_id}` })
    .setTimestamp(new Date(quest.updated_at || quest.created_at || Date.now()));
}

function buildImageManagerEmbed(bundle) {
  const { quest, images } = bundle;
  return new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle(`🖼️ จัดการรูปตัวอย่าง · ${quest.quest_code}`)
    .setDescription(`ชื่อเควส: **${quest.quest_name}**`)
    .addFields({
      name: `รูปตัวอย่างทั้งหมด (${images.length})`,
      value: images.length
        ? images.slice(0, 20).map((image, index) => `${index + 1}. ${image.media_title || 'ไม่มีชื่อรูป'}\n- URL: ${image.media_url}\n- คำอธิบาย: ${image.media_description || '-'}`).join('\n').slice(0, 1024)
        : 'ยังไม่มีรูปตัวอย่างของเควสนี้'
    }, {
      name: 'เมนูการจัดการ',
      value: ['• เพิ่มรูปตัวอย่าง : เพิ่ม GUIDE_IMAGE ใหม่ให้เควสนี้', '• ลบรูปตัวอย่าง : เลือกรูปที่ต้องการปิดการใช้งาน', '• กลับหน้าเควส : ย้อนกลับไปดูข้อมูลเควสทั้งหมด'].join('\n')
    })
    .setFooter({ text: `Quest ID: ${quest.quest_id}` })
    .setTimestamp();
}

module.exports = { buildQuestDetailEmbed, buildImageManagerEmbed };
