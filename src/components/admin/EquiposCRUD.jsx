import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { crearEquipo, actualizarEquipo, eliminarEquipo } from '../../services/adminService';

const MAX_EQUIPOS = 4;

export default function EquiposCRUD({ equipos, onCambio }) {
  const { showToast } = useToast();
  const [editando, setEditando] = useState(null); // null | 'nuevo' | equipo
  const [nombre, setNombre] = useState('');
  const [colorHex, setColorHex] = useState('#6366F1');
  const [guardando, setGuardando] = useState(false);

  function abrirNuevo() {
    setEditando('nuevo');
    setNombre('');
    setColorHex('#6366F1');
  }

  function abrirEditar(equipo) {
    setEditando(equipo);
    setNombre(equipo.nombre);
    setColorHex(equipo.color_hex);
  }

  function cerrar() {
    setEditando(null);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando === 'nuevo') {
        await crearEquipo(nombre.trim(), colorHex);
        showToast('Equipo creado', 'success');
      } else {
        await actualizarEquipo(editando.id, { nombre: nombre.trim(), colorHex });
        showToast('Equipo actualizado', 'success');
      }
      cerrar();
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar el equipo', 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(equipo) {
    if (!window.confirm(`¿Eliminar "${equipo.nombre}"? Esto borra también sus puntuaciones.`)) {
      return;
    }
    try {
      await eliminarEquipo(equipo.id);
      showToast('Equipo eliminado', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo eliminar el equipo', 'error');
    }
  }

  const puedeCrear = equipos.length < MAX_EQUIPOS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">
          Equipos ({equipos.length}/{MAX_EQUIPOS})
        </h2>
        <button
          onClick={abrirNuevo}
          disabled={!puedeCrear}
          className="flex items-center gap-1 text-sm font-semibold text-white bg-indigo-600 disabled:opacity-40 rounded-lg px-3 py-2"
        >
          <Plus size={16} /> Nuevo equipo
        </button>
      </div>

      {!puedeCrear && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Ya existen los 4 equipos del evento. Elimina uno para poder crear otro.
        </p>
      )}

      <div className="grid gap-3">
        {equipos.map((equipo) => (
          <div
            key={equipo.id}
            className="flex items-center justify-between rounded-xl border-2 bg-white p-4"
            style={{ borderColor: equipo.color_hex }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: equipo.color_hex }}
              />
              <span className="font-semibold text-gray-800">{equipo.nombre}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => abrirEditar(equipo)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleEliminar(equipo)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
          <form
            onSubmit={handleGuardar}
            className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {editando === 'nuevo' ? 'Nuevo equipo' : 'Editar equipo'}
              </h3>
              <button type="button" onClick={cerrar} className="text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Equipo Rojo"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold rounded-lg py-2.5 disabled:opacity-60"
            >
              {guardando && <Loader2 className="animate-spin" size={18} />}
              Guardar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
