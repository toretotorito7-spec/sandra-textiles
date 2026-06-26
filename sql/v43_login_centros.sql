-- SANDRA TEXTILES V4.3 - LOGIN, PERFILES Y CENTROS

alter table trabajadores add column if not exists centro_trabajo text default 'Fábrica Santa Cruz';
alter table trabajadores add column if not exists sueldo_mensual numeric default 0;

update trabajadores
set centro_trabajo = 'Fábrica Santa Cruz'
where centro_trabajo is null or centro_trabajo = '';

create table if not exists perfiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid not null,
  email text not null,
  nombre text,
  rol text not null,
  centro_trabajo text not null default 'Fábrica Santa Cruz'
);

alter table perfiles disable row level security;

-- Crear primero los usuarios en Supabase > Authentication > Users.
-- Luego ejecuta este bloque cambiando los correos por los tuyos.

-- Administrador: ve todo
insert into perfiles (user_id, email, nombre, rol, centro_trabajo)
select id, email, 'Administrador', 'Administrador', 'Todos'
from auth.users
where email = 'CAMBIAR_ADMIN_CORREO'
on conflict do nothing;

-- Encargado Fábrica Santa Cruz
insert into perfiles (user_id, email, nombre, rol, centro_trabajo)
select id, email, 'Encargado Fábrica Santa Cruz', 'Encargado', 'Fábrica Santa Cruz'
from auth.users
where email = 'CAMBIAR_FABRICA_CORREO'
on conflict do nothing;

-- Encargado Confecciones
insert into perfiles (user_id, email, nombre, rol, centro_trabajo)
select id, email, 'Encargado Confecciones', 'Encargado', 'Confecciones'
from auth.users
where email = 'CAMBIAR_CONFECCIONES_CORREO'
on conflict do nothing;
