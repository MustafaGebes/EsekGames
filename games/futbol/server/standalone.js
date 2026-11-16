// Online Futbol - tek basina calistirilabilir sunucu (ayri Render servisi icin).
// EsekGames kok sunucusu kullandiginda bu dosya gerekmez; oyun
// server/football.js fabrikasi ile koke baglanir.

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

import { createFootball } from './football.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
const football = createFootball();

const staticMaxAge = process.env.NODE_ENV === 'production' ? '5m' : 0;

app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use('/shared', express.static(path.join(ROOT, 'shared'), { maxAge: staticMaxAge, etag: true }));
app.use(express.static(path.join(ROOT, 'public'), { maxAge: staticMaxAge, etag: true }));
app.use('/', football.router);

const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  const requestPath = String(req.url || '').split('?')[0];
  if (requestPath === '/ws' || requestPath.startsWith('/ws/')) {
    football.handleUpgrade(req, socket, head);
    return;
  }
  socket.destroy();
});

server.listen(PORT, () => {
  console.log(`Online Futbol sunucusu http://localhost:${PORT} adresinde calisiyor`);
});
