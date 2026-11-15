# 🚤 LanchaYa Iquitos

Aplicación web full stack donde las empresas fluviales registran sus salidas y los pasajeros las consultan y filtran por **destino**, **fecha** y **tipo de embarcación**.

En Iquitos no hay carretera hacia el resto del país: el río es el transporte principal hacia Nauta, Requena, Yurimaguas, Pucallpa, Santa Rosa o Caballococha. Hoy los horarios y precios se consiguen yendo a los puertos, por pizarras o por publicaciones sueltas. LanchaYa los reúne en un solo lugar.

## Integrantes

- **[Escribe aquí tu nombre y apellidos]**
- *(segundo integrante, si trabajaron en pareja)*

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Node.js 20+ y Express 4 (`express`, `cors`, `nodemon`) |
| Persistencia | Archivo JSON (`backend/src/data/salidas.json`) |
| Frontend | React 18 con Vite y `axios` |
| Estilos | CSS propio, responsive (pensado para celular) |

## Requisitos previos

- [Node.js](https://nodejs.org) versión 20 o superior (incluye `npm`).

## Instalación y ejecución

Se necesitan **dos terminales**, una para el backend y otra para el frontend.

### 1. Backend (puerto 3000)

```bash
cd backend
npm install
npm run dev
```

La API queda en <http://localhost:3000/api/salidas>. Para ejecutar sin `nodemon`: `npm start`.

### 2. Frontend (puerto 5173)

```bash
cd frontend
npm install
npm run dev
```

Abre <http://localhost:5173>. Vite redirige las peticiones `/api` al backend, así que **el backend debe estar encendido**. Si lo despliegas en otra dirección, crea `frontend/.env` con `VITE_API_URL=http://tu-servidor/api`.

### Pruebas del backend (opcional)

```bash
cd backend
npm test
```

Ejecuta 20 pruebas de la lógica de la API (CRUD, filtros y validaciones) sobre una copia temporal de los datos; no modifica `salidas.json`.

## API REST

| Método | Ruta | Descripción | Respuesta |
|---|---|---|---|
| GET | `/api/salidas` | Lista salidas. Acepta `?destino=`, `?fecha=AAAA-MM-DD`, `?tipo=` y `?q=` (texto) | 200 + arreglo |
| GET | `/api/salidas/:id` | Detalle de una salida | 200 o 404 |
| POST | `/api/salidas` | Registra una salida | 201 + objeto creado, o 400 |
| PUT | `/api/salidas/:id` | Actualiza una salida | 200, 400 o 404 |
| DELETE | `/api/salidas/:id` | Elimina una salida | 204 o 404 |
| GET | `/api/destinos` | Lista de destinos sin repetir | 200 + arreglo |

El listado viene ordenado por **fecha más próxima**. Los filtros se pueden combinar.

### Reglas de validación (400 con mensaje claro)

- `empresa`, `destino`, `puerto` y `fechaHora` son obligatorios.
- `precio` es un número mayor que 0.
- `tipo` solo acepta `lancha`, `rapido` o `deslizador`.
- `fechaHora` (formato ISO 8601, ej. `2026-11-09T06:30`) no puede estar en el pasado al registrar.
- Opcionales: `duracionHoras` (> 0) y `cupos` (entero ≥ 0).

Ejemplo de error:

```json
{ "error": "El campo \"precio\" debe ser un número mayor que 0", "errores": ["El campo \"precio\" debe ser un número mayor que 0"] }
```

### Ejemplo para probar en Thunder Client / Postman

`POST http://localhost:3000/api/salidas`

```json
{
  "empresa": "Transportes Río Itaya",
  "embarcacion": "Don José II",
  "tipo": "rapido",
  "destino": "Nauta",
  "puerto": "Puerto Productores",
  "fechaHora": "2026-12-01T06:30",
  "duracionHoras": 2,
  "precio": 20,
  "cupos": 30
}
```

> Ajusta `fechaHora` a una fecha futura: la API rechaza salidas en el pasado.

## Funcionalidades del frontend

- Tarjetas con empresa, embarcación, destino, puerto, fecha y hora, duración, precio y tipo.
- Filtros por destino (llenado desde `/api/destinos`), fecha y tipo, más búsqueda por texto y botón **Limpiar filtros**.
- Formulario para **registrar y editar** salidas, con validación antes de enviar (y muestra el error del servidor si lo hay).
- **Eliminar** con confirmación.
- Estados de **carga**, **lista vacía** y **error de conexión** (con botón Reintentar).
- Indicador de **cupos con color**: verde (15 o más), amarillo (5 a 14), rojo (menos de 5).
- Diseño responsive: 1 columna en celular, 2 en tableta y 3 en pantalla grande; el formulario se abre como hoja inferior en el celular.

## Estructura del repositorio

```
lanchaya/
├── backend/
│   ├── src/
│   │   ├── index.js                       # arranque del servidor (puerto 3000)
│   │   ├── routes/salidas.js
│   │   ├── controllers/salidas.controller.js
│   │   └── data/salidas.json              # 12 salidas semilla
│   ├── test/salidas.test.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── styles.css
│   │   ├── components/                    # SalidaCard, Filtros, SalidaForm
│   │   └── services/api.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Datos de ejemplo

Las empresas y los precios de `salidas.json` son **ficticios y referenciales**. Las fechas semilla van del 9 al 16 de noviembre de 2026; si las fechas ya pasaron, puedes seguir consultándolas, pero para **registrar** nuevas salidas debes usar fechas futuras.
