export default function ProgresoTesoro({ completadas, total }) {
  const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

  return (
    <div className="bg-white rounded-xl border p-4 space-y-2">
      <div className="flex justify-between text-sm font-medium text-gray-700">
        <span>Bases completadas</span>
        <span>
          {completadas}/{total}
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
