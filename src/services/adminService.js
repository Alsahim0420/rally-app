import { supabase } from './supabaseClient';

// ---------- Marcador / resumen ----------
export async function obtenerMarcadorGeneral() {
  const { data, error } = await supabase
    .from('marcador_general')
    .select('*')
    .order('puntos_generales', { ascending: false });
  if (error) throw error;
  return data;
}

// ---------- Equipos (CRUD) ----------
export async function crearEquipo(nombre, colorHex) {
  const { error } = await supabase
    .from('equipos')
    .insert({ nombre, color_hex: colorHex });
  if (error) throw error;
}

export async function actualizarEquipo(id, { nombre, colorHex }) {
  const { error } = await supabase
    .from('equipos')
    .update({ nombre, color_hex: colorHex })
    .eq('id', id);
  if (error) throw error;
}

export async function eliminarEquipo(id) {
  const { error } = await supabase.from('equipos').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Ajustes manuales ----------
export async function crearAjuste(equipoId, puntosExtra, motivo, creadoPor) {
  const { error } = await supabase.from('ajustes_admin').insert({
    equipo_id: equipoId,
    puntos_extra: puntosExtra,
    motivo,
    creado_por: creadoPor,
  });
  if (error) throw error;
}

export async function listarAjustes() {
  const { data, error } = await supabase
    .from('ajustes_admin')
    .select('id, puntos_extra, motivo, fecha, equipos(nombre, color_hex)')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
}

// ---------- Conflictos de Gymkana ----------
export async function listarConflictosGymkana() {
  const { data, error } = await supabase
    .from('puntuaciones_gymkana')
    .select('id, base_id, resultado, equipos(id, nombre, color_hex)')
    .eq('estado_conflicto', true)
    .order('base_id', { ascending: true });
  if (error) throw error;
  return data;
}

export async function resolverConflictoGymkana(id, resultadoFinal) {
  const { error } = await supabase
    .from('puntuaciones_gymkana')
    .update({ resultado: resultadoFinal, estado_conflicto: false })
    .eq('id', id);
  if (error) throw error;
}

// ---------- Reiniciar evento ----------
export async function reiniciarEvento() {
  const { error } = await supabase.rpc('reiniciar_evento');
  if (error) throw error;
}
