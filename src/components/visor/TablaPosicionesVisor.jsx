const MEDALLAS = ['🥇', '🥈', '🥉', '4º'];

export default function TablaPosicionesVisor({ equipos }) {
  if (equipos.length === 0) {
    return <p className="text-center text-gray-400 py-10">Aún no hay equipos registrados.</p>;
  }

  return (
    <div className="space-y-3">
      {equipos.map((e, i) => (
        <div
          key={e.equipo_id}
          className="rounded-2xl p-4 sm:p-6 flex items-center gap-4 sm:gap-6 shadow-lg"
          style={{ backgroundColor: `${e.color_hex}15`, border: `3px solid ${e.color_hex}` }}
        >
          <span className="text-3xl sm:text-5xl font-black w-14 sm:w-20 text-center shrink-0">
            {MEDALLAS[i] ?? `${i + 1}º`}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xl sm:text-3xl font-black text-gray-900 truncate">{e.nombre}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 mt-1">
              <span>Gymkana: {e.total_gymkana}</span>
              <span>Tesoro: {e.total_tesoro}</span>
              <span>Torneo: {e.total_torneo}</span>
              <span>Ajustes: {e.total_ajustes}</span>
            </div>
          </div>

          <span
            className="text-3xl sm:text-5xl font-black shrink-0"
            style={{ color: e.color_hex }}
          >
            {e.puntos_generales}
          </span>
        </div>
      ))}
    </div>
  );
}
