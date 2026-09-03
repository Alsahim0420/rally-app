import { useCallback, useEffect, useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listarEquipos } from '../services/equiposService';
import {
  obtenerMarcadorGeneral,
  listarAjustes,
  gymkanaEstaIniciada,
  listarRutasGymkana,
  listarAlertasGymkana,
} from '../services/adminService';
import TablaMarcador from '../components/admin/TablaMarcador';
import EquiposCRUD from '../components/admin/EquiposCRUD';
import AjustesForm from '../components/admin/AjustesForm';
import IniciarGymkanaPanel from '../components/admin/IniciarGymkanaPanel';
import AlertasGymkana from '../components/admin/AlertasGymkana';
import ReiniciarEvento from '../components/admin/ReiniciarEvento';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'gymkana', label: 'Gymkana' },
  { id: 'alertas', label: 'Alertas' },
  { id: 'peligro', label: 'Reiniciar' },
];

export default function AdminPage() {
  const { perfil, logout } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState('resumen');
  const [cargando, setCargando] = useState(true);
  const [marcador, setMarcador] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [gymkanaIniciada, setGymkanaIniciada] = useState(false);
  const [rutasGymkana, setRutasGymkana] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const cargarTodo = useCallback(async () => {
    setCargando(true);

    const [m, e, a, iniciada, alertasData] = await Promise.allSettled([
      obtenerMarcadorGeneral(),
      listarEquipos(),
      listarAjustes(),
      gymkanaEstaIniciada(),
      listarAlertasGymkana(),
    ]);

    if (m.status === 'fulfilled') setMarcador(m.value);
    if (e.status === 'fulfilled') setEquipos(e.value);
    if (a.status === 'fulfilled') setAjustes(a.value);
    if (alertasData.status === 'fulfilled') setAlertas(alertasData.value);

    if (iniciada.status === 'fulfilled') {
      setGymkanaIniciada(iniciada.value);
      if (iniciada.value) {
        try {
          setRutasGymkana(await listarRutasGymkana());
        } catch {
          showToast('No se pudieron cargar las rutas de Gymkana', 'error');
        }
      } else {
        setRutasGymkana([]);
      }
    }

    const fallidas = [m, e, a, iniciada, alertasData].filter((r) => r.status === 'rejected');
    if (fallidas.length > 0) {
      console.error('Fallos al cargar Admin:', fallidas.map((r) => r.reason));
      const esGymkanaFaltante = fallidas.some((r) =>
        ['42703', 'PGRST205', '42P01'].includes(r.reason?.code)
      );
      showToast(
        esGymkanaFaltante
          ? 'Falta correr el SQL de Gymkana en Supabase (rutas_gymkana / puntuaciones_gymkana)'
          : 'No se pudo cargar parte de la información del Admin',
        'error'
      );
    }

    setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900">Admin</h1>
          <p className="text-xs text-gray-500">{perfil?.nombre}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
        >
          <LogOut size={16} /> Salir
        </button>
      </header>

      <nav className="bg-white border-b sticky top-[57px] z-10 overflow-x-auto">
        <div className="flex px-4 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500'
              } ${t.id === 'alertas' && alertas.length > 0 ? 'relative' : ''}`}
            >
              {t.label}
              {t.id === 'alertas' && alertas.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">
                  {alertas.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {cargando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        ) : (
          <>
            {tab === 'resumen' && <TablaMarcador equipos={marcador} />}
            {tab === 'equipos' && <EquiposCRUD equipos={equipos} onCambio={cargarTodo} />}
            {tab === 'ajustes' && (
              <AjustesForm equipos={equipos} historial={ajustes} onCambio={cargarTodo} />
            )}
            {tab === 'gymkana' && (
              <IniciarGymkanaPanel
                equipos={equipos}
                rutas={rutasGymkana}
                gymkanaIniciada={gymkanaIniciada}
                onCambio={cargarTodo}
              />
            )}
            {tab === 'alertas' && <AlertasGymkana alertas={alertas} onCambio={cargarTodo} />}
            {tab === 'peligro' && <ReiniciarEvento onCambio={cargarTodo} />}
          </>
        )}
      </main>
    </div>
  );
}
