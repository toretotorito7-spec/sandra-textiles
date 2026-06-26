-- SANDRA TEXTILES V4.2 - CENTROS DE TRABAJO

alter table trabajadores add column if not exists centro_trabajo text default 'Fábrica Santa Cruz';

update trabajadores
set centro_trabajo = 'Fábrica Santa Cruz'
where centro_trabajo is null or centro_trabajo = '';

-- Valores usados por el sistema:
-- Fábrica Santa Cruz
-- Confecciones
