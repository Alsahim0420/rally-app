import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const BOOTSTRAP_CSS = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
const BOOTSTRAP_ICONS =
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';

/**
 * Carga el CSS de Bootstrap solo mientras esta pagina esta montada,
 * y lo quita al salir. Asi el resto de la app (que usa Tailwind)
 * nunca convive con el reset global de Bootstrap.
 */
function useBootstrapMientrasMontado() {
  useEffect(() => {
    const enlaces = [BOOTSTRAP_CSS, BOOTSTRAP_ICONS].map((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.paginaPrincipal = 'true';
      document.head.appendChild(link);
      return link;
    });

    return () => {
      enlaces.forEach((link) => link.remove());
    };
  }, []);
}

export default function Home() {
  useBootstrapMientrasMontado();

  return (
    <>
      {/* ===================== BARRA SUPERIOR ===================== */}
      <nav className="navbar navbar-expand navbar-dark inicio-navbar">
        <div className="container-fluid px-4">
          <span className="navbar-brand fw-bold">Interoratorios 2026</span>
          <Link to="/login" className="btn inicio-btn-login ms-auto">
            <i className="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* ===================== SECCION PRINCIPAL (HERO) ===================== */}
      <main className="inicio-hero d-flex flex-column align-items-center justify-content-center text-center px-3">
        <h1 className="display-4 fw-bold text-white mb-2">Interoratorios 2026</h1>
        <p className="lead text-white-50 mb-5">Elige una actividad para comenzar</p>

        {/* Botones centrales: uno por actividad */}
        <div className="row g-4 justify-content-center w-100 mb-5" style={{ maxWidth: 900 }}>
          <div className="col-12 col-sm-6 col-md-4">
            <Link to="/gymkana" className="btn inicio-btn-actividad w-100 h-100">
              <i className="bi bi-flag-fill fs-1 d-block mb-2"></i>
              Gymkana
            </Link>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <Link to="/tesoro" className="btn inicio-btn-actividad w-100 h-100">
              <i className="bi bi-map-fill fs-1 d-block mb-2"></i>
              Búsqueda del Tesoro
            </Link>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <Link to="/torneo" className="btn inicio-btn-actividad w-100 h-100">
              <i className="bi bi-trophy-fill fs-1 d-block mb-2"></i>
              Torneo
            </Link>
          </div>
        </div>

        {/* Boton grande hacia el Visor en vivo */}
        <Link to="/visor" className="btn inicio-btn-visor">
          <i className="bi bi-broadcast me-2"></i>
          Ver Transmisión en Vivo
        </Link>
      </main>
    </>
  );
}
