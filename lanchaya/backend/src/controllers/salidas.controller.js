const fs = require('fs');
const path = require('path');

// Archivo de datos (se puede cambiar con la variable LANCHAYA_DATA, útil para pruebas)
const DATA_FILE =
  process.env.LANCHAYA_DATA || path.join(__dirname, '..', 'data', 'salidas.json');

const TIPOS = ['lancha', 'rapido', 'deslizador'];
const REGEX_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- Persistencia en archivo JSON ---------- */

function leer() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function guardar(salidas) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(salidas, null, 2), 'utf-8');
}

/* ---------- Validación ---------- */

const esTextoValido = (v) => typeof v === 'string' && v.trim().length > 0;
const esNumero = (v) => typeof v === 'number' && Number.isFinite(v);
const estaVacio = (v) => v === undefined || v === null || v === '';

/**
 * Devuelve un arreglo de mensajes de error (vacío si todo está bien).
 * esNueva = true aplica la regla "la fecha no puede estar en el pasado".
 */
function validar(body, esNueva) {
  const errores = [];
  const b = body && typeof body === 'object' ? body : {};

  ['empresa', 'destino', 'puerto', 'fechaHora'].forEach((campo) => {
    if (!esTextoValido(b[campo])) {
      errores.push(`El campo "${campo}" es obligatorio`);
    }
  });

  if (!esNumero(b.precio) || b.precio <= 0) {
    errores.push('El campo "precio" debe ser un número mayor que 0');
  }

  if (!TIPOS.includes(b.tipo)) {
    errores.push(`El campo "tipo" solo acepta: ${TIPOS.join(', ')}`);
  }

  if (esTextoValido(b.fechaHora)) {
    const fecha = new Date(b.fechaHora);
    if (!REGEX_FECHA_HORA.test(b.fechaHora) || Number.isNaN(fecha.getTime())) {
      errores.push('El campo "fechaHora" debe tener formato ISO 8601 (ej. 2026-11-09T06:30)');
    } else if (esNueva && fecha.getTime() < Date.now()) {
      errores.push('El campo "fechaHora" no puede estar en el pasado');
    }
  }

  if (!estaVacio(b.embarcacion) && typeof b.embarcacion !== 'string') {
    errores.push('El campo "embarcacion" debe ser texto');
  }
  if (!estaVacio(b.duracionHoras) && (!esNumero(b.duracionHoras) || b.duracionHoras <= 0)) {
    errores.push('El campo "duracionHoras" debe ser un número mayor que 0');
  }
  if (!estaVacio(b.cupos) && (!Number.isInteger(b.cupos) || b.cupos < 0)) {
    errores.push('El campo "cupos" debe ser un entero mayor o igual a 0');
  }

  return errores;
}

/** Deja solo los campos del modelo y limpia espacios. */
function limpiar(b) {
  return {
    empresa: b.empresa.trim(),
    embarcacion: typeof b.embarcacion === 'string' ? b.embarcacion.trim() : '',
    tipo: b.tipo,
    destino: b.destino.trim(),
    puerto: b.puerto.trim(),
    fechaHora: b.fechaHora.trim(),
    duracionHoras: estaVacio(b.duracionHoras) ? null : b.duracionHoras,
    precio: b.precio,
    cupos: estaVacio(b.cupos) ? null : b.cupos,
  };
}

function responder400(res, errores) {
  return res.status(400).json({ error: errores.join('. '), errores });
}

const normalizar = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* ---------- Controladores ---------- */

function listar(req, res) {
  const { destino, fecha, tipo, q } = req.query;

  if (fecha && !REGEX_FECHA.test(fecha)) {
    return responder400(res, ['El filtro "fecha" debe tener formato AAAA-MM-DD']);
  }
  if (tipo && !TIPOS.includes(tipo)) {
    return responder400(res, [`El filtro "tipo" solo acepta: ${TIPOS.join(', ')}`]);
  }

  let salidas = leer();

  if (destino) salidas = salidas.filter((s) => normalizar(s.destino) === normalizar(destino));
  if (fecha) salidas = salidas.filter((s) => s.fechaHora.startsWith(fecha));
  if (tipo) salidas = salidas.filter((s) => s.tipo === tipo);
  if (q) {
    const texto = normalizar(q);
    salidas = salidas.filter(
      (s) => normalizar(s.empresa).includes(texto) || normalizar(s.embarcacion || '').includes(texto)
    );
  }

  // Orden por fecha más próxima
  salidas.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  res.status(200).json(salidas);
}

function obtener(req, res) {
  const id = Number(req.params.id);
  const salida = leer().find((s) => s.id === id);
  if (!salida) return res.status(404).json({ error: `No existe la salida con id ${req.params.id}` });
  res.status(200).json(salida);
}

function crear(req, res) {
  const errores = validar(req.body, true);
  if (errores.length) return responder400(res, errores);

  const salidas = leer();
  const id = salidas.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  const nueva = { id, ...limpiar(req.body) };
  salidas.push(nueva);
  guardar(salidas);
  res.status(201).json(nueva);
}

function actualizar(req, res) {
  const id = Number(req.params.id);
  const salidas = leer();
  const indice = salidas.findIndex((s) => s.id === id);
  if (indice === -1) return res.status(404).json({ error: `No existe la salida con id ${req.params.id}` });

  const errores = validar(req.body, false);
  if (errores.length) return responder400(res, errores);

  const actualizada = { id, ...limpiar(req.body) };
  salidas[indice] = actualizada;
  guardar(salidas);
  res.status(200).json(actualizada);
}

function eliminar(req, res) {
  const id = Number(req.params.id);
  const salidas = leer();
  const indice = salidas.findIndex((s) => s.id === id);
  if (indice === -1) return res.status(404).json({ error: `No existe la salida con id ${req.params.id}` });

  salidas.splice(indice, 1);
  guardar(salidas);
  res.status(204).send();
}

function destinos(req, res) {
  const lista = [...new Set(leer().map((s) => s.destino))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );
  res.status(200).json(lista);
}

module.exports = { listar, obtener, crear, actualizar, eliminar, destinos, validar, TIPOS };
