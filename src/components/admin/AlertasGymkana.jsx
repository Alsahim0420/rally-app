import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { sobrescribirResultadoGymkana } from '../../services/adminService';

const OPCIONES = [
  { valor: 'gano', texto: 'Ganó' },
  { valor: 'empato', texto: 'Empató' },
  { valor: 'perdio', texto: 'Perdió' },
];

export default function AlertasGymkana({ alertas, onCambio }) {
  const { showToast } = useToast();
  const [resolviendoId, setResolviendoId] = useState(null);
  const [seleccion, setSeleccion] = useState({});

  function elegir(alertaId, lado, valor) {
    setSeleccion((prev) => ({
      ...prev,
      [alertaId]: { ...prev[alertaId], [lado]: valor },
    }));
  }

  async function handleResolver(alerta) {
    const sel = seleccion[alerta.id] ?? {};
    const resultadoA = sel.a ?? alerta.resultado_a ?? 'gano';
    const resultadoB = sel.b ?? alerta.resultado_b ?? 'perdio';

    setResolviendoId(alerta.id);
    try {
      await sobrescribirResultadoGymkana(alerta.id, resultadoA, resultadoB);
      showToast('Resultado sobrescrito', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo sobrescribir el resultado', 'error');
    } finally {
      setResolviendoId(null);
    }
  }

  if (alertas.length === 0) {
    return (
      <p className="text-sm text-gray-500 bg-white rounded-xl border p-4">
        No hay alertas pendientes en Gymkana. 🎉
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {alertas.map((a) => {
        const sel = seleccion[a.id] ?? {};
        return (
          <div key={a.id} className="bg-white rounded-xl border-2 border-red-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
              <AlertTriangle size={16} />
              Base {a.base_id} — {a.equipo_a?.nombre} vs {a.equipo_b?.nombre}
            </div>

            {[
              { equipo: a.equipo_a, lado: 'a', actual: a.resultado_a },
              { equipo: a.equipo_b, lado: 'b', actual: a.resultado_b },
            ].map(({ equipo, lado, actual }) => (
              <div key={lado} className="space-y-1.5">
                <p className="text-xs text-gray-500">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                    style={{ backgroundColor: equipo?.color_hex }}
                  />
                  {equipo?.nombre} — resultado actual: {actual ?? 'sin definir'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {OPCIONES.map((op) => (
                    <button
                      key={op.valor}
                      onClick={() => elegir(a.id, lado, op.valor)}
                      className={`py-2 rounded-lg text-sm font-semibold border-2 ${
                        (sel[lado] ?? actual) === op.valor
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {op.texto}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => handleResolver(a)}
              disabled={resolviendoId === a.id}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold rounded-lg py-2.5 disabled:opacity-60"
            >
              {resolviendoId === a.id && <Loader2 className="animate-spin" size={16} />}
              Confirmar resultado final
            </button>
          </div>
        );
      })}
    </div>
  );
}
