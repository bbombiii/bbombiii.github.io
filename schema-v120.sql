-- Sala personal - V1.2.0: repaso espaciado (SRS) en tests y kana
-- streak: aciertos seguidos; due: fecha en la que toca repasar (1, 3, 7, 16 o 35 dias segun racha; fallo -> manana)
alter table public.test_question_state add column if not exists streak integer not null default 0;
alter table public.test_question_state add column if not exists due date;
alter table public.kana_stats add column if not exists streak integer not null default 0;
alter table public.kana_stats add column if not exists due date;
