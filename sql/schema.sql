-- SANDRA TEXTILES S.R.L. - SUPABASE
-- Ejecutar en SQL Editor si necesitas recrear tablas.

create table if not exists trabajadores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  nombre text not null,
  area text,
  estado text default 'Activo'
);

create table if not exists asistencia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  trabajador_id uuid references trabajadores(id),
  trabajador_nombre text not null,
  area text,
  tipo_registro text not null,
  estado text not null,
  observacion text,
  foto_url text,
  fecha date not null,
  hora text not null
);

alter table trabajadores disable row level security;
alter table asistencia disable row level security;
