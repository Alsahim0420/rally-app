import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(undefined);

let idCounter = 0;

const ESTILOS = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  warning: 'bg-amber-500',
  info: 'bg-gray-800',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (mensaje, tipo = 'info', duracionMs = 4500) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, mensaje, tipo }]);
      setTimeout(() => remove(id), duracionMs);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg shadow-lg px-4 py-3 text-sm font-medium text-white ${ESTILOS[t.tipo] ?? ESTILOS.info}`}
          >
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
