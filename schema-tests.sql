-- Sala Personal de Samuel - modulo Tests SMR (2026-11-18)
-- Bancos de preguntas de sus PDF de estudio, intentos y respuestas por pregunta.
-- Misma regla que el resto de la app: solo el usuario de Samuel (RLS por email).

create table if not exists test_questions(
  id bigint generated always as identity primary key,
  bank text not null,           -- 'SOR RA1', 'Servicios RA7', 'IPE II RA3'...
  subject text not null,        -- 'SOR' | 'Servicios' | 'IPE II'
  ord int not null,             -- 1..100 dentro del banco
  qid text not null,            -- ID de la pregunta en el PDF (procedencia)
  question text not null,
  options jsonb not null,       -- ["A", "B", "C", "D"]
  correct int not null,         -- indice 0..3 de la opcion correcta
  explanation text not null default '',
  complementary boolean not null default false,  -- true solo en Servicios RA7
  created_at timestamptz not null default now(),
  unique(bank, ord)
);

create table if not exists test_attempts(
  id bigint generated always as identity primary key,
  bank text not null,
  total int not null,           -- preguntas respondidas en el intento
  score int not null,           -- aciertos
  created_at timestamptz not null default now()
);

create table if not exists test_answers(
  id bigint generated always as identity primary key,
  attempt_id bigint not null references test_attempts(id) on delete cascade,
  question_id bigint not null references test_questions(id) on delete cascade,
  chosen int,                   -- opcion marcada (0..3)
  correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists test_questions_bank_idx on test_questions(bank);
create index if not exists test_answers_attempt_idx on test_answers(attempt_id);
create index if not exists test_answers_question_idx on test_answers(question_id);
create index if not exists test_attempts_bank_idx on test_attempts(bank);

alter table test_questions enable row level security;
alter table test_attempts enable row level security;
alter table test_answers enable row level security;

create policy "solo samuel" on test_questions for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
create policy "solo samuel" on test_attempts for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
create policy "solo samuel" on test_answers for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
