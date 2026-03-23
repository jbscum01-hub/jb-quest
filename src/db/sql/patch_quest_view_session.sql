CREATE TABLE IF NOT EXISTS public.tb_quest_view_session (
  session_id BIGSERIAL PRIMARY KEY,
  discord_user_id TEXT NOT NULL,
  profession_code TEXT NOT NULL,
  application_id TEXT NOT NULL,
  interaction_token TEXT NOT NULL,
  reply_kind TEXT NOT NULL DEFAULT 'ORIGINAL',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ NULL,
  close_error TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_tb_quest_view_session_status_exp
ON public.tb_quest_view_session (status, expires_at);

CREATE INDEX IF NOT EXISTS idx_tb_quest_view_session_user_prof_created
ON public.tb_quest_view_session (discord_user_id, profession_code, created_at DESC);
