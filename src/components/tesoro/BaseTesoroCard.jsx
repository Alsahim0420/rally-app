import { useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export default function BaseTesoroCard({
  baseId,
  registro,
  equipoColor,
  onMarcarLlegada,
  onCalificar,
}) {
  const [cargando, setCargando] = useState(false);

  const yaLlego = !!registro;
  const yaCalificada = registro?.puntos_evaluacion != null;

  async function handleLlegada() {
    setCargando(true);
    try {
      await onMarcarLlegada(baseId);
    } finally {
      setCargando(false);
    }
  }

  async function handleCalificar(puntos) {
    setCargando(true);
    try {
      await onCalificar(baseId, puntos);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="rounded-xl border-2 p-4 bg-white space-y-3"
      style={{ borderColor: yaCalificada ? '#e5e7eb' : equipoColor }}
    >
      <span className="font-semibold text-gray-800">Base {baseId}</span>

      {!yaLlego && (
        <button
          onClick={handleLlegada}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: equipoColor }}
        >
          {cargando ? <Loader2 className="animate-spin" size={18} /> : <Circle size={18} />}
          Marcar Llegada
        </button>
      )}

      {yaLlego && !yaCalificada && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Califica el desempeño en esta base:</p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => handleCalificar(p)}
                disabled={cargando}
                className="py-3 rounded-lg font-bold text-white bg-indigo-600 disabled:opacity-60"
              >
                {p} pt{p > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {yaCalificada && (
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
            {registro.puntos_totales} pts totales
          </span>
          <span className="text-sm text-gray-400">· Base ya calificada</span>
        </div>
      )}
    </div>
  );
}
