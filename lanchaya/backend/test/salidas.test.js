// Pruebas de la lógica del controlador sin necesidad de levantar Express.
// Uso: npm test   (usa una copia temporal de los datos, no modifica salidas.json)
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const tmp = path.join(os.tmpdir(), `lanchaya-test-${process.pid}.json`);
fs.copyFileSync(path.join(__dirname, '..', 'src', 'data', 'salidas.json'), tmp);
process.env.LANCHAYA_DATA = tmp;

const ctrl = require('../src/controllers/salidas.controller');

function llamar(handler, { params = {}, query = {}, body = {} } = {}) {
  const r = { status: 200, body: undefined };
  const res = {
    status(c) { r.status = c; return this; },
    json(b) { r.body = b; return this; },
    send() { return this; },
  };
  handler({ params, query, body }, res);
  return r;
}

const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
const valida = { empresa: 'Prueba SAC', embarcacion: 'Test I', tipo: 'lancha', destino: 'Nauta', puerto: 'Puerto Henry', fechaHora: manana, duracionHoras: 3, precio: 15, cupos: 20 };
let ok = 0;
const t = (nombre, fn) => { fn(); ok++; console.log('  ✓', nombre); };

t('GET listar devuelve 12+ salidas ordenadas por fecha', () => {
  const r = llamar(ctrl.listar);
  assert.equal(r.status, 200);
  assert.ok(r.body.length >= 12);
  for (let i = 1; i < r.body.length; i++)
    assert.ok(new Date(r.body[i - 1].fechaHora) <= new Date(r.body[i].fechaHora));
});
t('filtro por destino', () => {
  const r = llamar(ctrl.listar, { query: { destino: 'nauta' } });
  assert.ok(r.body.length > 0 && r.body.every((s) => s.destino === 'Nauta'));
});
t('filtro por fecha', () => {
  const r = llamar(ctrl.listar, { query: { fecha: '2026-11-09' } });
  assert.ok(r.body.length > 0 && r.body.every((s) => s.fechaHora.startsWith('2026-11-09')));
});
t('filtro por tipo', () => {
  const r = llamar(ctrl.listar, { query: { tipo: 'deslizador' } });
  assert.ok(r.body.length > 0 && r.body.every((s) => s.tipo === 'deslizador'));
});
t('filtros combinados', () => {
  const r = llamar(ctrl.listar, { query: { destino: 'Nauta', tipo: 'rapido', fecha: '2026-11-09' } });
  assert.equal(r.body.length, 1);
});
t('búsqueda por texto', () => {
  const r = llamar(ctrl.listar, { query: { q: 'golfinho' } });
  assert.ok(r.body.length >= 2);
});
t('tipo inválido en filtro -> 400', () => {
  assert.equal(llamar(ctrl.listar, { query: { tipo: 'barco' } }).status, 400);
});
t('GET por id existente -> 200', () => {
  assert.equal(llamar(ctrl.obtener, { params: { id: '1' } }).status, 200);
});
t('GET por id inexistente -> 404', () => {
  assert.equal(llamar(ctrl.obtener, { params: { id: '999' } }).status, 404);
});
t('POST válido -> 201 con id autogenerado', () => {
  const r = llamar(ctrl.crear, { body: valida });
  assert.equal(r.status, 201);
  assert.equal(r.body.id, 13);
});
t('POST sin campos obligatorios -> 400', () => {
  const r = llamar(ctrl.crear, { body: {} });
  assert.equal(r.status, 400);
  assert.ok(r.body.error.includes('empresa'));
});
t('POST precio <= 0 -> 400', () => {
  assert.equal(llamar(ctrl.crear, { body: { ...valida, precio: 0 } }).status, 400);
  assert.equal(llamar(ctrl.crear, { body: { ...valida, precio: -5 } }).status, 400);
  assert.equal(llamar(ctrl.crear, { body: { ...valida, precio: 'abc' } }).status, 400);
});
t('POST tipo inválido -> 400', () => {
  assert.equal(llamar(ctrl.crear, { body: { ...valida, tipo: 'barco' } }).status, 400);
});
t('POST fecha en el pasado -> 400', () => {
  const r = llamar(ctrl.crear, { body: { ...valida, fechaHora: '2020-01-01T10:00' } });
  assert.equal(r.status, 400);
  assert.ok(r.body.error.includes('pasado'));
});
t('POST fecha con formato inválido -> 400', () => {
  assert.equal(llamar(ctrl.crear, { body: { ...valida, fechaHora: 'mañana' } }).status, 400);
});
t('PUT válido -> 200', () => {
  const r = llamar(ctrl.actualizar, { params: { id: '13' }, body: { ...valida, precio: 99 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.precio, 99);
});
t('PUT inexistente -> 404', () => {
  assert.equal(llamar(ctrl.actualizar, { params: { id: '999' }, body: valida }).status, 404);
});
t('PUT inválido -> 400', () => {
  assert.equal(llamar(ctrl.actualizar, { params: { id: '13' }, body: { ...valida, empresa: '' } }).status, 400);
});
t('DELETE -> 204 y luego 404', () => {
  assert.equal(llamar(ctrl.eliminar, { params: { id: '13' } }).status, 204);
  assert.equal(llamar(ctrl.eliminar, { params: { id: '13' } }).status, 404);
});
t('GET destinos sin repetir', () => {
  const r = llamar(ctrl.destinos);
  assert.equal(r.status, 200);
  assert.equal(new Set(r.body).size, r.body.length);
  assert.ok(r.body.includes('Nauta') && r.body.includes('Santa Rosa'));
});

fs.unlinkSync(tmp);
console.log(`\n${ok} pruebas OK`);
