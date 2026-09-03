import { useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle, Loader2 } from 'lucide-react';

const ETIQUETAS_RESULTADO = {
  gano: { texto: 'Ganó', clase: 'bg-emerald-100 text-emerald-700' },
  empato: { texto: 'Empató', clase: 'bg-amber-100 text-amber-700' },
  perdio: { texto: 'Perdió', clase: 'bg-gray-200 text-gray-600' },
};

export default function BaseGymkanaCard({
  baseId,
  registro,
  equipoColor,
  onMarcarLlegada,
  onEvaluar,
}) {
  const [cargando, setCargando] = useState(false);

  const yaLlego = !!registro;
  const yaCalificada = !!registro?.resultado;

  async function handleLlegada() {
    setCargando(true);
    try {
      await onMarcarLlegada(baseId);
    } finally {
      setCargando(false);
    }
  }

  async function handleEvaluar(resultado) {
    setCargando(true);
    try {
      await onEvaluar(baseId, resultado);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="rounded-xl border-2 p-4 bg-white space-y-3"
      style={{ borderColor: yaCalificada ? '#e5e7eb' : equipoColor }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800">Base {baseId}</span>
        {registro?.estado_conflicto && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <AlertTriangle size={14} /> Conflicto
          </span>
        )}
      </div>

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
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleEvaluar('gano')}
            disabled={cargando}
            className="py-3 rounded-lg font-semibold text-white bg-emerald-600 disabled:opacity-60"
          >
            Ganó
          </button>
          <button
            onClick={() => handleEvaluar('empato')}
            disabled={cargando}
            className="py-3 rounded-lg font-semibold text-white bg-amber-500 disabled:opacity-60"
          >
            Empató
          </button>
          <button
            onClick={() => handleEvaluar('perdio')}
            disabled={cargando}
            className="py-3 rounded-lg font-semibold text-white bg-gray-500 disabled:opacity-60"
          >
            Perdió
          </button>
        </div>
      )}

      {yaCalificada && (
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full ${ETIQUETAS_RESULTADO[registro.resultado].clase}`}
          >
            {ETIQUETAS_RESULTADO[registro.resultado].texto}
          </span>
          <span className="text-sm text-gray-400">· Base ya calificada</span>
        </div>
      )}
    </div>
  );
}
