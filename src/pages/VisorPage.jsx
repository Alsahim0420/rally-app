import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { obtenerMarcadorGeneral, obtenerUbicaciones, suscribirseVisor } from '../services/visorService';
import TablaPosicionesVisor from '../components/visor/TablaPosicionesVisor';
import TrackerUbicacion from '../components/visor/TrackerUbicacion';

export default function VisorPage() {
  const [marcador, setMarcador] = useState([]);
  const [ubicaciones, setUbicaciones] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargarTodo = useCallback(() => {
    Promise.all([obtenerMarcadorGeneral(), obtenerUbicaciones()])
      .then(([m, u]) => {
        setMarcador(m);
        setUbicaciones(u);
      })
      .catch((err) => console.error('Error cargando el visor:', err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargarTodo();
    const unsubscribe = suscribirseVisor(cargarTodo);
    return unsubscribe;
  }, [cargarTodo]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-4xl font-black text-gray-900">Rally de Competencia</h1>
        <span className="flex items-center gap-2 text-sm sm:text-base font-semibold text-emerald-600">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          En vivo
        </span>
      </header>

      {cargando ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          <TablaPosicionesVisor equipos={marcador} />

          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3">
              Ubicación actual
            </h2>
            <TrackerUbicacion equipos={marcador} ubicaciones={ubicaciones} />
          </div>
        </div>
      )}
    </div>
  );
}
