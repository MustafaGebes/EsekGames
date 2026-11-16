// Online Futbol - EsekGames hub'ina baglanabilir oyun modulu.
//
// createFootball({ mountPath }) ->
//   router        : Express router (api/rooms, health)
//   handleUpgrade : WebSocket upgrade handler (hub sunucusu kendi server'ini yonlendirir)
//   listRooms     : aktif oda listesi
//
// Modul hem EsekGames kok sunucusuna (games/futbol) hem de tek basina
// (server/standalone.js) calisabilir.
//
// Protokol (yeni):
//   Client -> Server : join (nm, md, room?, create?) · input · chat · again · ping
//                      · startnow (oda sahibi erken baslatir) · leave (lobiden cikar)
//   Server -> Client : welcome · roomstate (lobi durumu) · start (mac basladi)
//                      · rooms (canli sunucu listesi) · announcements · roster
//                      · snapshot · event · chat · pong

import express from 'express';
import { WebSocketServer } from 'ws';

import { RoomManager } from './rooms.js';
import {
  safeJson, sanitizeName, sanitizeChat, sanitizeRoom, sanitizeInput,
  sanitizeMode,
} from './net.js';
import { TICK, ANNOUNCEMENTS, LOBBY } from '../shared/constants.js';

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

  function pushRoomState(room) {
    broadcast(room, { t: 'roomstate', ...room.roomState() });
  }

  // Canli sunucu listesini butun bagli istemcilere gonder (menu ekrani).
  function pushRooms() {
    const s = JSON.stringify({ t: 'rooms', rooms: manager.list() });
    for (const ws of wss.clients) {
      if (ws.readyState === 1) ws.send(s);
    }
  }

  // ---------------------------------------------------------------- baglanti

  wss.on('connection', (ws) => {
    ws.meta = { id: null, room: null, alive: true };

    // Menude gosterilen duyurular.
    send(ws, { t: 'announcements', items: ANNOUNCEMENTS });
    send(ws, { t: 'rooms', rooms: manager.list() });

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

        // Oda secimi:
        //  - create:true  -> her zaman yeni oda kur
        //  - room kodu    -> o kodla odaya katil (yoksa kur)
        //  - hicbiri      -> hizli eslesme: uygun acik oda, yoksa yeni oda
        let room;
        if (msg.create) {
          room = manager.create(mode);
        } else {
          const code = sanitizeRoom(msg.room);
          if (code) {
            room = manager.ensure(code, mode);
          } else {
            room = manager.findOpen(mode) || manager.create(mode);
          }
        }

        if (room.humanCount() >= room.capacity() || room.started) {
          send(ws, { t: 'error', msg: 'Oda dolu, baska bir oda sec.' });
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
          size: room.teamSize, host: room.hostId === p.id,
        });
        send(ws, { t: 'roster', players: room.roster() });
        send(ws, { t: 'roomstate', ...room.roomState() });
        broadcast(room, { t: 'event', kind: 'join', nm: p.name, i: p.id });
        pushRoster(room);
        pushRoomState(room);
        pushRooms();
        break;
      }

      case 'input': {
        const room = roomOf(ws);
        if (!room) return;
        if (!room.started) return;   // lobi sirasinda girdi yok sayilir
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

      case 'startnow': {
        // Oda sahibi beklemeden maci baslatabilir.
        const room = roomOf(ws);
        if (!room) return;
        if (room.hostId !== ws.meta.id) return;
        room.lobbyLeft = 0;
        room.startMatch();
        break;
      }

      case 'leave': {
        // Lobiden cik: oyuncu menuye doner.
        const room = roomOf(ws);
        if (!room) {
          send(ws, { t: 'left' });
          return;
        }
        const p = room.players.get(ws.meta.id);
        room.clients.delete(ws);
        if (p) {
          room.removeHuman(p.id);
          broadcast(room, { t: 'event', kind: 'leave', nm: p.name, i: p.id });
          pushRoster(room);
          pushRoomState(room);
        }
        ws.meta.room = null;
        ws.meta.id = null;
        send(ws, { t: 'left' });
        pushRooms();
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
      pushRoomState(room);
    }
    ws.meta.room = null;
    ws.meta.id = null;
    pushRooms();
  }

  // ---------------------------------------------------------------- oyun dongusu

  let last = Date.now();
  let acc = 0;
  let roomsAcc = 0;

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

    // Olayler aninda yayinlanir (mac baslama bildirimi gecikmesin).
    let startedChanged = false;
    for (const room of manager.rooms.values()) {
      if (!room.events.length) continue;
      for (const ev of room.events) {
        broadcast(room, { t: 'event', ...ev });
        if (ev.kind === 'start' || ev.kind === 'restart') startedChanged = true;
      }
      room.events.length = 0;
    }
    if (startedChanged) pushRooms();

    // Lobi durumu: baslamamis odalarda geri sayim bilgisi.
    for (const room of manager.rooms.values()) {
      if (room.started) continue;
      room.stateAcc += dt;
      if (room.stateAcc < 0.25) continue;
      room.stateAcc = 0;
      pushRoomState(room);
    }

    const snapEvery = 1 / TICK.snapHz;
    for (const room of manager.rooms.values()) {
      if (!room.started) continue;   // lobi sirasinda snapshot gonderilmez
      room.snapAcc += dt;
      if (room.snapAcc < snapEvery) continue;
      room.snapAcc = 0;
      if (room.clients.size === 0) continue;

      const s = JSON.stringify(room.snapshot());
      for (const ws of room.clients) {
        if (ws.readyState === 1) ws.send(s);
      }
    }

    // Canli sunucu listesi (menu ekrani).
    roomsAcc += dt;
    if (roomsAcc >= LOBBY.roomListHz) {
      roomsAcc = 0;
      pushRooms();
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
