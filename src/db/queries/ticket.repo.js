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
