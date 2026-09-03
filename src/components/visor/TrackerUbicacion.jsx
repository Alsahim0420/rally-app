import { MapPin } from 'lucide-react';

export default function TrackerUbicacion({ equipos, ubicaciones }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {equipos.map((e) => {
        const ubicacion = ubicaciones[e.equipo_id];
        return (
          <div
            key={e.equipo_id}
            className="rounded-xl p-3 sm:p-4 text-center bg-white shadow"
            style={{ borderTop: `4px solid ${e.color_hex}` }}
          >
            <p className="font-bold text-gray-800 text-sm sm:text-base truncate">{e.nombre}</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-gray-500">
              <MapPin size={14} />
              {ubicacion ? (
                <span className="text-xs sm:text-sm">
                  {ubicacion.modulo} · Base {ubicacion.base_id}
                </span>
              ) : (
                <span className="text-xs sm:text-sm">Sin iniciar</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
