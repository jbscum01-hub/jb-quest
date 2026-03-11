const { getPool } = require('../pool');

async function createTicket({
  playerId,
  professionId,
  questId,
  ticketChannelId,
  createdBy
}) {
  const result = await getPool().query(
    `
    INSERT INTO public.tb_quest_ticket
    (
      player_id,
      profession_id,
      quest_id,
      ticket_channel_id,
      ticket_status,
      created_by
    )
    VALUES ($1,$2,$3,$4,'OPEN',$5)
    RETURNING *
    `,
    [
      playerId,
      professionId,
      questId,
      ticketChannelId,
      createdBy
    ]
  );

  return result.rows[0];
}

async function updateTicketStatus(ticketId, status) {
  const result = await getPool().query(
    `
    UPDATE public.tb_quest_ticket
    SET ticket_status = $2,
        updated_at = NOW()
    WHERE ticket_id = $1
    RETURNING *
    `,
    [ticketId, status]
  );

  return result.rows[0];
}

async function findTicketByChannel(channelId) {
  const result = await getPool().query(
    `
    SELECT *
    FROM public.tb_quest_ticket
    WHERE ticket_channel_id = $1
    LIMIT 1
    `,
    [channelId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createTicket,
  updateTicketStatus,
  findTicketByChannel
};
