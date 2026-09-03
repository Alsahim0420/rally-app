import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { resolverConflictoGymkana } from '../../services/adminService';

const OPCIONES = [
  { valor: 'gano', texto: 'Ganó' },
  { valor: 'empato', texto: 'Empató' },
  { valor: 'perdio', texto: 'Perdió' },
];

export default function ConflictosGymkana({ conflictos, onCambio }) {
  const { showToast } = useToast();
  const [resolviendoId, setResolviendoId] = useState(null);
  const [seleccion, setSeleccion] = useState({});

  async function handleResolver(conflicto) {
    const resultadoFinal = seleccion[conflicto.id] ?? conflicto.resultado ?? 'gano';
    setResolviendoId(conflicto.id);
    try {
      await resolverConflictoGymkana(conflicto.id, resultadoFinal);
      showToast('Conflicto resuelto', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo resolver el conflicto', 'error');
    } finally {
      setResolviendoId(null);
    }
  }

  if (conflictos.length === 0) {
    return (
      <p className="text-sm text-gray-500 bg-white rounded-xl border p-4">
        No hay conflictos pendientes en Gymkana. 🎉
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {conflictos.map((c) => (
        <div key={c.id} className="bg-white rounded-xl border-2 border-red-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
            <AlertTriangle size={16} />
            Base {c.base_id} — {c.equipos?.nombre}
          </div>
          <p className="text-xs text-gray-500">
            Resultado actual en el sistema: {c.resultado ?? 'sin definir'}
          </p>

          <div className="grid grid-cols-3 gap-2">
            {OPCIONES.map((op) => (
              <button
                key={op.valor}
                onClick={() => setSeleccion((prev) => ({ ...prev, [c.id]: op.valor }))}
                className={`py-2 rounded-lg text-sm font-semibold border-2 ${
                  (seleccion[c.id] ?? c.resultado) === op.valor
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                {op.texto}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleResolver(c)}
            disabled={resolviendoId === c.id}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold rounded-lg py-2.5 disabled:opacity-60"
          >
            {resolviendoId === c.id && <Loader2 className="animate-spin" size={16} />}
            Confirmar resultado final
          </button>
        </div>
      ))}
    </div>
  );
}
