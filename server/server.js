import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.join(__dirname, '..');
const PORT       = process.env.PORT || 4173;

const app = express();
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API
app.use('/api', apiRouter);

// Estáticos
app.use(express.static(ROOT, {
  extensions: ['html'],
  maxAge: '1h'
}));

// Fallback a páginas .html en /pages
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   VALKIRIA BIKES  —  servidor activo     ║`);
  console.log(`║   http://localhost:${PORT}                   ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});
