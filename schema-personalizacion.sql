-- Apartado Personalizacion (V1.0.1): peticiones de personalizacion por usuario
create table if not exists personalizacion(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('prompt','imagen')),
  texto text,
  imagen_path text,
  activa boolean not null default false,
  estado text not null default 'pendiente' check (estado in ('pendiente','en_proceso','aplicada','descartada')),
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table personalizacion enable row level security;
create policy "propia" on personalizacion for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- bucket privado para imagenes de referencia (carpeta por usuario)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('personalizacion','personalizacion', false, 5242880,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

create policy "pers_up" on storage.objects for insert
  with check (bucket_id = 'personalizacion' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pers_read" on storage.objects for select
  using (bucket_id = 'personalizacion' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pers_del" on storage.objects for delete
  using (bucket_id = 'personalizacion' and (storage.foldername(name))[1] = auth.uid()::text);
