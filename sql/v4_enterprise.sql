-- SANDRA TEXTILES V4 ENTERPRISE
-- Ejecutar solo si aún no tienes los campos de Personal.

alter table trabajadores add column if not exists ci text;
alter table trabajadores add column if not exists cargo text;
alter table trabajadores add column if not exists telefono text;
alter table trabajadores add column if not exists fecha_ingreso date;
alter table trabajadores add column if not exists direccion text;
