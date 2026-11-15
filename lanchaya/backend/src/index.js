const express = require('express');
const cors = require('cors');
const salidasRouter = require('./routes/salidas');
const ctrl = require('./controllers/salidas.controller');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/destinos', ctrl.destinos);
app.use('/api/salidas', salidasRouter);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Middleware de manejo de errores (4 parámetros)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // JSON mal formado en el cuerpo de la petición
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LanchaYa API escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app;
