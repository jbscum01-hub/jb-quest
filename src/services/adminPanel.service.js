const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { getPool } = require('../db/pool');
const { buildAdminPanelEmbed, buildPanelManagementEmbed, buildMasterHomeEmbed } = require('../builders/embeds/adminPanel.embed');
const {
  buildAdminPanelButtons,
  buildPanelManagementButtons,
  buildMasterHomeButtons,
  buildProfessionSelect,
  buildLevelSelect,
  buildQuestSelect,
  buildQuestDetailButtons,
  buildBackButtons
} = require('../builders/components/adminPanel.components');
const {
  getProfessionPanelChannelId,
  getProfessionPanelMessageId,
  getGlobalConfigValue,
  getAdminPanelMessageId
} = require('./discordConfig.service');
const { DISCORD_CONFIG_KEYS } = require('../constants/discordConfigKeys');

function db() {
  return getPool();
}

function replyTarget(interaction) {
  return interaction.deferred || interaction.replied
    ? (payload) => interaction.editReply(payload)
    : (payload) => interaction.update(payload);
}

async function query(sql, params = []) {
  const result = await db().query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function refreshAdminPanel(message) {
  await message.edit({
    embeds: [buildAdminPanelEmbed()],
    components: buildAdminPanelButtons()
  });
}

async function renderAdminHome(target) {
  return target.editReply
    ? target.editReply({
        embeds: [buildAdminPanelEmbed()],
        components: buildAdminPanelButtons()
      })
    : target.edit({
        embeds: [buildAdminPanelEmbed()],
        components: buildAdminPanelButtons()
      });
}

async function showPanelManagement(interaction) {
  const send = replyTarget(interaction);
  return send({
    embeds: [buildPanelManagementEmbed()],
    components: buildPanelManagementButtons()
  });
}

async function showMasterHome(interaction) {
  const send = replyTarget(interaction);
  return send({
    embeds: [buildMasterHomeEmbed()],
    components: buildMasterHomeButtons()
  });
}

async function findActiveProfessions() {
  return query(`
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE is_active = TRUE
    ORDER BY sort_order ASC, profession_code ASC
  `);
}

async function findProfessionById(professionId) {
  return queryOne(
    `
    SELECT profession_id, profession_code, profession_name_th, profession_name_en, icon_emoji, sort_order
    FROM public.tb_quest_master_profession
    WHERE profession_id = $1
    LIMIT 1
    `,
    [professionId]
  );
}

async function findQuestLevelsByProfession(professionId) {
  return query(
    `
    SELECT q.quest_level, COUNT(*)::int AS quest_count
    FROM public.tb_quest_master q
    WHERE q.profession_id = $1
    GROUP BY q.quest_level
    ORDER BY q.quest_level ASC NULLS LAST
    `,
    [professionId]
  );
}

async function findQuestsByProfessionAndLevel(professionId, level) {
  return query(
    `
    SELECT q.quest_id, q.quest_code, q.quest_name, q.quest_level, q.is_active, q.is_step_quest,
           q.requires_ticket, q.is_repeatable, q.display_order
    FROM public.tb_quest_master q
    WHERE q.profession_id = $1
      AND q.quest_level = $2
    ORDER BY q.display_order ASC, q.quest_code ASC, q.created_at ASC
    `,
    [professionId, level]
  );
}

async function findQuestById(questId) {
  return queryOne(
    `
    SELECT q.*, p.profession_code, p.profession_name_th, c.category_code, c.category_name
    FROM public.tb_quest_master q
    LEFT JOIN public.tb_quest_master_profession p ON q.profession_id = p.profession_id
    LEFT JOIN public.tb_quest_master_category c ON q.category_id = c.category_id
    WHERE q.quest_id = $1
    LIMIT 1
    `,
    [questId]
  );
}

async function findQuestRequirements(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );
}

async function findQuestRewards(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY sort_order ASC, created_at ASC
    `,
    [questId]
  );
}

async function findQuestDependencies(questId) {
  return query(
    `
    SELECT d.*, rq.quest_code AS required_quest_code, rq.quest_name AS required_quest_name
    FROM public.tb_quest_master_dependency d
    LEFT JOIN public.tb_quest_master rq ON d.required_quest_id = rq.quest_id
    WHERE d.quest_id = $1
      AND d.is_active = TRUE
    ORDER BY d.sort_order ASC, d.created_at ASC
    `,
    [questId]
  );
}

async function findQuestImages(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
      AND is_active = TRUE
      AND media_type IN ('GUIDE_IMAGE', 'IMAGE')
    ORDER BY display_order ASC, created_at ASC
    `,
    [questId]
  );
}

async function findQuestSteps(questId) {
  return query(
    `
    SELECT *
    FROM public.tb_quest_master_step
    WHERE quest_id = $1
      AND is_active = TRUE
    ORDER BY step_no ASC, created_at ASC
    `,
    [questId]
  );
}

async function showProfessionBrowse(interaction) {
  const professions = await findActiveProfessions();
  const send = replyTarget(interaction);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🗂️ เลือกสายอาชีพ')
    .setDescription('เลือกสายอาชีพด้านล่าง แล้วระบบจะพาไปเลือกระดับเควสต่อ')
    .addFields({
      name: 'สายที่ใช้งานได้',
      value: professions.map((item) => `• ${item.profession_name_th} (${item.profession_code})`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();

  return send({
    embeds: [embed],
    components: [...buildProfessionSelect(professions), ...buildBackButtons('quest:admin:master_home')]
  });
}

async function showLevelBrowse(interaction, professionId) {
  const profession = await findProfessionById(professionId);
  const levels = await findQuestLevelsByProfession(professionId);
  if (!profession) throw new Error('ไม่พบข้อมูลสายอาชีพ');

  const send = replyTarget(interaction);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`🧭 เลือกระดับเควส · ${profession.profession_name_th}`)
    .setDescription('เลือกระดับที่ต้องการ แล้วระบบจะแสดงรายการเควสในระดับนั้น')
    .addFields({
      name: 'ระดับที่พบ',
      value: levels.map((item) => `• Lv.${item.quest_level} (${item.quest_count} เควส)`).join('\n') || '-'
    })
    .setTimestamp();

  return send({
    embeds: [embed],
    components: levels.length
      ? [...buildLevelSelect(professionId, levels), ...buildBackButtons('quest:admin:browse_start')]
      : buildBackButtons('quest:admin:browse_start')
  });
}

async function showQuestBrowse(interaction, professionId, level) {
  const profession = await findProfessionById(professionId);
  const quests = await findQuestsByProfessionAndLevel(professionId, level);
  if (!profession) throw new Error('ไม่พบข้อมูลสายอาชีพ');

  const send = replyTarget(interaction);

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`📚 เลือกเควส · ${profession.profession_name_th} · Lv.${level}`)
    .setDescription('เมื่อเลือกเควสแล้ว ระบบจะพาไปหน้า Quest Detail ของเควสนั้นทันที')
    .addFields({
      name: 'รายการเควส',
      value: quests.map((quest) => `• ${quest.quest_code} — ${quest.quest_name}`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();

  return send({
    embeds: [embed],
    components: quests.length
      ? [...buildQuestSelect(professionId, level, quests), ...buildBackButtons('quest:admin:browse_start')]
      : buildBackButtons('quest:admin:browse_start')
  });
}

async function showQuestDetail(interaction, questId) {
  const [quest, requirements, rewards, dependencies, images, steps] = await Promise.all([
    findQuestById(questId),
    findQuestRequirements(questId),
    findQuestRewards(questId),
    findQuestDependencies(questId),
    findQuestImages(questId),
    findQuestSteps(questId)
  ]);

  if (!quest) throw new Error('ไม่พบเควสที่เลือก');

  const dependencyText = dependencies.length
    ? dependencies.map((dep) => {
        if (dep.dependency_type === 'PREVIOUS_QUEST') {
          return `• ผ่านเควสก่อนหน้า: ${dep.required_quest_code || dep.required_quest_id}`;
        }
        if (dep.dependency_type === 'MAIN_LEVEL') {
          return `• ต้องมี Main Level อย่างน้อย Lv.${dep.required_level}`;
        }
        if (dep.dependency_type === 'ROLE') {
          return `• ต้องมี Role: ${dep.required_role_name || dep.required_role_id}`;
        }
        return `• ${dep.dependency_type}`;
      }).join('\n')
    : 'ไม่มี';

  const embed = new EmbedBuilder()
    .setColor(quest.is_active ? 0x57f287 : 0xed4245)
    .setTitle(`📘 ${quest.quest_name}`)
    .setDescription([
      `**รหัสเควส:** ${quest.quest_code}`,
      `**สายอาชีพ:** ${quest.profession_name_th || '-'} (${quest.profession_code || '-'})`,
      `**ระดับ:** Lv.${quest.quest_level ?? '-'}`,
      `**สถานะ:** ${quest.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
      `**ประเภท:** ${quest.is_step_quest ? 'Step Quest' : 'Quest ปกติ'}${quest.requires_ticket ? ' • ใช้ Ticket' : ''}${quest.is_repeatable ? ' • ทำซ้ำได้' : ''}`,
      '',
      `**คำอธิบาย:** ${quest.quest_description || quest.panel_description || '-'}`,
      '',
      'จากหน้านี้แอดมินจะเห็นชัดว่า “กำลังแก้เควสไหนอยู่” แล้วค่อยเลือกปุ่มที่เกี่ยวข้องด้านล่าง'
    ].join('\n'))
    .addFields(
      { name: 'เงื่อนไขปลดล็อก', value: dependencyText.slice(0, 1024) || 'ไม่มี', inline: false },
      { name: 'ของที่ต้องส่ง', value: String(requirements.length), inline: true },
      { name: 'รางวัล', value: String(rewards.length), inline: true },
      { name: 'รูปตัวอย่าง', value: String(images.length), inline: true },
      { name: 'ขั้นตอน', value: String(steps.length), inline: true }
    )
    .setFooter({ text: `Quest ID: ${quest.quest_id}` })
    .setTimestamp();

  const send = replyTarget(interaction);
  return send({
    embeds: [embed],
    components: buildQuestDetailButtons(questId, steps.length > 0)
  });
}

function buildListEmbed(title, color, description, lines) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields({
      name: 'รายละเอียด',
      value: lines.length ? lines.join('\n').slice(0, 1024) : 'ไม่มีข้อมูล'
    })
    .setTimestamp();
}

async function showRequirements(interaction, questId) {
  const [quest, requirements] = await Promise.all([findQuestById(questId), findQuestRequirements(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [
      buildListEmbed(
        `📦 ของที่ต้องส่ง · ${quest.quest_name}`,
        0x5865f2,
        `เควสนี้มี requirement ทั้งหมด ${requirements.length} รายการ`,
        requirements.map((row, idx) => `• ${idx + 1}. ${row.item_name || row.display_text || row.requirement_type}${row.required_quantity ? ` x${row.required_quantity}` : ''}`)
      )
    ],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showRewards(interaction, questId) {
  const [quest, rewards] = await Promise.all([findQuestById(questId), findQuestRewards(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [
      buildListEmbed(
        `🎁 รางวัล · ${quest.quest_name}`,
        0x57f287,
        `เควสนี้มี reward ทั้งหมด ${rewards.length} รายการ`,
        rewards.map((row, idx) => `• ${idx + 1}. ${row.reward_display_text || row.reward_item_name || row.reward_type}${row.reward_quantity ? ` x${row.reward_quantity}` : row.reward_value_number ? ` (${row.reward_value_number})` : ''}`)
      )
    ],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showDependencies(interaction, questId) {
  const [quest, dependencies] = await Promise.all([findQuestById(questId), findQuestDependencies(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [
      buildListEmbed(
        `🔓 เงื่อนไขปลดล็อก · ${quest.quest_name}`,
        0xfaa61a,
        'แสดง dependency ของเควสนี้เท่านั้น',
        dependencies.map((dep, idx) => {
          if (dep.dependency_type === 'PREVIOUS_QUEST') {
            return `• ${idx + 1}. ผ่าน ${dep.required_quest_code || '-'} ${dep.required_quest_name || ''}`.trim();
          }
          if (dep.dependency_type === 'MAIN_LEVEL') {
            return `• ${idx + 1}. ต้องมี Main Level Lv.${dep.required_level}`;
          }
          if (dep.dependency_type === 'ROLE') {
            return `• ${idx + 1}. ต้องมี Role ${dep.required_role_name || dep.required_role_id}`;
          }
          return `• ${idx + 1}. ${dep.dependency_type}`;
        })
      )
    ],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showImages(interaction, questId) {
  const [quest, images] = await Promise.all([findQuestById(questId), findQuestImages(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [
      buildListEmbed(
        `🖼️ รูปตัวอย่าง · ${quest.quest_name}`,
        0xeb459e,
        'ใช้หน้านี้เช็กว่ารูปตัวอย่างของเควสถูกใส่ไว้ครบหรือยัง',
        images.map((image, idx) => `• ${idx + 1}. ${image.media_title || 'ไม่มีชื่อ'}${image.media_description ? ` — ${image.media_description}` : ''}\n${image.media_url}`)
      )
    ],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function showSteps(interaction, questId) {
  const [quest, steps] = await Promise.all([findQuestById(questId), findQuestSteps(questId)]);
  const send = replyTarget(interaction);
  return send({
    embeds: [
      buildListEmbed(
        `🪜 ขั้นตอน Lv6 · ${quest.quest_name}`,
        0xfee75c,
        `เควสนี้มี step ทั้งหมด ${steps.length} ขั้น`,
        steps.map((step) => `• Step ${step.step_no} — ${step.step_title}${step.step_description ? `\n${step.step_description}` : ''}`)
      )
    ],
    components: buildBackButtons(`quest:admin:detail:${questId}`)
  });
}

async function getPanelStatusRows(client) {
  const professions = await findActiveProfessions();
  const adminPanelChannelId = await getGlobalConfigValue(DISCORD_CONFIG_KEYS.QUEST_ADMIN_PANEL_CHANNEL);
  const adminPanelMessageId = await getAdminPanelMessageId();

  const rows = [];

  for (const profession of professions) {
    const channelId = await getProfessionPanelChannelId(profession.profession_code);
    const messageId = await getProfessionPanelMessageId(profession.profession_code);
    let status = 'ไม่พบ config';

    if (channelId) {
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel) {
        status = 'ไม่พบห้องใน Discord';
      } else if (!messageId) {
        status = 'พบห้อง แต่ยังไม่มี message id';
      } else {
        const message = await channel.messages.fetch(messageId).catch(() => null);
        status = message ? 'พร้อมใช้งาน' : 'ไม่พบข้อความพาเนล';
      }
    }

    rows.push({ professionCode: profession.profession_code, status });
  }

  rows.unshift({
    professionCode: 'ADMIN_PANEL',
    status: adminPanelChannelId && adminPanelMessageId ? 'ตั้งค่าแล้ว' : 'ยังตั้งค่าไม่ครบ'
  });

  return rows;
}

async function showPanelStatus(interaction) {
  const rows = await getPanelStatusRows(interaction.client);
  const send = replyTarget(interaction);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📡 สถานะพาเนล')
    .setDescription('ใช้หน้านี้ตรวจว่าพาเนลของแต่ละสายยังอยู่ครบหรือไม่')
    .addFields({
      name: 'ผลการตรวจสอบ',
      value: rows.map((row) => `• ${row.professionCode} → ${row.status}`).join('\n').slice(0, 1024) || '-'
    })
    .setTimestamp();

  return send({
    embeds: [embed],
    components: buildBackButtons('quest:admin:panel_home')
  });
}

async function insertAuditLog({
  actorId,
  actorTag,
  action,
  target,
  meta
}) {
  await db().query(
    `
    INSERT INTO public.audit_logs
    (guild_id, actor_id, actor_tag, action, target, meta, created_at)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
    `,
    [
      process.env.GUILD_ID || 'UNKNOWN',
      actorId || null,
      actorTag || null,
      action,
      target || null,
      meta ? JSON.stringify(meta) : null
    ]
  );
}

async function updateQuestDescription(questId, actorTag, payload) {
  const before = await findQuestById(questId);

  const after = await queryOne(
    `
    UPDATE public.tb_quest_master
    SET
      quest_name = $2,
      quest_description = $3,
      panel_title = $4,
      panel_description = $5,
      button_label = $6,
      updated_at = now(),
      updated_by = $7
    WHERE quest_id = $1
    RETURNING *
    `,
    [
      questId,
      payload.questName,
      payload.questDescription || null,
      payload.panelTitle || null,
      payload.panelDescription || null,
      payload.buttonLabel || null,
      actorTag
    ]
  );

  return { before, after };
}

async function createQuest(payload, actorTag) {
  const profession = await queryOne(
    `SELECT profession_id FROM public.tb_quest_master_profession WHERE profession_code = $1 LIMIT 1`,
    [payload.professionCode]
  );
  if (!profession) throw new Error('ไม่พบ profession_code');

  const category = await queryOne(
    `SELECT category_id FROM public.tb_quest_master_category WHERE category_code = $1 LIMIT 1`,
    [payload.categoryCode]
  );
  if (!category) throw new Error('ไม่พบ category_code');

  const displayOrderRow = await queryOne(
    `
    SELECT COALESCE(MAX(display_order), 0) + 10 AS next_display_order
    FROM public.tb_quest_master
    WHERE profession_id = $1
      AND quest_level = $2
    `,
    [profession.profession_id, payload.questLevel]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master
    (
      quest_code, quest_name, quest_description, category_id, profession_id,
      quest_level, display_order, is_step_quest, requires_ticket,
      requires_admin_approval, is_repeatable, is_global_quest,
      is_active, created_at, updated_at, created_by, updated_by
    )
    VALUES
    (
      $1, $2, NULL, $3, $4,
      $5, $6, $7, $8,
      TRUE, $9, FALSE,
      TRUE, now(), now(), $10, $10
    )
    RETURNING *
    `,
    [
      payload.questCode,
      payload.questName,
      category.category_id,
      profession.profession_id,
      payload.questLevel,
      Number(displayOrderRow?.next_display_order || 10),
      payload.isStepQuest,
      payload.requiresTicket,
      payload.isRepeatable,
      actorTag
    ]
  );
}

async function addRequirement(questId, payload) {
  const sortRow = await queryOne(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
    FROM public.tb_quest_master_requirement
    WHERE quest_id = $1
    `,
    [questId]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master_requirement
    (
      quest_id, requirement_type, item_name, required_quantity,
      display_text, admin_display_text, sort_order,
      is_required, is_active, created_at, updated_at
    )
    VALUES
    (
      $1, $2, $3, $4, $5, $6, $7,
      TRUE, TRUE, now(), now()
    )
    RETURNING *
    `,
    [
      questId,
      payload.requirementType,
      payload.itemName || null,
      payload.requiredQuantity || null,
      payload.displayText || null,
      payload.adminDisplayText || null,
      Number(sortRow?.next_sort_order || 1)
    ]
  );
}

async function updateRequirement(requirementId, payload) {
  const before = await queryOne(
    `SELECT * FROM public.tb_quest_master_requirement WHERE requirement_id = $1 LIMIT 1`,
    [requirementId]
  );

  const after = await queryOne(
    `
    UPDATE public.tb_quest_master_requirement
    SET
      requirement_type = $2,
      item_name = $3,
      required_quantity = $4,
      display_text = $5,
      admin_display_text = $6,
      updated_at = now()
    WHERE requirement_id = $1
    RETURNING *
    `,
    [
      requirementId,
      payload.requirementType,
      payload.itemName || null,
      payload.requiredQuantity || null,
      payload.displayText || null,
      payload.adminDisplayText || null
    ]
  );

  return { before, after };
}

async function addReward(questId, payload) {
  const sortRow = await queryOne(
    `
    SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
    FROM public.tb_quest_master_reward
    WHERE quest_id = $1
    `,
    [questId]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master_reward
    (
      quest_id, reward_type, reward_display_text, reward_item_name,
      reward_quantity, reward_value_number, discord_role_name,
      sort_order, is_active, created_at, updated_at
    )
    VALUES
    (
      $1, $2, $3, $4, $5, $6, $7,
      $8, TRUE, now(), now()
    )
    RETURNING *
    `,
    [
      questId,
      payload.rewardType,
      payload.rewardDisplayText || null,
      payload.rewardItemName || null,
      payload.rewardQuantity || null,
      payload.rewardValueNumber || null,
      payload.discordRoleName || null,
      Number(sortRow?.next_sort_order || 1)
    ]
  );
}

async function updateReward(rewardId, payload) {
  const before = await queryOne(
    `SELECT * FROM public.tb_quest_master_reward WHERE reward_id = $1 LIMIT 1`,
    [rewardId]
  );

  const after = await queryOne(
    `
    UPDATE public.tb_quest_master_reward
    SET
      reward_type = $2,
      reward_display_text = $3,
      reward_item_name = $4,
      reward_quantity = $5,
      reward_value_number = $6,
      discord_role_name = $7,
      updated_at = now()
    WHERE reward_id = $1
    RETURNING *
    `,
    [
      rewardId,
      payload.rewardType,
      payload.rewardDisplayText || null,
      payload.rewardItemName || null,
      payload.rewardQuantity || null,
      payload.rewardValueNumber || null,
      payload.discordRoleName || null
    ]
  );

  return { before, after };
}

async function replaceDependency(questId, payload) {
  const before = await findQuestDependencies(questId);

  await db().query(
    `
    UPDATE public.tb_quest_master_dependency
    SET is_active = FALSE,
        updated_at = now()
    WHERE quest_id = $1
      AND is_active = TRUE
    `,
    [questId]
  );

  let after = [];

  if (payload.dependencyType !== 'NONE') {
    let requiredQuestId = null;
    if (payload.dependencyType === 'PREVIOUS_QUEST') {
      const quest = await queryOne(
        `SELECT quest_id FROM public.tb_quest_master WHERE quest_code = $1 LIMIT 1`,
        [payload.requiredQuestCode]
      );
      if (!quest) throw new Error('ไม่พบ required quest code');
      requiredQuestId = quest.quest_id;
    }

    const row = await queryOne(
      `
      INSERT INTO public.tb_quest_master_dependency
      (
        quest_id, dependency_type, required_quest_id, required_level,
        required_role_id, required_role_name, condition_operator,
        sort_order, is_active, created_at, updated_at
      )
      VALUES
      (
        $1, $2, $3, $4,
        $5, $6, 'AND',
        1, TRUE, now(), now()
      )
      RETURNING *
      `,
      [
        questId,
        payload.dependencyType,
        requiredQuestId,
        payload.requiredLevel || null,
        payload.requiredRoleId || null,
        payload.requiredRoleName || null
      ]
    );
    after = [row];
  }

  return { before, after };
}

async function addImage(questId, payload) {
  const displayRow = await queryOne(
    `
    SELECT COALESCE(MAX(display_order), 0) + 1 AS next_display_order
    FROM public.tb_quest_master_media
    WHERE quest_id = $1
    `,
    [questId]
  );

  return queryOne(
    `
    INSERT INTO public.tb_quest_master_media
    (
      quest_id, media_type, media_url, media_title, media_description,
      display_order, is_active, created_at, updated_at
    )
    VALUES
    (
      $1, 'GUIDE_IMAGE', $2, $3, $4,
      $5, TRUE, now(), now()
    )
    RETURNING *
    `,
    [
      questId,
      payload.mediaUrl,
      payload.mediaTitle || null,
      payload.mediaDescription || null,
      payload.displayOrder || Number(displayRow?.next_display_order || 1)
    ]
  );
}

async function toggleQuestActive(questId, actorTag) {
  const before = await findQuestById(questId);
  const after = await queryOne(
    `
    UPDATE public.tb_quest_master
    SET is_active = NOT is_active,
        updated_at = now(),
        updated_by = $2
    WHERE quest_id = $1
    RETURNING *
    `,
    [questId, actorTag]
  );
  return { before, after };
}

async function openCreateQuestModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('quest:admin:modal:create_quest')
    .setTitle('สร้างเควสใหม่');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('profession_code')
        .setLabel('profession_code เช่น MEDIC')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('category_code')
        .setLabel('category_code เช่น MAIN')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('quest_code')
        .setLabel('quest_code')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('quest_name')
        .setLabel('ชื่อเควส')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('quest_config')
        .setLabel('เลเวล|step|ticket|repeat เช่น 6|true|true|false')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue('1|false|false|false')
    )
  );

  await interaction.showModal(modal);
}

async function openEditDescriptionModal(interaction, questId) {
  const quest = await findQuestById(questId);
  if (!quest) throw new Error('ไม่พบเควสที่ต้องการแก้ไข');

  const modal = new ModalBuilder()
    .setCustomId(`quest:admin:modal:edit_description:${questId}`)
    .setTitle('แก้คำอธิบายเควส');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('quest_name')
        .setLabel('ชื่อเควส')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(quest.quest_name || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('quest_description')
        .setLabel('คำอธิบายเควส')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(quest.quest_description || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('panel_title')
        .setLabel('หัวข้อบนพาเนล')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(quest.panel_title || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('panel_description')
        .setLabel('คำอธิบายบนพาเนล')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(quest.panel_description || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('button_label')
        .setLabel('ข้อความบนปุ่ม')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(quest.button_label || '')
    )
  );

  await interaction.showModal(modal);
}

async function openAddRequirementModal(interaction, questId) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:admin:modal:add_requirement:${questId}`)
    .setTitle('เพิ่มของที่ต้องส่ง');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('requirement_type')
        .setLabel('ประเภท requirement เช่น SCUM_ITEM')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue('SCUM_ITEM')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('item_name')
        .setLabel('ชื่อของ / requirement')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('required_quantity')
        .setLabel('จำนวนที่ต้องส่ง')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('display_text')
        .setLabel('ข้อความที่ผู้เล่นเห็น')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('admin_display_text')
        .setLabel('ข้อความสำหรับแอดมิน')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    )
  );

  await interaction.showModal(modal);
}

async function openAddRewardModal(interaction, questId) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:admin:modal:add_reward:${questId}`)
    .setTitle('เพิ่มรางวัล');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_type')
        .setLabel('ประเภทรางวัล เช่น SCUM_ITEM / FAME_POINT')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue('SCUM_ITEM')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_display_text')
        .setLabel('ข้อความแสดงรางวัล')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_item_name')
        .setLabel('ชื่อไอเท็ม / ชื่อรางวัล')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_quantity')
        .setLabel('จำนวนรางวัล')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_value_number')
        .setLabel('ตัวเลขรางวัล (เงิน/FP)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    )
  );

  await interaction.showModal(modal);
}

async function openAddImageModal(interaction, questId) {
  const modal = new ModalBuilder()
    .setCustomId(`quest:admin:modal:add_image:${questId}`)
    .setTitle('เพิ่มรูปตัวอย่าง');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('media_url')
        .setLabel('URL รูปภาพ')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('media_title')
        .setLabel('ชื่อรูป')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('media_description')
        .setLabel('คำอธิบายรูป')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('display_order')
        .setLabel('ลำดับการแสดงผล')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    )
  );

  await interaction.showModal(modal);
}

async function openEditDependencyModal(interaction, questId) {
  const currentDeps = await findQuestDependencies(questId);
  const current = currentDeps[0];

  const modal = new ModalBuilder()
    .setCustomId(`quest:admin:modal:edit_dependency:${questId}`)
    .setTitle('แก้ Dependency');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('dependency_type')
        .setLabel('NONE / PREVIOUS_QUEST / MAIN_LEVEL / ROLE')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(current?.dependency_type || 'NONE')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('required_quest_code')
        .setLabel('required quest code')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue('')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('required_level')
        .setLabel('required level')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(current?.required_level ? String(current.required_level) : '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('required_role_id')
        .setLabel('required role id')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(current?.required_role_id || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('required_role_name')
        .setLabel('required role name')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(current?.required_role_name || '')
    )
  );

  await interaction.showModal(modal);
}

async function showRequirementEditor(interaction, questId) {
  const [quest, requirements] = await Promise.all([findQuestById(questId), findQuestRequirements(questId)]);

  if (!requirements.length) {
    await interaction.reply({
      content: 'เควสนี้ยังไม่มี requirement ให้แก้ไข ให้กดปุ่ม "เพิ่มของที่ต้องส่ง" ก่อน',
      ephemeral: true
    });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_requirement_edit:${questId}`)
    .setPlaceholder('เลือก requirement ที่ต้องการแก้')
    .addOptions(
      requirements.slice(0, 25).map((row) => ({
        label: `${row.item_name || row.requirement_type}`.slice(0, 100),
        description: `${row.display_text || '-'}${row.required_quantity ? ` x${row.required_quantity}` : ''}`.slice(0, 100),
        value: row.requirement_id
      }))
    );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🛠️ แก้ของที่ต้องส่ง · ${quest.quest_name}`)
        .setDescription('เลือก requirement ที่ต้องการแก้ไขจากรายการด้านล่าง')
    ],
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true
  });
}

async function showRewardEditor(interaction, questId) {
  const [quest, rewards] = await Promise.all([findQuestById(questId), findQuestRewards(questId)]);

  if (!rewards.length) {
    await interaction.reply({
      content: 'เควสนี้ยังไม่มี reward ให้แก้ไข ให้กดปุ่ม "เพิ่มรางวัล" ก่อน',
      ephemeral: true
    });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`quest:admin:select_reward_edit:${questId}`)
    .setPlaceholder('เลือกรางวัลที่ต้องการแก้')
    .addOptions(
      rewards.slice(0, 25).map((row) => ({
        label: `${row.reward_item_name || row.reward_type}`.slice(0, 100),
        description: `${row.reward_display_text || '-'}${row.reward_quantity ? ` x${row.reward_quantity}` : row.reward_value_number ? ` (${row.reward_value_number})` : ''}`.slice(0, 100),
        value: row.reward_id
      }))
    );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`🛠️ แก้รางวัล · ${quest.quest_name}`)
        .setDescription('เลือกรางวัลที่ต้องการแก้ไขจากรายการด้านล่าง')
    ],
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true
  });
}

async function openRequirementEditModal(interaction, requirementId) {
  const requirement = await queryOne(
    `SELECT * FROM public.tb_quest_master_requirement WHERE requirement_id = $1 LIMIT 1`,
    [requirementId]
  );
  if (!requirement) throw new Error('ไม่พบ requirement');

  const modal = new ModalBuilder()
    .setCustomId(`quest:admin:modal:edit_requirement:${requirementId}`)
    .setTitle('แก้ของที่ต้องส่ง');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('requirement_type')
        .setLabel('ประเภท requirement')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(requirement.requirement_type || 'SCUM_ITEM')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('item_name')
        .setLabel('ชื่อของ / requirement')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(requirement.item_name || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('required_quantity')
        .setLabel('จำนวนที่ต้องส่ง')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(requirement.required_quantity ? String(requirement.required_quantity) : '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('display_text')
        .setLabel('ข้อความที่ผู้เล่นเห็น')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(requirement.display_text || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('admin_display_text')
        .setLabel('ข้อความสำหรับแอดมิน')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(requirement.admin_display_text || '')
    )
  );

  await interaction.showModal(modal);
}

async function openRewardEditModal(interaction, rewardId) {
  const reward = await queryOne(
    `SELECT * FROM public.tb_quest_master_reward WHERE reward_id = $1 LIMIT 1`,
    [rewardId]
  );
  if (!reward) throw new Error('ไม่พบ reward');

  const modal = new ModalBuilder()
    .setCustomId(`quest:admin:modal:edit_reward:${rewardId}`)
    .setTitle('แก้รางวัล');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_type')
        .setLabel('ประเภทรางวัล')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(reward.reward_type || 'SCUM_ITEM')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_display_text')
        .setLabel('ข้อความแสดงรางวัล')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(reward.reward_display_text || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_item_name')
        .setLabel('ชื่อไอเท็ม / ชื่อรางวัล')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(reward.reward_item_name || '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_quantity')
        .setLabel('จำนวนรางวัล')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(reward.reward_quantity ? String(reward.reward_quantity) : '')
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('reward_value_number')
        .setLabel('ตัวเลขรางวัล (เงิน/FP)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(reward.reward_value_number ? String(reward.reward_value_number) : '')
    )
  );

  await interaction.showModal(modal);
}

function toNullableInt(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function toBool(value) {
  return ['1', 'true', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
}

async function handleAdminSelectMenu(interaction) {
  const { customId, values } = interaction;
  const selected = values[0];

  if (customId === 'quest:admin:select_profession') {
    await showLevelBrowse(interaction, selected);
    return;
  }

  if (customId.startsWith('quest:admin:select_level:')) {
    const professionId = customId.split(':')[4];
    await showQuestBrowse(interaction, professionId, Number(selected));
    return;
  }

  if (customId.startsWith('quest:admin:select_quest:')) {
    await showQuestDetail(interaction, selected);
    return;
  }

  if (customId.startsWith('quest:admin:select_requirement_edit:')) {
    await openRequirementEditModal(interaction, selected);
    return;
  }

  if (customId.startsWith('quest:admin:select_reward_edit:')) {
    await openRewardEditModal(interaction, selected);
  }
}

async function handleAdminModalSubmit(interaction) {
  const { customId } = interaction;

  if (customId === 'quest:admin:modal:create_quest') {
    const professionCode = interaction.fields.getTextInputValue('profession_code').trim().toUpperCase();
    const categoryCode = interaction.fields.getTextInputValue('category_code').trim().toUpperCase();
    const questCode = interaction.fields.getTextInputValue('quest_code').trim().toUpperCase();
    const questName = interaction.fields.getTextInputValue('quest_name').trim();
    const configText = interaction.fields.getTextInputValue('quest_config').trim();
    const parts = configText.split('|').map((x) => x.trim());

    const created = await createQuest({
      professionCode,
      categoryCode,
      questCode,
      questName,
      questLevel: Number(parts[0] || 1),
      isStepQuest: toBool(parts[1]),
      requiresTicket: toBool(parts[2]),
      isRepeatable: toBool(parts[3])
    }, interaction.user.tag);

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_CREATED',
      target: created.quest_id,
      meta: created
    });

    await interaction.reply({
      content: `✅ สร้างเควสใหม่เรียบร้อยแล้ว\n${created.quest_code} · ${created.quest_name}`,
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_description:')) {
    const questId = customId.split(':')[5];
    const result = await updateQuestDescription(questId, interaction.user.tag, {
      questName: interaction.fields.getTextInputValue('quest_name').trim(),
      questDescription: interaction.fields.getTextInputValue('quest_description').trim(),
      panelTitle: interaction.fields.getTextInputValue('panel_title').trim(),
      panelDescription: interaction.fields.getTextInputValue('panel_description').trim(),
      buttonLabel: interaction.fields.getTextInputValue('button_label').trim()
    });

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_DESCRIPTION_UPDATED',
      target: questId,
      meta: result
    });

    await interaction.reply({
      content: `✅ แก้คำอธิบายเควสเรียบร้อยแล้ว\nเควส: ${result.after.quest_name}`,
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:modal:add_requirement:')) {
    const questId = customId.split(':')[5];
    const created = await addRequirement(questId, {
      requirementType: interaction.fields.getTextInputValue('requirement_type').trim().toUpperCase(),
      itemName: interaction.fields.getTextInputValue('item_name').trim(),
      requiredQuantity: toNullableInt(interaction.fields.getTextInputValue('required_quantity')),
      displayText: interaction.fields.getTextInputValue('display_text').trim(),
      adminDisplayText: interaction.fields.getTextInputValue('admin_display_text').trim()
    });

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_REQUIREMENT_ADDED',
      target: created.requirement_id,
      meta: created
    });

    await interaction.reply({
      content: '✅ เพิ่มของที่ต้องส่งเรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_requirement:')) {
    const requirementId = customId.split(':')[5];
    const result = await updateRequirement(requirementId, {
      requirementType: interaction.fields.getTextInputValue('requirement_type').trim().toUpperCase(),
      itemName: interaction.fields.getTextInputValue('item_name').trim(),
      requiredQuantity: toNullableInt(interaction.fields.getTextInputValue('required_quantity')),
      displayText: interaction.fields.getTextInputValue('display_text').trim(),
      adminDisplayText: interaction.fields.getTextInputValue('admin_display_text').trim()
    });

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_REQUIREMENT_UPDATED',
      target: requirementId,
      meta: result
    });

    await interaction.reply({
      content: '✅ แก้ของที่ต้องส่งเรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:modal:add_reward:')) {
    const questId = customId.split(':')[5];
    const created = await addReward(questId, {
      rewardType: interaction.fields.getTextInputValue('reward_type').trim().toUpperCase(),
      rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
      rewardItemName: interaction.fields.getTextInputValue('reward_item_name').trim(),
      rewardQuantity: toNullableInt(interaction.fields.getTextInputValue('reward_quantity')),
      rewardValueNumber: toNullableInt(interaction.fields.getTextInputValue('reward_value_number')),
      discordRoleName: null
    });

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_REWARD_ADDED',
      target: created.reward_id,
      meta: created
    });

    await interaction.reply({
      content: '✅ เพิ่มรางวัลเรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_reward:')) {
    const rewardId = customId.split(':')[5];
    const result = await updateReward(rewardId, {
      rewardType: interaction.fields.getTextInputValue('reward_type').trim().toUpperCase(),
      rewardDisplayText: interaction.fields.getTextInputValue('reward_display_text').trim(),
      rewardItemName: interaction.fields.getTextInputValue('reward_item_name').trim(),
      rewardQuantity: toNullableInt(interaction.fields.getTextInputValue('reward_quantity')),
      rewardValueNumber: toNullableInt(interaction.fields.getTextInputValue('reward_value_number')),
      discordRoleName: null
    });

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_REWARD_UPDATED',
      target: rewardId,
      meta: result
    });

    await interaction.reply({
      content: '✅ แก้รางวัลเรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:modal:edit_dependency:')) {
    const questId = customId.split(':')[5];
    const result = await replaceDependency(questId, {
      dependencyType: interaction.fields.getTextInputValue('dependency_type').trim().toUpperCase(),
      requiredQuestCode: interaction.fields.getTextInputValue('required_quest_code').trim().toUpperCase(),
      requiredLevel: toNullableInt(interaction.fields.getTextInputValue('required_level')),
      requiredRoleId: interaction.fields.getTextInputValue('required_role_id').trim(),
      requiredRoleName: interaction.fields.getTextInputValue('required_role_name').trim()
    });

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_DEPENDENCY_UPDATED',
      target: questId,
      meta: result
    });

    await interaction.reply({
      content: '✅ แก้ Dependency เรียบร้อยแล้ว',
      ephemeral: true
    });
    return;
  }

  if (customId.startsWith('quest:admin:modal:add_image:')) {
    const questId = customId.split(':')[5];
    const created = await addImage(questId, {
      mediaUrl: interaction.fields.getTextInputValue('media_url').trim(),
      mediaTitle: interaction.fields.getTextInputValue('media_title').trim(),
      mediaDescription: interaction.fields.getTextInputValue('media_description').trim(),
      displayOrder: toNullableInt(interaction.fields.getTextInputValue('display_order'))
    });

    await insertAuditLog({
      actorId: interaction.user.id,
      actorTag: interaction.user.tag,
      action: 'QUEST_MEDIA_ADDED',
      target: created.media_id,
      meta: created
    });

    await interaction.reply({
      content: '✅ เพิ่มรูปตัวอย่างเรียบร้อยแล้ว',
      ephemeral: true
    });
  }
}

module.exports = {
  refreshAdminPanel,
  renderAdminHome,
  showPanelManagement,
  showMasterHome,
  showProfessionBrowse,
  showLevelBrowse,
  showQuestBrowse,
  showQuestDetail,
  showRequirements,
  showRewards,
  showDependencies,
  showImages,
  showSteps,
  showPanelStatus,
  openCreateQuestModal,
  openEditDescriptionModal,
  openAddRequirementModal,
  openAddRewardModal,
  openAddImageModal,
  openEditDependencyModal,
  showRequirementEditor,
  showRewardEditor,
  handleAdminSelectMenu,
  handleAdminModalSubmit,
  toggleQuestActive,
  insertAuditLog
};
