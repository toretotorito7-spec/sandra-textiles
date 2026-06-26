-- SANDRA TEXTILES V4.1.5 - PLANILLA MENSUAL Y FERIADOS
alter table trabajadores add column if not exists sueldo_mensual numeric default 0;

create table if not exists feriados (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  fecha date not null,
  nombre text not null
);

alter table feriados disable row level security;
