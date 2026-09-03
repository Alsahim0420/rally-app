import { supabase } from './supabaseClient';

export const BASES_GYMKANA = [1, 2, 3, 4, 5, 6];

export async function obtenerPuntuacionesGymkana(equipoId) {
  const { data, error } = await supabase
    .from('puntuaciones_gymkana')
    .select('*')
    .eq('equipo_id', equipoId);

  if (error) throw error;
  return data;
}

export async function marcarLlegadaGymkana(equipoId, baseId) {
  const { data, error } = await supabase.rpc('marcar_llegada_gymkana', {
    p_equipo_id: equipoId,
    p_base_id: baseId,
  });
  if (error) throw error;
  return data?.[0];
}

export async function evaluarBaseGymkana(equipoId, baseId, resultado) {
  const { data, error } = await supabase.rpc('registrar_evaluacion_gymkana', {
    p_equipo_id: equipoId,
    p_base_id: baseId,
    p_resultado: resultado,
  });
  if (error) throw error;
  return data?.[0];
}

/**
 * Se suscribe a cambios en tiempo real de las puntuaciones de un equipo,
 * para que si otro animador registra algo, la pantalla se actualice sola
 * en vez de dejar al staff trabajando con datos viejos.
 */
export function suscribirseGymkana(equipoId, onChange) {
  const channel = supabase
    .channel(`gymkana-${equipoId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'puntuaciones_gymkana',
        filter: `equipo_id=eq.${equipoId}`,
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
