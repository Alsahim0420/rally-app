export default function EquipoSelector({ equipos, equipoSeleccionado, onSeleccionar }) {
  if (equipos.length === 0) {
    return (
      <p className="text-center text-gray-500 text-sm py-6">
        Aún no hay equipos creados. Pide al Admin que los configure.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {equipos.map((equipo) => {
        const activo = equipo.id === equipoSeleccionado?.id;
        return (
          <button
            key={equipo.id}
            onClick={() => onSeleccionar(equipo)}
            className="rounded-xl p-4 text-left border-4 font-semibold text-gray-800 transition"
            style={{
              borderColor: equipo.color_hex,
              backgroundColor: activo ? `${equipo.color_hex}22` : 'white',
            }}
          >
            <span
              className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
              style={{ backgroundColor: equipo.color_hex }}
            />
            {equipo.nombre}
          </button>
        );
      })}
    </div>
  );
}
