import { useState } from 'react';
import { TIPOS } from './Filtros.jsx';

const VACIO = {
  empresa: '',
  embarcacion: '',
  tipo: 'lancha',
  destino: '',
  puerto: '',
  fechaHora: '',
  duracionHoras: '',
  precio: '',
  cupos: '',
};

const aTexto = (v) => (v === null || v === undefined ? '' : String(v));

function desdeSalida(salida) {
  if (!salida) return VACIO;
  return {
    empresa: aTexto(salida.empresa),
    embarcacion: aTexto(salida.embarcacion),
    tipo: salida.tipo,
    destino: aTexto(salida.destino),
    puerto: aTexto(salida.puerto),
    fechaHora: aTexto(salida.fechaHora).slice(0, 16),
    duracionHoras: aTexto(salida.duracionHoras),
    precio: aTexto(salida.precio),
    cupos: aTexto(salida.cupos),
  };
}

// Mismas reglas que el backend, para avisar antes de enviar.
function validar(valores, esNueva) {
  const errores = {};
  ['empresa', 'destino', 'puerto'].forEach((campo) => {
    if (!valores[campo].trim()) errores[campo] = 'Este campo es obligatorio';
  });

  if (!valores.fechaHora) {
    errores.fechaHora = 'Indica la fecha y hora de salida';
  } else if (Number.isNaN(new Date(valores.fechaHora).getTime())) {
    errores.fechaHora = 'Fecha y hora no válidas';
  } else if (esNueva && new Date(valores.fechaHora).getTime() < Date.now()) {
    errores.fechaHora = 'La salida no puede estar en el pasado';
  }

  const precio = Number(valores.precio);
  if (valores.precio === '' || !Number.isFinite(precio) || precio <= 0) {
    errores.precio = 'El precio debe ser un número mayor que 0';
  }

  if (!TIPOS.some((t) => t.valor === valores.tipo)) {
    errores.tipo = 'Elige un tipo de embarcación';
  }

  if (valores.duracionHoras !== '') {
    const d = Number(valores.duracionHoras);
    if (!Number.isFinite(d) || d <= 0) errores.duracionHoras = 'La duración debe ser mayor que 0';
  }
  if (valores.cupos !== '') {
    const c = Number(valores.cupos);
    if (!Number.isInteger(c) || c < 0) errores.cupos = 'Los cupos deben ser un entero de 0 o más';
  }
  return errores;
}

function aPayload(v) {
  return {
    empresa: v.empresa.trim(),
    embarcacion: v.embarcacion.trim(),
    tipo: v.tipo,
    destino: v.destino.trim(),
    puerto: v.puerto.trim(),
    fechaHora: v.fechaHora,
    duracionHoras: v.duracionHoras === '' ? null : Number(v.duracionHoras),
    precio: Number(v.precio),
    cupos: v.cupos === '' ? null : Number(v.cupos),
  };
}

export default function SalidaForm({ salida, onGuardar, onCancelar }) {
  const esNueva = !salida;
  const [valores, setValores] = useState(() => desdeSalida(salida));
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (e) => {
    setValores({ ...valores, [campo]: e.target.value });
    if (errores[campo]) setErrores({ ...errores, [campo]: undefined });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setErrorServidor('');
    const encontrados = validar(valores, esNueva);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);
    try {
      await onGuardar(aPayload(valores));
    } catch (err) {
      setErrorServidor(err.mensaje || 'No se pudo guardar la salida');
    } finally {
      setGuardando(false);
    }
  };

  const campoTexto = (campo, etiqueta, extra = {}) => (
    <label className={`campo ${errores[campo] ? 'campo-error' : ''}`}>
      <span>{etiqueta}</span>
      <input value={valores[campo]} onChange={cambiar(campo)} {...extra} />
      {errores[campo] && <small className="msg-error">{errores[campo]}</small>}
    </label>
  );

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label={esNueva ? 'Registrar salida' : 'Editar salida'}>
      <form className="modal formulario" onSubmit={enviar} noValidate>
        <h2>{esNueva ? 'Registrar salida' : 'Editar salida'}</h2>

        {errorServidor && (
          <p className="aviso aviso-error" role="alert">
            {errorServidor}
          </p>
        )}

        <div className="form-grid">
          {campoTexto('empresa', 'Empresa *', { placeholder: 'Transportes Río Itaya' })}
          {campoTexto('embarcacion', 'Embarcación', { placeholder: 'Don José II' })}

          <label className={`campo ${errores.tipo ? 'campo-error' : ''}`}>
            <span>Tipo *</span>
            <select value={valores.tipo} onChange={cambiar('tipo')}>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
            {errores.tipo && <small className="msg-error">{errores.tipo}</small>}
          </label>

          {campoTexto('destino', 'Destino *', { placeholder: 'Nauta' })}
          {campoTexto('puerto', 'Puerto de salida *', { placeholder: 'Puerto Productores' })}
          {campoTexto('fechaHora', 'Fecha y hora de salida *', { type: 'datetime-local' })}
          {campoTexto('duracionHoras', 'Duración (horas)', { type: 'number', min: '0', step: 'any', inputMode: 'decimal' })}
          {campoTexto('precio', 'Precio (S/) *', { type: 'number', min: '0', step: 'any', inputMode: 'decimal' })}
          {campoTexto('cupos', 'Cupos disponibles', { type: 'number', min: '0', step: '1', inputMode: 'numeric' })}
        </div>

        <div className="form-acciones">
          <button type="button" className="btn btn-secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={guardando}>
            {guardando ? 'Guardando…' : esNueva ? 'Registrar salida' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
