import { useCallback, useEffect, useState } from 'react';
import Filtros from './components/Filtros.jsx';
import SalidaCard from './components/SalidaCard.jsx';
import SalidaForm from './components/SalidaForm.jsx';
import {
  actualizarSalida,
  crearSalida,
  eliminarSalida,
  mensajeDeError,
  obtenerDestinos,
  obtenerSalidas,
} from './services/api.js';

const FILTROS_VACIOS = { destino: '', fecha: '', tipo: '', q: '' };

export default function App() {
  const [salidas, setSalidas] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  // null = formulario cerrado, 'nueva' = registrar, objeto = editar esa salida
  const [formulario, setFormulario] = useState(null);

  const cargarDestinos = useCallback(async () => {
    try {
      setDestinos(await obtenerDestinos());
    } catch {
      /* si falla, el error principal ya se muestra al cargar las salidas */
    }
  }, []);

  const cargarSalidas = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setSalidas(await obtenerSalidas(filtros));
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarDestinos();
  }, [cargarDestinos]);

  // Pequeña espera para no llamar a la API en cada letra de la búsqueda
  useEffect(() => {
    const espera = setTimeout(cargarSalidas, 250);
    return () => clearTimeout(espera);
  }, [cargarSalidas]);

  // El aviso de éxito desaparece solo
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(''), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  const guardar = async (datos) => {
    try {
      if (formulario === 'nueva') {
        await crearSalida(datos);
        setAviso('Salida registrada correctamente');
      } else {
        await actualizarSalida(formulario.id, datos);
        setAviso('Salida actualizada correctamente');
      }
    } catch (err) {
      // El formulario muestra este mensaje (por ejemplo, el 400 del backend)
      throw { mensaje: mensajeDeError(err) };
    }
    setFormulario(null);
    cargarSalidas();
    cargarDestinos();
  };

  const eliminar = async (salida) => {
    const ok = window.confirm(
      `¿Eliminar la salida de ${salida.empresa} a ${salida.destino}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      await eliminarSalida(salida.id);
      setAviso('Salida eliminada');
      cargarSalidas();
      cargarDestinos();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const limpiarFiltros = () => setFiltros(FILTROS_VACIOS);
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <div className="app">
      <header className="encabezado">
        <div>
          <h1>
            <span aria-hidden="true">🚤</span> LanchaYa <span className="ciudad">Iquitos</span>
          </h1>
          <p className="subtitulo">Salidas de lanchas y rápidos por el río, en un solo lugar.</p>
        </div>
        <button type="button" className="btn btn-primario" onClick={() => setFormulario('nueva')}>
          + Registrar salida
        </button>
      </header>

      <main>
        <Filtros filtros={filtros} destinos={destinos} onChange={setFiltros} onLimpiar={limpiarFiltros} />

        {aviso && (
          <p className="aviso aviso-ok" role="status">
            {aviso}
          </p>
        )}

        {cargando && (
          <p className="estado" role="status">
            Cargando salidas…
          </p>
        )}

        {!cargando && error && (
          <div className="estado estado-error" role="alert">
            <p>{error}</p>
            <button type="button" className="btn btn-secundario" onClick={cargarSalidas}>
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && salidas.length === 0 && (
          <div className="estado">
            <p>
              {hayFiltros
                ? 'No hay salidas que coincidan con los filtros.'
                : 'Aún no hay salidas registradas.'}
            </p>
            {hayFiltros && (
              <button type="button" className="btn btn-secundario" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!cargando && !error && salidas.length > 0 && (
          <>
            <p className="contador">
              {salidas.length} {salidas.length === 1 ? 'salida' : 'salidas'}, ordenadas por fecha más próxima
            </p>
            <section className="lista">
              {salidas.map((s) => (
                <SalidaCard key={s.id} salida={s} onEditar={setFormulario} onEliminar={eliminar} />
              ))}
            </section>
          </>
        )}
      </main>

      {formulario && (
        <SalidaForm
          salida={formulario === 'nueva' ? null : formulario}
          onGuardar={guardar}
          onCancelar={() => setFormulario(null)}
        />
      )}
    </div>
  );
}
