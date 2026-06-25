-- SANDRA TEXTILES V3 - PERSONAL
-- Ejecuta esto en Supabase SQL Editor para agregar campos del módulo Personal.
-- No borra datos existentes.

alter table trabajadores add column if not exists ci text;
alter table trabajadores add column if not exists cargo text;
alter table trabajadores add column if not exists telefono text;
alter table trabajadores add column if not exists fecha_ingreso date;
alter table trabajadores add column if not exists direccion text;
