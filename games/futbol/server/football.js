// Online Futbol - EsekGames hub'ina baglanabilir oyun modulu.
//
// createFootball({ mountPath }) ->
//   router        : Express router (api/rooms, health)
//   handleUpgrade : WebSocket upgrade handler (hub sunucusu kendi server'ini yonlendirir)
//   listRooms     : aktif oda listesi
//
// Modul hem EsekGames kok sunucusuna (games/futbol) hem de tek basina
// (server/standalone.js) calisabilir.

import express from 'express';
import { WebSocketServer } from 'ws';

import { RoomManager } from './rooms.js';
import {
  safeJson, sanitizeName, sanitizeChat, sanitizeRoom, sanitizeInput,
  sanitizeMode,
} from './net.js';
import { TICK } from '../shared/constants.js';

export function createFootball({ mountPath = '' } = {}) {
  const manager = new RoomManager();
  const router = express.Router();
  const wss = new WebSocketServer({ noServer: true });

  router.get('/health', (_req, res) => {
    res.json({ ok: true, rooms: manager.rooms.size, uptime: Math.round(process.uptime()) });
  });

  router.get('/api/rooms', (_req, res) => {
    res.json({ rooms: manager.list() });
  });

  // ---------------------------------------------------------------- yardimcilar

  function send(ws, obj) {
    if (ws.readyState === 1) ws.send(JSON.stringify(obj));
  }

  function broadcast(room, obj) {
    const s = JSON.stringify(obj);
    for (const ws of room.clients) {
      if (ws.readyState === 1) ws.send(s);
    }
  }

  function roomOf(ws) {
    if (!ws.meta?.room) return null;
    return manager.get(ws.meta.room) || null;
  }

  function pushRoster(room) {
    broadcast(room, { t: 'roster', players: room.roster() });
  }

  // ---------------------------------------------------------------- baglanti

  wss.on('connection', (ws) => {
    ws.meta = { id: null, room: null, alive: true };

    ws.on('message', (raw) => {
      const msg = safeJson(raw.toString());
      if (!msg) return;
      handleMessage(ws, msg);
    });

    ws.on('close', () => leave(ws));
    ws.on('error', () => {});
    ws.on('pong', () => { ws.meta.alive = true; });
  });

  function handleMessage(ws, msg) {
    switch (msg.t) {
      case 'join': {
        if (ws.meta.room) return;
        const name = sanitizeName(msg.nm);
        const mode = sanitizeMode(msg.md);
        const code = sanitizeRoom(msg.room) || manager.randomCode();
        const room = manager.ensure(code, mode);

        if (room.humanCount() >= room.capacity()) {
          send(ws, { t: 'error', msg: 'Oda dolu, baska bir oda kodu dene.' });
          return;
        }

        const p = room.addHuman(name);
        if (!p) {
          send(ws, { t: 'error', msg: 'Odaya alinamadi.' });
          return;
        }

        ws.meta.id = p.id;
        ws.meta.room = room.code;
        room.clients.add(ws);

        send(ws, {
          t: 'welcome', id: p.id, room: room.code, team: p.team,
          tickHz: TICK.hz, snapHz: TICK.snapHz,
          size: room.teamSize,
        });
        send(ws, { t: 'roster', players: room.roster() });
        send(ws, room.snapshot());
        broadcast(room, { t: 'event', kind: 'join', nm: p.name, i: p.id });
        pushRoster(room);
        break;
      }

      case 'input': {
        const room = roomOf(ws);
        if (!room) return;
        const p = room.players.get(ws.meta.id);
        if (!p) return;
        p.input = sanitizeInput(msg);
        // Depar (kayma) istegi: tick'e kadar kaybolmaması için ayrica isaretlenir.
        if (p.input.d) p.dashQueued = true;
        break;
      }

      case 'chat': {
        const room = roomOf(ws);
        if (!room) return;
        const p = room.players.get(ws.meta.id);
        const text = sanitizeChat(msg.msg);
        if (!p || !text) return;
        broadcast(room, { t: 'chat', nm: p.name, msg: text });
        break;
      }

      case 'again': {
        const room = roomOf(ws);
        if (!room) return;
        room.resetMatch();
        broadcast(room, { t: 'event', kind: 'restart' });
        break;
      }

      case 'ping': {
        send(ws, { t: 'pong', ts: Number(msg.ts) || 0 });
        break;
      }

      default:
        break;
    }
  }

  function leave(ws) {
    const room = roomOf(ws);
    if (!room) return;
    room.clients.delete(ws);
    const p = room.players.get(ws.meta.id);
    if (p) {
      room.removeHuman(p.id);
      broadcast(room, { t: 'event', kind: 'leave', nm: p.name, i: p.id });
      pushRoster(room);
    }
    ws.meta.room = null;
    ws.meta.id = null;
  }

  // ---------------------------------------------------------------- oyun dongusu

  let last = Date.now();
  let acc = 0;

  const loop = setInterval(() => {
    const now = Date.now();
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;

    const stepDt = 1 / TICK.hz;
    let guard = 0;
    while (acc >= stepDt && guard++ < 10) {
      for (const room of manager.rooms.values()) room.step(stepDt);
      acc -= stepDt;
    }

    const snapEvery = 1 / TICK.snapHz;
    for (const room of manager.rooms.values()) {
      room.snapAcc += dt;
      if (room.snapAcc < snapEvery) continue;
      room.snapAcc = 0;
      if (room.clients.size === 0) continue;

      const s = JSON.stringify(room.snapshot());
      for (const ws of room.clients) {
        if (ws.readyState === 1) ws.send(s);
      }

      if (room.events.length) {
        for (const ev of room.events) broadcast(room, { t: 'event', ...ev });
        room.events.length = 0;
      }
    }
  }, 1000 / 60);

  const cleanupTimer = setInterval(() => manager.cleanup(), 30000);

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.meta?.alive === false) {
        ws.terminate();
        continue;
      }
      ws.meta.alive = false;
      try { ws.ping(); } catch { /* yoksay */ }
    }
  }, 15000);

  function handleUpgrade(req, socket, head) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  }

  return {
    router,
    handleUpgrade,
    manager,
    mountPath,
    listRooms: () => manager.list(),
    stop() {
      clearInterval(loop);
      clearInterval(cleanupTimer);
      clearInterval(heartbeat);
    },
  };
}
