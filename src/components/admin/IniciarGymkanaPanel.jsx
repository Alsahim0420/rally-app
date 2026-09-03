import { useState } from 'react';
import { Shuffle, Loader2, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { iniciarGymkana } from '../../services/adminService';

export default function IniciarGymkanaPanel({ equipos, rutas, gymkanaIniciada, onCambio }) {
  const { showToast } = useToast();
  const [iniciando, setIniciando] = useState(false);

  async function handleIniciar() {
    setIniciando(true);
    try {
      await iniciarGymkana(equipos);
      showToast('Gymkana iniciada: parejas y rutas generadas', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo iniciar la Gymkana', 'error');
    } finally {
      setIniciando(false);
    }
  }

  if (!gymkanaIniciada) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center space-y-3">
        <p className="text-sm text-gray-500">
          Aún no se ha iniciado la Gymkana. Al presionar el botón se sortean 2 parejas fijas
          entre los 4 equipos y se asigna a cada una un recorrido de 6 bases que no se cruza.
        </p>
        <button
          onClick={handleIniciar}
          disabled={iniciando || equipos.length !== 4}
          className="flex items-center gap-2 mx-auto bg-indigo-600 text-white font-semibold rounded-lg px-4 py-2.5 disabled:opacity-50"
        >
          {iniciando ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />}
          Iniciar Gymkana
        </button>
        {equipos.length !== 4 && (
          <p className="text-xs text-amber-600">
            Se necesitan exactamente 4 equipos creados (hay {equipos.length}).
          </p>
        )}
      </div>
    );
  }

  const parejas = [1, 2].map((num) => rutas.filter((r) => r.pareja_num === num));

  return (
    <div className="space-y-3">
      {parejas.map((pareja, i) => (
        <div key={i} className="bg-white rounded-xl border p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Pareja {i + 1}
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            {pareja.map((r, idx) => (
              <span key={r.equipo_id} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: r.equipo?.color_hex }}
                />
                {r.equipo?.nombre}
                {idx === 0 && <span className="text-gray-300 font-normal px-1">vs</span>}
              </span>
            ))}
          </div>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={12} /> Recorrido: {pareja[0]?.orden_bases.join(' → ')}
          </p>
        </div>
      ))}
    </div>
  );
}
