import axios from 'axios';

// En desarrollo, Vite redirige /api hacia http://localhost:3000 (ver vite.config.js).
// Si el backend está en otra dirección, define VITE_API_URL (ej. http://localhost:3000/api).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
});

/** Convierte un error de axios en un mensaje legible para el usuario. */
export function mensajeDeError(error) {
  if (error.response) {
    return error.response.data?.error || `Error del servidor (${error.response.status})`;
  }
  return 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.';
}

export async function obtenerSalidas(filtros = {}) {
  const params = {};
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) params[clave] = valor;
  });
  const { data } = await api.get('/salidas', { params });
  return data;
}

export async function obtenerDestinos() {
  const { data } = await api.get('/destinos');
  return data;
}

export async function crearSalida(salida) {
  const { data } = await api.post('/salidas', salida);
  return data;
}

export async function actualizarSalida(id, salida) {
  const { data } = await api.put(`/salidas/${id}`, salida);
  return data;
}

export async function eliminarSalida(id) {
  await api.delete(`/salidas/${id}`);
}
