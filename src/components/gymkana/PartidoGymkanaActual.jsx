import { useState } from 'react';
import { CheckCircle2, Circle, Lock, AlertTriangle, Loader2, PartyPopper } from 'lucide-react';

const ETIQUETAS_RESULTADO = {
  gano: { texto: 'Ganó', clase: 'bg-emerald-100 text-emerald-700' },
  empato: { texto: 'Empató', clase: 'bg-amber-100 text-amber-700' },
  perdio: { texto: 'Perdió', clase: 'bg-gray-200 text-gray-600' },
};

/**
 * Muestra la base que le toca ahora mismo al equipo, contra quién
 * compite, y el estado de esa base:
 *  - abierta: botones Ganó / Empató / Perdió.
 *  - sellada por el rival mientras esta pantalla estaba en pausa:
 *    mensaje + "Reportar Error / Alerta".
 *  - alerta ya reportada: esperando al Admin.
 */
export default function PartidoGymkanaActual({
  equipoId,
  equipoColor,
  rival,
  estado, // resultado de obtenerEstadoGymkana()
  onCalificar,
  onReportarAlerta,
}) {
  const [cargando, setCargando] = useState(false);

  if (!estado) {
    return (
      <div className="rounded-xl border-2 border-dashed p-6 text-center text-sm text-gray-500">
        La Gymkana todavía no ha sido iniciada por el Admin. Espera a que se generen las rutas.
      </div>
    );
  }

  if (!estado.actual) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center space-y-2">
        <PartyPopper className="mx-auto text-emerald-600" size={28} />
        <p className="font-semibold text-emerald-700">¡Recorrido completo!</p>
        <p className="text-sm text-emerald-600">Este equipo ya calificó sus 6 bases.</p>
      </div>
    );
  }

  const partido = estado.actual;
  const miLado = partido.equipo_a_id === equipoId ? 'a' : 'b';
  const bloqueado = partido.finalizado;

  async function handleCalificar(resultado) {
    setCargando(true);
    try {
      await onCalificar(partido.id, resultado);
    } finally {
      setCargando(false);
    }
  }

  async function handleAlerta() {
    setCargando(true);
    try {
      await onReportarAlerta(partido.id);
    } finally {
      setCargando(false);
    }
  }

  const miResultado = miLado === 'a' ? partido.resultado_a : partido.resultado_b;

  return (
    <div
      className="rounded-xl border-2 p-4 bg-white space-y-3"
      style={{ borderColor: bloqueado ? '#e5e7eb' : equipoColor }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800">
          Base {partido.base_id} · {estado.actualIndex + 1} de 6
        </span>
        <span className="text-sm text-gray-500">
          vs{' '}
          <span className="font-semibold" style={{ color: rival?.color_hex }}>
            {rival?.nombre}
          </span>
        </span>
      </div>

      {!bloqueado && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCalificar('gano')}
            disabled={cargando}
            className="py-3 rounded-lg font-semibold text-white bg-emerald-600 disabled:opacity-60"
          >
            {cargando ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Ganó'}
          </button>
          <button
            onClick={() => handleCalificar('empato')}
            disabled={cargando}
            className="py-3 rounded-lg font-semibold text-white bg-amber-500 disabled:opacity-60"
          >
            Empató
          </button>
          <button
            onClick={() => handleCalificar('perdio')}
            disabled={cargando}
            className="py-3 rounded-lg font-semibold text-white bg-gray-500 disabled:opacity-60"
          >
            Perdió
          </button>
        </div>
      )}

      {bloqueado && !partido.requiere_auditoria && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${ETIQUETAS_RESULTADO[miResultado]?.clase}`}
            >
              {ETIQUETAS_RESULTADO[miResultado]?.texto}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Lock size={12} /> Base ya calificada
            </span>
          </div>
          <button
            onClick={handleAlerta}
            disabled={cargando}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-red-700 bg-red-50 border-2 border-red-200 disabled:opacity-60"
          >
            {cargando ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
            Reportar Error / Alerta
          </button>
        </div>
      )}

      {partido.requiere_auditoria && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle size={16} />
          Alerta enviada al Admin. Esperando resolución.
        </div>
      )}
    </div>
  );
}

export function MiniProgresoGymkana({ recorrido }) {
  return (
    <div className="flex items-center gap-1.5">
      {recorrido.map((p, i) => (
        <span
          key={i}
          title={p ? `Base ${p.base_id}` : ''}
          className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
            p?.finalizado ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {p?.finalizado ? <CheckCircle2 size={12} /> : <Circle size={12} />}
        </span>
      ))}
    </div>
  );
}
