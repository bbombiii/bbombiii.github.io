-- Sala Personal de Samuel - esquema Supabase
create table if not exists tasks(id uuid primary key default gen_random_uuid(), title text not null, area text not null default 'personal', done boolean not null default false, created_at timestamptz not null default now());
create table if not exists notes(id uuid primary key default gen_random_uuid(), title text default '', body text default '', tags text default '', updated_at timestamptz not null default now());
create table if not exists topics(id uuid primary key default gen_random_uuid(), module text not null, title text not null, url text, done boolean not null default false, ord int not null default 0);
create table if not exists lessons(id uuid primary key default gen_random_uuid(), lang text not null, day int not null, title text not null, body text default '', quiz jsonb default '[]', video_url text);
create table if not exists quiz_results(id uuid primary key default gen_random_uuid(), lesson_id uuid references lessons(id) on delete cascade, score int not null, total int not null, created_at timestamptz not null default now());
create table if not exists resources(id uuid primary key default gen_random_uuid(), section text not null, title text not null, url text not null, note text default '', ord int not null default 0);

alter table tasks enable row level security;
alter table notes enable row level security;
alter table topics enable row level security;
alter table lessons enable row level security;
alter table quiz_results enable row level security;
alter table resources enable row level security;

create policy "solo samuel" on tasks for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
create policy "solo samuel" on notes for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
create policy "solo samuel" on topics for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
create policy "solo samuel" on lessons for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
create policy "solo samuel" on quiz_results for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
create policy "solo samuel" on resources for all using ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com')) with check ((auth.jwt()->>'email') in ('samuelvillamancueto18@gmail.com','samuelvillamancueto@gmail.com'));
