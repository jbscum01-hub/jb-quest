const { getPool } = require('../pool');

function getDb(client) {
  return client || getPool();
}

async function createTicket({
  ticketCode,
  playerId,
  professionId,
  questId,
  discordChannelId
}, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    INSERT INTO public.tb_quest_ticket
    (
      ticket_code,
      player_id,
      profession_id,
      quest_id,
      discord_channel_id,
      ticket_status
    )
    VALUES ($1, $2, $3, $4, $5, 'OPEN')
    RETURNING *
    `,
    [ticketCode, playerId, professionId, questId, discordChannelId]
  );

  return result.rows[0];
}

async function updateTicketStatus(ticketId, status, closeInfo = {}, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    UPDATE public.tb_quest_ticket
    SET ticket_status = $2::varchar(30),
        closed_at = CASE
          WHEN $2::varchar(30) IN ('COMPLETED', 'CANCELLED', 'CLOSED')
          THEN NOW()
          ELSE closed_at
        END,
        closed_by = COALESCE($3::varchar(100), closed_by),
        close_remark = COALESCE($4::varchar(1000), close_remark),
        updated_at = NOW()
    WHERE ticket_id = $1
    RETURNING *
    `,
    [
      ticketId,
      status,
      closeInfo.closedBy || null,
      closeInfo.closeRemark || null
    ]
  );

  return result.rows[0] || null;
}

async function findTicketByChannel(channelId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT t.*,
           q.quest_name,
           q.quest_level,
           q.quest_code,
           q.is_step_quest,
           q.requires_ticket,
           p.profession_code,
           p.profession_name_th,
           pp.discord_user_id,
           pp.discord_username,
           pp.discord_display_name,
           pp.ingame_name
    FROM public.tb_quest_ticket t
    JOIN public.tb_quest_master q ON t.quest_id = q.quest_id
    LEFT JOIN public.tb_quest_master_profession p ON t.profession_id = p.profession_id
    JOIN public.tb_quest_player_profile pp ON t.player_id = pp.player_id
    WHERE t.discord_channel_id = $1
    LIMIT 1
    `,
    [channelId]
  );

  return result.rows[0] || null;
}

async function findTicketById(ticketId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT t.*,
           q.quest_name,
           q.quest_level,
           q.quest_code,
           q.is_step_quest,
           q.requires_ticket,
           p.profession_code,
           p.profession_name_th,
           pp.discord_user_id,
           pp.discord_username,
           pp.discord_display_name,
           pp.ingame_name
    FROM public.tb_quest_ticket t
    JOIN public.tb_quest_master q ON t.quest_id = q.quest_id
    LEFT JOIN public.tb_quest_master_profession p ON t.profession_id = p.profession_id
    JOIN public.tb_quest_player_profile pp ON t.player_id = pp.player_id
    WHERE t.ticket_id = $1
    LIMIT 1
    `,
    [ticketId]
  );

  return result.rows[0] || null;
}

async function findOpenTicketByPlayerQuest(playerId, questId, client) {
  const db = getDb(client);

  const result = await db.query(
    `
    SELECT *
    FROM public.tb_quest_ticket
    WHERE player_id = $1
      AND quest_id = $2
      AND ticket_status IN ('OPEN', 'IN_PROGRESS', 'WAITING_PLAYER', 'WAITING_ADMIN')
    ORDER BY opened_at DESC
    LIMIT 1
    `,
    [playerId, questId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createTicket,
  updateTicketStatus,
  findTicketByChannel,
  findTicketById,
  findOpenTicketByPlayerQuest
};
