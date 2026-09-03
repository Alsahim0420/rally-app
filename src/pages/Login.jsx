import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth, RUTA_POR_ROL } from '../context/AuthContext';

export default function Login() {
  const { login, session, perfil, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Si ya hay sesión y perfil cargado, redirige automáticamente a su módulo
  useEffect(() => {
    if (!loading && session && perfil) {
      navigate(RUTA_POR_ROL[perfil.rol] ?? '/', { replace: true });
    }
  }, [loading, session, perfil, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email, password);
      // La redirección ocurre en el useEffect de arriba cuando el perfil cargue
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Rally de Competencia</h1>
          <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="tucorreo@rally.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 text-base transition"
        >
          {enviando ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <LogIn size={20} />
          )}
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
