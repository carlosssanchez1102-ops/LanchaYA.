import { TIPOS } from './Filtros.jsx';

const etiquetaTipo = (tipo) => TIPOS.find((t) => t.valor === tipo)?.etiqueta || tipo;

// Verde: 15 o más cupos, amarillo: 5 a 14, rojo: menos de 5
function nivelCupos(cupos) {
  if (cupos >= 15) return 'verde';
  if (cupos >= 5) return 'amarillo';
  return 'rojo';
}

function formatearFechaHora(iso) {
  const fecha = new Date(iso);
  const dia = fecha.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' });
  const hora = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { dia, hora };
}

function formatearDuracion(horas) {
  if (!horas) return null;
  if (horas >= 24 && horas % 24 === 0) return `${horas / 24} días`;
  return `${horas} h`;
}

export default function SalidaCard({ salida, onEditar, onEliminar }) {
  const { dia, hora } = formatearFechaHora(salida.fechaHora);
  const duracion = formatearDuracion(salida.duracionHoras);

  return (
    <article className="card">
      <header className="card-cabecera">
        <span className={`etiqueta etiqueta-${salida.tipo}`}>{etiquetaTipo(salida.tipo)}</span>
        <span className="precio">S/ {Number(salida.precio).toFixed(2)}</span>
      </header>

      <h3 className="card-destino">
        <span aria-hidden="true">→</span> {salida.destino}
      </h3>
      <p className="card-empresa">
        {salida.empresa}
        {salida.embarcacion ? ` · ${salida.embarcacion}` : ''}
      </p>

      <dl className="card-datos">
        <div>
          <dt>Sale</dt>
          <dd>
            <strong>{hora}</strong> · {dia}
          </dd>
        </div>
        <div>
          <dt>Puerto</dt>
          <dd>{salida.puerto}</dd>
        </div>
        {duracion && (
          <div>
            <dt>Duración</dt>
            <dd>{duracion}</dd>
          </div>
        )}
        {salida.cupos !== null && salida.cupos !== undefined && (
          <div>
            <dt>Cupos</dt>
            <dd>
              <span className={`cupos cupos-${nivelCupos(salida.cupos)}`}>
                {salida.cupos === 0 ? 'Agotado' : `${salida.cupos} disponibles`}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <footer className="card-acciones">
        <button type="button" className="btn btn-secundario" onClick={() => onEditar(salida)}>
          Editar
        </button>
        <button type="button" className="btn btn-peligro" onClick={() => onEliminar(salida)}>
          Eliminar
        </button>
      </footer>
    </article>
  );
}
