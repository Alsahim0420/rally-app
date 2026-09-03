import { useEffect, useState, useCallback } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listarEquipos } from '../services/equiposService';
import {
  BASES_GYMKANA,
  obtenerPuntuacionesGymkana,
  marcarLlegadaGymkana,
  evaluarBaseGymkana,
  suscribirseGymkana,
} from '../services/gymkanaService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import BaseGymkanaCard from '../components/gymkana/BaseGymkanaCard';

export default function GymkanaPage() {
  const { perfil, logout } = useAuth();
  const { showToast } = useToast();

  const [equipos, setEquipos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  useEffect(() => {
    listarEquipos()
      .then(setEquipos)
      .catch(() => showToast('No se pudieron cargar los equipos', 'error'))
      .finally(() => setCargandoEquipos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarRegistros = useCallback((equipoId) => {
    setCargandoRegistros(true);
    obtenerPuntuacionesGymkana(equipoId)
      .then(setRegistros)
      .catch(() => showToast('No se pudieron cargar las bases', 'error'))
      .finally(() => setCargandoRegistros(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!equipoSeleccionado) return;
    cargarRegistros(equipoSeleccionado.id);
    const unsubscribe = suscribirseGymkana(equipoSeleccionado.id, () =>
      cargarRegistros(equipoSeleccionado.id)
    );
    return unsubscribe;
  }, [equipoSeleccionado, cargarRegistros]);

  async function handleMarcarLlegada(baseId) {
    try {
      const resultado = await marcarLlegadaGymkana(equipoSeleccionado.id, baseId);
      showToast(resultado?.mensaje ?? 'Llegada registrada', resultado?.conflicto ? 'warning' : 'success');
      cargarRegistros(equipoSeleccionado.id);
    } catch (err) {
      showToast(err.message ?? 'Error al registrar la llegada', 'error');
    }
  }

  async function handleEvaluar(baseId, resultadoValor) {
    try {
      const resultado = await evaluarBaseGymkana(equipoSeleccionado.id, baseId, resultadoValor);
      showToast(resultado?.mensaje ?? 'Evaluación registrada', resultado?.conflicto ? 'warning' : 'success');
      cargarRegistros(equipoSeleccionado.id);
    } catch (err) {
      showToast(err.message ?? 'Error al evaluar la base', 'error');
    }
  }

  function registroDeBase(baseId) {
    return registros.find((r) => r.base_id === baseId) ?? null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Staff Gymkana</h1>
          <p className="text-xs text-gray-500">{perfil?.nombre}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
        >
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {cargandoEquipos ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : (
          <EquipoSelector
            equipos={equipos}
            equipoSeleccionado={equipoSeleccionado}
            onSeleccionar={setEquipoSeleccionado}
          />
        )}

        {equipoSeleccionado && (
          <section className="space-y-3">
            <h2 className="font-semibold text-gray-700">
              Bases — {equipoSeleccionado.nombre}
            </h2>

            {cargandoRegistros ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-indigo-600" size={28} />
              </div>
            ) : (
              BASES_GYMKANA.map((baseId) => (
                <BaseGymkanaCard
                  key={baseId}
                  baseId={baseId}
                  registro={registroDeBase(baseId)}
                  equipoColor={equipoSeleccionado.color_hex}
                  onMarcarLlegada={handleMarcarLlegada}
                  onEvaluar={handleEvaluar}
                />
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}
