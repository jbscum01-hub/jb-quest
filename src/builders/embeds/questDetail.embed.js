const { EmbedBuilder } = require('discord.js');

function formatRequirement(req, index) {
  const main = req.display_text || req.item_name || req.input_label || req.requirement_type;
  const qty = req.required_quantity ? ` x${req.required_quantity}` : '';
  const admin = req.admin_display_text ? `\n- หมายเหตุแอดมิน: ${req.admin_display_text}` : '';
  return `${index + 1}. ${main}${qty}${admin}`;
}

function formatReward(reward, index) {
  const main = reward.reward_display_text
    || reward.reward_item_name
    || reward.reward_value_text
    || reward.discord_role_name
    || reward.reward_type;
  const qty = reward.reward_quantity ? ` x${reward.reward_quantity}` : '';
  const num = reward.reward_value_number ? ` (${reward.reward_value_number})` : '';
  return `${index + 1}. ${main}${qty}${num}`;
}

function formatDependency(dep) {
  if (!dep) return 'ไม่มี';
  if (dep.dependency_type === 'PREVIOUS_QUEST') {
    return dep.required_quest_code
      ? `${dep.required_quest_code} · ${dep.required_quest_name || '-'}`
      : 'ตั้งค่า quest ก่อนหน้าไว้ แต่ไม่พบข้อมูลปลายทาง';
  }
  if (dep.dependency_type === 'MAIN_LEVEL') {
    return `Main Level อย่างน้อย Lv${dep.required_level || '-'}`;
  }
  if (dep.dependency_type === 'ROLE') {
    return `Role: ${dep.required_role_name || dep.required_role_id || '-'}`;
  }
  return dep.dependency_type || 'ไม่มี';
}

function formatSteps(steps) {
  if (!steps.length) return 'ไม่มี';
  return steps.map((step) => `${step.step_no}. ${step.step_title}`).join('\n');
}

function buildQuestDetailEmbed(bundle) {
  const { quest, requirements, rewards, dependencies, images, steps } = bundle;
  const primaryDependency = dependencies[0] || null;
  const titleParts = [
    quest.icon_emoji || '📘',
    quest.profession_code || 'NO_PROF',
    `Lv${quest.quest_level || '-'}`,
    quest.quest_code
  ];

  const descriptionText = quest.quest_description || quest.panel_description || '-';

  return new EmbedBuilder()
    .setColor(quest.is_active ? 0x57f287 : 0xed4245)
    .setTitle(titleParts.join(' · '))
    .setDescription(`**ชื่อเควส:** ${quest.quest_name}`)
    .addFields(
      {
        name: 'ข้อมูลหลัก',
        value: [
          `สถานะ: ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
          `ประเภท: ${quest.is_repeatable ? 'Repeatable' : (quest.is_step_quest ? 'Step Quest' : 'Main Quest')}`,
          `ใช้ Ticket: ${quest.requires_ticket ? 'ใช่' : 'ไม่ใช่'}`,
          `อนุมัติโดยแอดมิน: ${quest.requires_admin_approval ? 'ใช่' : 'ไม่ใช่'}`,
          `เควสก่อนหน้า: ${formatDependency(primaryDependency)}`,
          `จำนวนรูปตัวอย่าง: ${images.length} รูป`
        ].join('\n')
      },
      {
        name: 'คำอธิบายเควส',
        value: descriptionText.length > 1024 ? `${descriptionText.slice(0, 1021)}...` : descriptionText
      },
      {
        name: `ของที่ต้องส่ง / เงื่อนไข (${requirements.length})`,
        value: requirements.length
          ? requirements.slice(0, 15).map(formatRequirement).join('\n').slice(0, 1024)
          : 'ไม่มี'
      },
      {
        name: `รางวัล (${rewards.length})`,
        value: rewards.length
          ? rewards.slice(0, 15).map(formatReward).join('\n').slice(0, 1024)
          : 'ไม่มี'
      },
      {
        name: `ขั้นตอน (${steps.length})`,
        value: formatSteps(steps).slice(0, 1024)
      },
      {
        name: 'เมนูการจัดการ',
        value: [
          '• **แก้คำอธิบาย** : แก้ชื่อเควส รายละเอียดหลัก ป้ายพาเนล และบันทึกแอดมิน',
          '• **แก้ของที่ต้องส่ง** : เลือกรายการ requirement เดิมเพื่อแก้ชื่อ จำนวน หรือข้อความ',
          '• **แก้รางวัล** : เลือกรายการ reward เดิมเพื่อแก้ประเภท จำนวน หรือข้อความแสดงผล',
          '• **แก้เควสก่อนหน้า** : ตั้งหรือเปลี่ยน dependency ของเควสนี้',
          '• **จัดการรูปตัวอย่าง** : ดูรายการรูปปัจจุบันและลบรูปที่ไม่ใช้',
          '• **เปลี่ยนสถานะเควส** : เปิดหรือปิดการใช้งานเควส',
          '• **เพิ่มของที่ต้องส่ง / เพิ่มรางวัล / เพิ่มรูปตัวอย่าง** : เพิ่มข้อมูลใหม่ให้เควสนี้'
        ].join('\n').slice(0, 1024)
      }
    )
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
        ? images
          .slice(0, 20)
          .map((image, index) => `${index + 1}. ${image.media_title || 'ไม่มีชื่อรูป'}\n- URL: ${image.media_url}\n- คำอธิบาย: ${image.media_description || '-'} `)
          .join('\n')
          .slice(0, 1024)
        : 'ยังไม่มีรูปตัวอย่างของเควสนี้'
    }, {
      name: 'เมนูการจัดการ',
      value: [
        '• **เพิ่มรูปตัวอย่าง** : เพิ่ม GUIDE_IMAGE ใหม่ให้เควสนี้',
        '• **ลบรูปตัวอย่าง** : เลือกรูปที่ต้องการปิดการใช้งาน',
        '• **กลับหน้าเควส** : ย้อนกลับไปดูข้อมูลเควสทั้งหมด'
      ].join('\n')
    })
    .setFooter({ text: `Quest ID: ${quest.quest_id}` })
    .setTimestamp();
}

module.exports = {
  buildQuestDetailEmbed,
  buildImageManagerEmbed
};
