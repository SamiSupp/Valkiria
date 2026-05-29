import { Router } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const DATA_DIR   = path.join(__dirname, '..', 'data');
const INBOX_FILE = path.join(DATA_DIR, 'inbox.json');

async function readJSON(file) {
  const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
  return JSON.parse(raw);
}

async function appendInbox(entry) {
  let existing = [];
  try { existing = JSON.parse(await fs.readFile(INBOX_FILE, 'utf-8')); } catch {}
  existing.push({ ...entry, recibido: new Date().toISOString() });
  await fs.writeFile(INBOX_FILE, JSON.stringify(existing, null, 2));
}

const router = Router();

router.get('/productos', async (_req, res) => {
  try {
    const productos = await readJSON('productos.json');
    res.json(productos);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo leer productos' });
  }
});

router.get('/productos/:id', async (req, res) => {
  try {
    const productos = await readJSON('productos.json');
    const p = productos.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'No encontrado' });
    res.json(p);
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

router.get('/marcas', async (_req, res) => {
  try {
    res.json(await readJSON('marcas.json'));
  } catch {
    res.status(500).json({ error: 'No se pudo leer marcas' });
  }
});

router.post('/contacto', async (req, res) => {
  const { nombre, email, mensaje } = req.body || {};
  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ ok: false, message: 'Faltan campos requeridos.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: 'Correo inválido.' });
  }
  try {
    await appendInbox({ tipo: 'contacto', ...req.body });
    res.json({ ok: true, message: '¡Gracias! Te contactaremos en menos de 24 horas.' });
  } catch {
    res.status(500).json({ ok: false, message: 'No se pudo guardar el mensaje.' });
  }
});

router.post('/newsletter', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: 'Correo inválido.' });
  }
  try {
    await appendInbox({ tipo: 'newsletter', email });
    res.json({ ok: true, message: 'Suscripción confirmada.' });
  } catch {
    res.status(500).json({ ok: false, message: 'Error al guardar.' });
  }
});

router.post('/checkout', async (req, res) => {
  const { items, total } = req.body || {};
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ ok: false, message: 'Carrito vacío.' });
  }
  const orderId = 'VLK-' + Date.now().toString(36).toUpperCase();
  try {
    await appendInbox({ tipo: 'pedido', orderId, items, total });
    res.json({
      ok: true,
      orderId,
      message: `Pedido ${orderId} registrado. Te contactaremos para coordinar el pago.`
    });
  } catch {
    res.status(500).json({ ok: false, message: 'No se pudo registrar el pedido.' });
  }
});

export default router;
