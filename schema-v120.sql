-- Sala personal - V1.2.0: repaso espaciado (SRS) en tests y kana
-- streak: aciertos seguidos; due: fecha en la que toca repasar (1, 3, 7, 16 o 35 dias segun racha; fallo -> manana)
alter table public.test_question_state add column if not exists streak integer not null default 0;
alter table public.test_question_state add column if not exists due date;
alter table public.kana_stats add column if not exists streak integer not null default 0;
alter table public.kana_stats add column if not exists due date;

-- Resumen del tema tras cada test: la app deja la fila en 'pendiente' al corregir
-- y el asistente del propietario la completa (estado 'lista' + body en HTML).
create table if not exists test_summaries(
  id bigint generated always as identity primary key,
  attempt_id bigint references test_attempts(id) on delete cascade,
  bank text not null,
  estado text not null default 'pendiente',
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table test_summaries enable row level security;
create policy "solo samuel" on test_summaries for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
