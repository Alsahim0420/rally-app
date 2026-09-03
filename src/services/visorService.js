import { supabase } from './supabaseClient';

export async function obtenerMarcadorGeneral() {
  const { data, error } = await supabase
    .from('marcador_general')
    .select('*')
    .order('puntos_generales', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Devuelve, por equipo, el registro de llegada más reciente entre
 * Gymkana y Tesoro — es decir, "en qué base está" cada equipo ahora mismo.
 */
export async function obtenerUbicaciones() {
  const [gymkana, tesoro] = await Promise.all([
    supabase.from('puntuaciones_gymkana').select('equipo_id, base_id, fecha'),
    supabase.from('puntuaciones_tesoro').select('equipo_id, base_id, fecha'),
  ]);

  if (gymkana.error) throw gymkana.error;
  if (tesoro.error) throw tesoro.error;

  const registros = [
    ...gymkana.data.map((r) => ({ ...r, modulo: 'Gymkana' })),
    ...tesoro.data.map((r) => ({ ...r, modulo: 'Tesoro' })),
  ];

  const ultimaPorEquipo = {};
  for (const r of registros) {
    const actual = ultimaPorEquipo[r.equipo_id];
    if (!actual || new Date(r.fecha) > new Date(actual.fecha)) {
      ultimaPorEquipo[r.equipo_id] = r;
    }
  }
  return ultimaPorEquipo;
}

export function suscribirseVisor(onChange) {
  const channel = supabase
    .channel('visor-general')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_gymkana' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'puntuaciones_tesoro' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'partidos_torneo' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ajustes_admin' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
