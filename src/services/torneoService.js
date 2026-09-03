import { supabase } from './supabaseClient';

export async function listarPartidos() {
  const { data, error } = await supabase
    .from('partidos_torneo')
    .select('*')
    .order('partido_num', { ascending: true });
  if (error) throw error;
  return data;
}

export async function generarPartidos() {
  const { error } = await supabase.rpc('generar_partidos_torneo');
  if (error) throw error;
}

export async function finalizarPartido(partidoId, ganador) {
  const { data, error } = await supabase.rpc('finalizar_partido', {
    p_partido_id: partidoId,
    p_ganador: ganador, // 'equipo_a' | 'empate' | 'equipo_b'
  });
  if (error) throw error;
  return data?.[0];
}

export function suscribirsePartidos(onChange) {
  const channel = supabase
    .channel('partidos-torneo')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partidos_torneo' },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
