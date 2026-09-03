-- =====================================================================
-- REFACTOR CRÍTICO — Módulo 1: Staff Gymkana
-- De "calificación independiente por equipo" a "rutas emparejadas +
-- bloqueo por primera inserción" (mismo espíritu que partidos_torneo).
--
-- CÓMO EJECUTAR:
--   Supabase Dashboard -> SQL Editor -> pegar y correr completo.
--   (No se aplicó automáticamente: solo tenemos la anon key del proyecto,
--   no una conexión con privilegios de servicio, así que este archivo
--   se entrega para que lo corras tú manualmente.)
--
-- ⚠️  PASO PREVIO OBLIGATORIO — LÉEME:
--   `puntuaciones_gymkana` casi seguro es usada por la vista
--   `marcador_general` (columna total_gymkana) y por la función
--   `reiniciar_evento()`. El DROP TABLE ... CASCADE de más abajo
--   eliminará automáticamente cualquier vista/función que dependa de
--   esta tabla. Antes de correr este script, ejecuta esto y GUARDA el
--   resultado (por si necesitas comparar con lo que reconstruyo abajo):
--
--     select pg_get_viewdef('public.marcador_general', true);
--     select pg_get_functiondef('public.reiniciar_evento'::regproc);
--
--   Abajo reconstruyo `marcador_general` asumiendo la convención de
--   puntos gano=3 / empate=1 / perdio=0 (igual a como se ve el resto
--   de la app). Si tu versión anterior usaba otros valores u otras
--   reglas para total_torneo / total_tesoro / total_ajustes, AJUSTA
--   esas partes con lo que obtuviste arriba antes de dar por bueno
--   el marcador general.
-- =====================================================================

begin;

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- 1. Tabla de rutas y emparejamiento (persistente, una fila por equipo)
-- ---------------------------------------------------------------------
create table if not exists public.rutas_gymkana (
  id           uuid primary key default gen_random_uuid(),
  equipo_id    uuid not null references public.equipos(id) on delete cascade,
  rival_id     uuid not null references public.equipos(id) on delete cascade,
  pareja_num   smallint not null check (pareja_num in (1, 2)),
  orden_bases  smallint[] not null,
  creado_en    timestamptz not null default now(),
  unique (equipo_id),
  check (equipo_id <> rival_id)
);

comment on table public.rutas_gymkana is
  'Emparejamiento fijo (pareja_num) y recorrido de bases (orden_bases) '
  'de cada equipo para toda la Gymkana. Se genera una sola vez con '
  'guardar_rutas_gymkana().';

-- ---------------------------------------------------------------------
-- 2. Rediseño de puntuaciones_gymkana: de "1 fila por equipo" a
--    "1 fila por enfrentamiento (pareja x base)", igual que
--    partidos_torneo (equipo_a_id / equipo_b_id / resultado_a / resultado_b).
--
--    ⚠️ Esto reemplaza la tabla anterior. Si el evento ya tiene datos
--    reales cargados, expórtalos antes de continuar.
-- ---------------------------------------------------------------------
drop table if exists public.puntuaciones_gymkana cascade;

create table public.puntuaciones_gymkana (
  id                 uuid primary key default gen_random_uuid(),
  base_id            smallint not null check (base_id between 1 and 6),
  equipo_a_id        uuid not null references public.equipos(id) on delete cascade,
  equipo_b_id        uuid not null references public.equipos(id) on delete cascade,
  resultado_a        text check (resultado_a in ('gano', 'empato', 'perdio')),
  resultado_b        text check (resultado_b in ('gano', 'empato', 'perdio')),
  finalizado         boolean not null default false,
  requiere_auditoria boolean not null default false,
  registrado_por     uuid references public.perfiles(id),
  fecha              timestamptz not null default now(),
  actualizado_en      timestamptz not null default now(),
  unique (base_id, equipo_a_id, equipo_b_id),
  check (equipo_a_id <> equipo_b_id)
);

comment on column public.puntuaciones_gymkana.requiere_auditoria is
  'Bandera de "Reportar Error/Alerta" del Staff: dispara la notificación '
  'en el Panel de Admin para que revise y, si hace falta, sobrescriba.';

create index if not exists idx_puntuaciones_gymkana_equipo_a on public.puntuaciones_gymkana (equipo_a_id);
create index if not exists idx_puntuaciones_gymkana_equipo_b on public.puntuaciones_gymkana (equipo_b_id);
create index if not exists idx_puntuaciones_gymkana_auditoria on public.puntuaciones_gymkana (requiere_auditoria) where requiere_auditoria;

-- Realtime: al recrear la tabla hay que volver a publicarla.
alter publication supabase_realtime add table public.puntuaciones_gymkana;
alter publication supabase_realtime add table public.rutas_gymkana;

-- ---------------------------------------------------------------------
-- 3. RLS
--    Lectura abierta (igual que hoy: equipos/marcador_general se leen
--    sin sesión desde /visor). Toda escritura pasa por las funciones
--    de abajo (security definer) — no se exponen policies de UPDATE
--    directas para que nadie pueda mandar resultado_a/resultado_b
--    arbitrarios desde el cliente.
-- ---------------------------------------------------------------------
alter table public.rutas_gymkana enable row level security;
alter table public.puntuaciones_gymkana enable row level security;

drop policy if exists "rutas_gymkana_select_publico" on public.rutas_gymkana;
create policy "rutas_gymkana_select_publico"
  on public.rutas_gymkana for select
  using (true);

drop policy if exists "puntuaciones_gymkana_select_publico" on public.puntuaciones_gymkana;
create policy "puntuaciones_gymkana_select_publico"
  on public.puntuaciones_gymkana for select
  using (true);

-- Nota: no hay policies de insert/update/delete a propósito. Las
-- funciones RPC de abajo son SECURITY DEFINER y hacen sus propias
-- validaciones de rol, por lo que no necesitan (ni deben depender de)
-- una policy de escritura abierta.

-- ---------------------------------------------------------------------
-- 4. Funciones auxiliares y RPCs
-- ---------------------------------------------------------------------

create or replace function public._resultado_inverso(p_resultado text)
returns text
language sql
immutable
as $$
  select case p_resultado
    when 'gano' then 'perdio'
    when 'perdio' then 'gano'
    else 'empato'
  end;
$$;

-- 4.1 Generar y guardar el emparejamiento (llamada UNA vez desde el
--     Admin). El sorteo en sí se hace en React (ver adminService.js);
--     esta función solo persiste el resultado de forma atómica.
create or replace function public.guardar_rutas_gymkana(p_pares jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_es_admin  boolean;
  v_par       jsonb;
  v_equipo_a  uuid;
  v_equipo_b  uuid;
  v_pareja    smallint;
  v_orden     smallint[];
  v_base      smallint;
begin
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol = 'admin'
  ) into v_es_admin;

  if not v_es_admin then
    raise exception 'Solo el Admin puede iniciar la Gymkana';
  end if;

  if exists (select 1 from public.rutas_gymkana) then
    raise exception 'La Gymkana ya fue iniciada. Reinicia el evento antes de generar rutas nuevas.';
  end if;

  for v_par in select * from jsonb_array_elements(p_pares)
  loop
    v_pareja   := (v_par ->> 'pareja_num')::smallint;
    v_equipo_a := (v_par -> 'equipos' ->> 0)::uuid;
    v_equipo_b := (v_par -> 'equipos' ->> 1)::uuid;

    select array_agg(value::smallint order by ordinality)
      into v_orden
      from jsonb_array_elements_text(v_par -> 'orden_bases') with ordinality;

    insert into public.rutas_gymkana (equipo_id, rival_id, pareja_num, orden_bases)
    values
      (v_equipo_a, v_equipo_b, v_pareja, v_orden),
      (v_equipo_b, v_equipo_a, v_pareja, v_orden);

    foreach v_base in array v_orden loop
      insert into public.puntuaciones_gymkana (base_id, equipo_a_id, equipo_b_id)
      values (v_base, v_equipo_a, v_equipo_b);
    end loop;
  end loop;
end;
$$;

revoke all on function public.guardar_rutas_gymkana(jsonb) from public;
grant execute on function public.guardar_rutas_gymkana(jsonb) to authenticated;

-- 4.2 Sellar resultado: "el primero que guarda, sella para ambos".
create or replace function public.sellar_resultado_gymkana(
  p_partido_id uuid,
  p_equipo_id  uuid,
  p_resultado  text
)
returns table(ok boolean, mensaje text, ya_bloqueado boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.puntuaciones_gymkana%rowtype;
begin
  if p_resultado not in ('gano', 'empato', 'perdio') then
    raise exception 'Resultado inválido: %', p_resultado;
  end if;

  select * into v_row
  from public.puntuaciones_gymkana
  where id = p_partido_id
  for update; -- fila bloqueada hasta el commit: garantiza el "first-to-mark"

  if not found then
    raise exception 'No existe ese enfrentamiento de Gymkana';
  end if;

  if v_row.finalizado then
    return query select false, 'Este enfrentamiento ya fue calificado por el otro equipo.', true;
    return;
  end if;

  if p_equipo_id = v_row.equipo_a_id then
    update public.puntuaciones_gymkana
      set resultado_a = p_resultado,
          resultado_b = public._resultado_inverso(p_resultado),
          finalizado = true,
          registrado_por = auth.uid(),
          actualizado_en = now()
      where id = p_partido_id;
  elsif p_equipo_id = v_row.equipo_b_id then
    update public.puntuaciones_gymkana
      set resultado_b = p_resultado,
          resultado_a = public._resultado_inverso(p_resultado),
          finalizado = true,
          registrado_por = auth.uid(),
          actualizado_en = now()
      where id = p_partido_id;
  else
    raise exception 'Ese equipo no participa en este enfrentamiento';
  end if;

  return query select true, 'Resultado registrado y sellado para ambos equipos.', false;
end;
$$;

revoke all on function public.sellar_resultado_gymkana(uuid, uuid, text) from public;
grant execute on function public.sellar_resultado_gymkana(uuid, uuid, text) to authenticated;

-- 4.3 Reportar error/alerta (solo sobre una base ya sellada).
create or replace function public.reportar_alerta_gymkana(p_partido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.puntuaciones_gymkana
    set requiere_auditoria = true
    where id = p_partido_id
      and finalizado = true;

  if not found then
    raise exception 'Solo se puede reportar una alerta sobre una base ya calificada.';
  end if;
end;
$$;

revoke all on function public.reportar_alerta_gymkana(uuid) from public;
grant execute on function public.reportar_alerta_gymkana(uuid) to authenticated;

-- 4.4 Admin: sobrescribir el resultado de una base en auditoría.
create or replace function public.sobrescribir_resultado_gymkana(
  p_partido_id  uuid,
  p_resultado_a text,
  p_resultado_b text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_es_admin boolean;
begin
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol = 'admin'
  ) into v_es_admin;

  if not v_es_admin then
    raise exception 'Solo el Admin puede sobrescribir un resultado';
  end if;

  if p_resultado_a not in ('gano', 'empato', 'perdio')
     or p_resultado_b not in ('gano', 'empato', 'perdio') then
    raise exception 'Resultado inválido';
  end if;

  update public.puntuaciones_gymkana
    set resultado_a = p_resultado_a,
        resultado_b = p_resultado_b,
        finalizado = true,
        requiere_auditoria = false,
        registrado_por = auth.uid(),
        actualizado_en = now()
    where id = p_partido_id;

  if not found then
    raise exception 'No existe ese enfrentamiento de Gymkana';
  end if;
end;
$$;

revoke all on function public.sobrescribir_resultado_gymkana(uuid, text, text) from public;
grant execute on function public.sobrescribir_resultado_gymkana(uuid, text, text) to authenticated;

-- 4.5 Funciones viejas del modelo anterior (llegada libre / auto-calificación
--     independiente). Ya no aplican con rutas emparejadas.
drop function if exists public.marcar_llegada_gymkana(uuid, integer);
drop function if exists public.registrar_evaluacion_gymkana(uuid, integer, text);

-- ---------------------------------------------------------------------
-- 5. marcador_general — reconstrucción de total_gymkana.
--    ⚠️ AJUSTA total_torneo / total_tesoro / total_ajustes si tu
--    definición original (ver pg_get_viewdef del paso previo) no
--    coincide exactamente con lo de abajo.
-- ---------------------------------------------------------------------
create or replace view public.marcador_general as
with puntos_gymkana as (
  select equipo_id, sum(pts) as total_gymkana
  from (
    select equipo_a_id as equipo_id,
           case resultado_a when 'gano' then 3 when 'empato' then 1 else 0 end as pts
    from public.puntuaciones_gymkana
    where finalizado
    union all
    select equipo_b_id as equipo_id,
           case resultado_b when 'gano' then 3 when 'empato' then 1 else 0 end as pts
    from public.puntuaciones_gymkana
    where finalizado
  ) t
  group by equipo_id
),
puntos_torneo as (
  select equipo_id, sum(pts) as total_torneo
  from (
    select equipo_a_id as equipo_id,
           case resultado_a when 'gano' then 3 when 'empato' then 1 else 0 end as pts
    from public.partidos_torneo
    where finalizado
    union all
    select equipo_b_id as equipo_id,
           case resultado_b when 'gano' then 3 when 'empato' then 1 else 0 end as pts
    from public.partidos_torneo
    where finalizado
  ) t
  group by equipo_id
),
puntos_tesoro as (
  select equipo_id, sum(puntos_evaluacion) as total_tesoro
  from public.puntuaciones_tesoro
  where puntos_evaluacion is not null
  group by equipo_id
),
puntos_ajustes as (
  select equipo_id, sum(puntos_extra) as total_ajustes
  from public.ajustes_admin
  group by equipo_id
)
select
  e.id as equipo_id,
  e.nombre,
  e.color_hex,
  coalesce(g.total_gymkana, 0) as total_gymkana,
  coalesce(t.total_tesoro, 0) as total_tesoro,
  coalesce(o.total_torneo, 0) as total_torneo,
  coalesce(a.total_ajustes, 0) as total_ajustes,
  coalesce(g.total_gymkana, 0) + coalesce(t.total_tesoro, 0)
    + coalesce(o.total_torneo, 0) + coalesce(a.total_ajustes, 0) as puntos_generales
from public.equipos e
left join puntos_gymkana g on g.equipo_id = e.id
left join puntos_torneo o on o.equipo_id = e.id
left join puntos_tesoro t on t.equipo_id = e.id
left join puntos_ajustes a on a.equipo_id = e.id;

-- ---------------------------------------------------------------------
-- 6. reiniciar_evento()
--    ⚠️ No tenemos el cuerpo original (probablemente ya borraba
--    puntuaciones_gymkana y partidos_torneo). Agrega manualmente esta
--    línea dentro de esa función para que también limpie las rutas:
--
--      delete from public.rutas_gymkana;
--
--    (el `delete from public.puntuaciones_gymkana;` que ya exista sigue
--    funcionando igual, solo cambió la forma de las columnas).
-- ---------------------------------------------------------------------

commit;
