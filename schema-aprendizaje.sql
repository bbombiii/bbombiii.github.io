-- V1.0.2: progreso por pregunta en tests + eventos ocultos de agenda (solo visualizacion Sala)
create table if not exists test_question_state(
  question_id bigint primary key references test_questions(id) on delete cascade,
  bank text not null,
  seen int not null default 0,
  ok int not null default 0,
  fail int not null default 0,
  last_correct boolean,
  updated_at timestamptz not null default now()
);

create index if not exists test_question_state_bank_idx on test_question_state(bank);

alter table test_question_state enable row level security;

create policy "solo samuel" on test_question_state for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));

create table if not exists agenda_hidden(
  event_key text primary key,     -- '<calendarId>|<eventId>' tal cual llega de Google
  title text not null default '',
  created_at timestamptz not null default now()
);

alter table agenda_hidden enable row level security;

create policy "solo samuel" on agenda_hidden for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));

create table if not exists agenda_cal_hidden(
  calendar_id text primary key,
  name text not null default '',
  created_at timestamptz not null default now()
);

alter table agenda_cal_hidden enable row level security;

create policy "solo samuel" on agenda_cal_hidden for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
