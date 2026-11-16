// Ana akış: lobby -> oyun, WebSocket bağlantısı, oyun döngüsü.

import { Net } from './net.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { Hud } from './hud.js';
import { Predictor } from '../shared/predictor.js';
import { TEAM_COLORS, PITCH } from '../shared/constants.js';

const $ = (id) => document.getElementById(id);

const els = {
  lobby: $('lobby'),
  game: $('game'),
  name: $('nameInput'),
  room: $('roomInput'),
  mode: $('modeSelect'),
  play: $('playBtn'),
  newRoom: $('newRoomBtn'),
  status: $('lobbyStatus'),
  canvas: $('pitch'),
  chatForm: $('chatForm'),
  chatInput: $('chatInput'),
  touch: $('touchControls'),
  joystick: $('joystick'),
  stick: $('stick'),
  btnShoot: $('btnShoot'),
  btnPass: $('btnPass'),
  btnDash: $('btnDash'),
  zoomBtn: $('zoomBtn'),
  again: $('againBtn'),
  roomList: $('roomList'),
};

const hud = new Hud();
const input = new Input();
const predictor = new Predictor();
input.bind();

let net = null;
let renderer = null;
let myId = null;
let myTeam = 0;
let pendingJoin = null;
let predicted = null;
let loopStarted = false;
let zoom = localStorage.getItem('futbol.zoom') === 'near' ? 'near' : 'far';

// Oyun EsekGames icinde /games/futbol/ altinda ya da tek basina (kok dizinde)
// calisabilir. WebSocket ve API yollari sayfanin konumundan turetilir.
function computeBasePath() {
  const p = location.pathname;
  if (p.endsWith('/')) return p;
  if (p.endsWith('index.html')) return p.slice(0, p.length - 'index.html'.length);
  return `${p}/`;
}

const BASE_PATH = computeBasePath();

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}${BASE_PATH}ws`;
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ------------------------------------------------------------------ baglanti

els.name.value = localStorage.getItem('futbol.name') || '';
els.newRoom.addEventListener('click', () => { els.room.value = randomCode(); });

// Baglanti sayfa acilinca kurulur; boylece lobby durumu gercek durumu yansitir.
function ensureNet() {
  if (net) return net;
  net = new Net(wsUrl());
  net.onStatus = setStatus;
  net.onPing = (v) => hud.setPing(v);
  registerHandlers(net);
  net.connect();
  return net;
}

ensureNet();

els.play.addEventListener('click', () => {
  const nm = (els.name.value || 'Oyuncu').trim().slice(0, 16) || 'Oyuncu';
  localStorage.setItem('futbol.name', nm);
  const room = (els.room.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const mode = Number(els.mode?.value) || 5;

  ensureNet();
  pendingJoin = { nm, room, md: mode };
  if (net.status === 'online') {
    net.send({ t: 'join', ...pendingJoin });
    pendingJoin = null;
  }
});

els.again.addEventListener('click', () => {
  net?.send({ t: 'again' });
  hud.hideAgain();
});

els.zoomBtn.addEventListener('click', () => {
  zoom = zoom === 'near' ? 'far' : 'near';
  localStorage.setItem('futbol.zoom', zoom);
  renderer?.setZoom(zoom);
  hud.setZoomLabel(zoom);
});

// Aktif odalari listele; koda tiklayinca oda kutusuna yazilir.
async function refreshRooms() {
  try {
    const res = await fetch(`${BASE_PATH}api/rooms`, { cache: 'no-store' });
    const data = await res.json();
    renderRooms(data.rooms || []);
  } catch {
    /* sunucu su an kapali olabilir */
  }
}

function renderRooms(rooms) {
  const list = els.roomList;
  if (!list) return;
  list.innerHTML = '';
  const open = rooms.filter((r) => r.humans > 0);
  if (!open.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Şu an açık oda yok — yeni oda açabilirsin.';
    list.appendChild(li);
    return;
  }
  for (const r of open) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.append(document.createTextNode(r.code));
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = `${r.size || 5}v${r.size || 5} · ${r.humans} kişi`;
    btn.append(count);
    btn.addEventListener('click', () => {
      els.room.value = r.code;
      if (r.size) els.mode.value = String(r.size);
      els.room.focus();
    });
    li.append(btn);
    list.appendChild(li);
  }
}

refreshRooms();
setInterval(refreshRooms, 5000);

els.chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = els.chatInput.value.trim();
  if (!msg) return;
  net?.send({ t: 'chat', msg });
  els.chatInput.value = '';
});

els.btnShoot.addEventListener('touchstart', (e) => { input.shot = true; e.preventDefault(); }, { passive: false });
els.btnPass.addEventListener('touchstart', (e) => { input.pass = true; e.preventDefault(); }, { passive: false });
els.btnDash.addEventListener('touchstart', (e) => { input.dash = true; e.preventDefault(); }, { passive: false });

function setStatus(s) {
  const map = {
    connecting: 'Sunucuya bağlanılıyor…',
    online: 'Bağlandı! Oyna düğmesine bas.',
    offline: 'Bağlantı koptu, yeniden deneniyor…',
  };
  if (s === 'online') {
    els.status.textContent = 'Sunucu bağlantısı hazır.';
    els.status.className = 'status ok';
    if (pendingJoin) {
      net.send({ t: 'join', ...pendingJoin });
      pendingJoin = null;
    }
  } else {
    els.status.textContent = map[s] || s;
    els.status.className = 'status';
  }
  hud.setConn(s === 'online' ? 'Bağlı' : s === 'connecting' ? 'Bağlanıyor' : 'Koptu');
}

function teamName(t) {
  return TEAM_COLORS[t]?.name || 'Takım';
}

function registerHandlers(n) {
  n.on('welcome', (m) => {
    myId = m.id;
    myTeam = m.team;
    els.lobby.classList.add('hidden');
    els.game.classList.remove('hidden');
    input.enabled = true;
    renderer = new Renderer(els.canvas);
    renderer.setZoom(zoom);
    hud.setZoomLabel(zoom);
    predicted = { x: PITCH_CENTER.x, y: PITCH_CENTER.y, vx: 0, vy: 0, fx: 0, tm: myTeam };
    hud.center(`Odaya katıldın: ${m.room}`, 2200);
    if (window.matchMedia('(pointer: coarse)').matches) {
      els.touch.classList.remove('hidden');
      document.body.classList.add('touch-mode');
      input.bindTouch(els.joystick, els.stick);
    }
    if (!loopStarted) { loopStarted = true; requestAnimationFrame(loop); }
  });

  n.on('roster', (m) => {
    renderer?.setRoster(m.players);
    hud.setRoster(m.players, myId);
  });

  n.on('snapshot', (m) => {
    renderer?.push(m);
    const me = m.players.find((p) => p.i === myId);
    if (me) {
      predictor.reconcile(me);
      predicted = {
        ...predictor.state,
        x: predictor.renderX,
        y: predictor.renderY,
        tm: me.tm,
        sl: me.sl,
        dsh: me.dsh,
      };
    }
    hud.setScore(m.score, m.tl, m.phase, m.golden, m.goldenLeft);
  });

  n.on('event', (m) => {
    if (m.kind === 'goal') {
      if (m.own) {
        hud.center('Kendi kaleye gol!', 2600);
      } else if (m.golden) {
        hud.center(`ALTIN GOL! ${m.by || teamName(m.team)}`, 3200);
      } else {
        hud.center(`GOL! ${m.by ? `${m.by} — ` : ''}${teamName(m.team)}`, 2400);
      }
    } else if (m.kind === 'golden') {
      hud.center('ALTIN GOL — İlk golü atan kazanır', 4000);
    } else if (m.kind === 'end') {
      const w = m.winner;
      if (w === -1 || w === undefined || w === null) {
        hud.center('Maç berabere', 8000);
      } else if (w === myTeam) {
        hud.center('Kazandın!', 8000);
      } else {
        hud.center('Kaybettin', 8000);
      }
      hud.showAgain();
    } else if (m.kind === 'restart') {
      hud.center('Yeni maç başlıyor', 2000);
      hud.hideAgain();
    } else if (m.kind === 'join') {
      hud.toast(`${m.nm} katıldı`);
    } else if (m.kind === 'leave') {
      hud.toast(`${m.nm} ayrıldı`);
    }
  });

  n.on('chat', (m) => hud.addChat(m.nm, m.msg));

  n.on('error', (m) => {
    els.status.textContent = m.msg;
    els.status.className = 'status err';
  });
}

const PITCH_CENTER = { x: PITCH.w / 2, y: PITCH.h / 2 };

let lastFrame = performance.now();
let sendAcc = 0;
let pendingShot = false;
let pendingPass = false;
let pendingDash = false;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  const inp = input.sample();
  pendingShot = pendingShot || inp.k;
  pendingPass = pendingPass || inp.p;
  pendingDash = pendingDash || inp.d;

  predictor.step(dt, inp);
  if (predicted && predictor.state) {
    // Ekranda cizilen konum: mantiksal konum + yumusak gorsel ofset.
    predicted.x = predictor.renderX;
    predicted.y = predictor.renderY;
    predicted.fx = predictor.state.fx;
  }

  sendAcc += dt;
  // Depar istegi beklemeden gonderilir: sunucu ile istemci arasindaki
  // gecikme kucultulur, depar daha akici baslar.
  if (sendAcc >= 0.05 || pendingDash) {
    sendAcc = 0;
    net?.send({
      t: 'input', mx: inp.mx, my: inp.my, sp: inp.sp,
      k: pendingShot, p: pendingPass, d: pendingDash,
    });
    pendingShot = false;
    pendingPass = false;
    pendingDash = false;
  }

  renderer?.draw(now, myId, predicted);
}

window.addEventListener('resize', () => renderer?.resize());
