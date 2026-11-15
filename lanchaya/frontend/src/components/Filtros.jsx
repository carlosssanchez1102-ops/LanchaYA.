export const TIPOS = [
  { valor: 'lancha', etiqueta: 'Lancha' },
  { valor: 'rapido', etiqueta: 'Rápido' },
  { valor: 'deslizador', etiqueta: 'Deslizador' },
];

export default function Filtros({ filtros, destinos, onChange, onLimpiar }) {
  const cambiar = (campo) => (e) => onChange({ ...filtros, [campo]: e.target.value });
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <section className="filtros" aria-label="Filtros de búsqueda">
      <label className="campo campo-busqueda">
        <span>Buscar empresa o embarcación</span>
        <input
          type="search"
          placeholder="Ej. Golfinho"
          value={filtros.q}
          onChange={cambiar('q')}
        />
      </label>

      <label className="campo">
        <span>Destino</span>
        <select value={filtros.destino} onChange={cambiar('destino')}>
          <option value="">Todos los destinos</option>
          {destinos.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span>Fecha</span>
        <input type="date" value={filtros.fecha} onChange={cambiar('fecha')} />
      </label>

      <label className="campo">
        <span>Tipo de embarcación</span>
        <select value={filtros.tipo} onChange={cambiar('tipo')}>
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="btn btn-secundario" onClick={onLimpiar} disabled={!hayFiltros}>
        Limpiar filtros
      </button>
    </section>
  );
}
