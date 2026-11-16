// Ana akış: menü -> lobi -> oyun, WebSocket bağlantısı, oyun döngüsü.
//
// Akış:
//   Menü açılır. "Oyna" hızlı maç için uygun odaya katılır (yoksa yeni açar),
//   "+" yeni bir lobi kurar. Sunucu listesi canlı gelir; lobi kurulan oda da
//   listede görünür. Lobide oyuncular bekler, geri sayım bitince maç başlar.

import { Net } from './net.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { Hud } from './hud.js';
import { Predictor } from '../shared/predictor.js';
import { Lobby } from './lobby.js';
import { TEAM_COLORS, PITCH } from '../shared/constants.js';

const $ = (id) => document.getElementById(id);

const els = {
  menu: $('menu'),
  room: $('room'),
  game: $('game'),
  name: $('nameInput'),
  mode: $('modeSelect'),
  play: $('playBtn'),
  newRoom: $('newRoomBtn'),
  status: $('menuStatus'),
  announcements: $('announcementList'),
  servers: $('serverList'),
  codeInput: $('codeInput'),
  joinCode: $('joinCodeBtn'),
  roomCode: $('roomCode'),
  roomInfo: $('roomInfo'),
  roomPlayers: $('roomPlayers'),
  roomCountdown: $('roomCountdown'),
  countdownLabel: $('countdownLabel'),
  startNow: $('startBtn'),
  leaveRoom: $('leaveRoomBtn'),
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
};

const hud = new Hud();
const input = new Input();
const predictor = new Predictor();
const lobby = new Lobby(els);
input.bind();

let net = null;
let renderer = null;
let myId = null;
let myTeam = 0;
let pendingJoin = null;
let joinedRoom = null;
let lastRoster = [];
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

// ------------------------------------------------------------------ baglanti

els.name.value = localStorage.getItem('futbol.name') || '';

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

// ------------------------------------------------------------------ menu eylemleri

function playerName() {
  const nm = (els.name.value || 'Oyuncu').trim().slice(0, 16) || 'Oyuncu';
  localStorage.setItem('futbol.name', nm);
  return nm;
}

function selectedMode() {
  return Number(els.mode?.value) || 5;
}

// Hizli mac: uygun acik odaya katilir, yoksa sunucu yeni oda acar.
lobby.onJoin = () => {
  ensureNet();
  sendJoin({ nm: playerName(), md: selectedMode() });
};

// "+" : yeni lobi kur, sonra lobi ekranina gec.
lobby.onCreate = () => {
  ensureNet();
  sendJoin({ nm: playerName(), md: selectedMode(), create: true });
};

// Listeden veya kodla odaya katil.
lobby.onJoinCode = (code) => {
  ensureNet();
  sendJoin({ nm: playerName(), md: selectedMode(), room: code });
};

lobby.onStartNow = () => net?.send({ t: 'startnow' });
lobby.onLeave = () => net?.send({ t: 'leave' });

function sendJoin(payload) {
  if (net?.status === 'online') {
    net.send({ t: 'join', ...payload });
    pendingJoin = null;
  } else {
    pendingJoin = payload;
  }
}

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
    online: 'Bağlandı!',
    offline: 'Bağlantı koptu, yeniden deneniyor…',
  };
  if (s === 'online') {
    els.status.textContent = pendingJoin ? 'Odaya giriliyor…' : 'Hazır — Oyna\'ya bas.';
    els.status.className = 'status ok';
    if (pendingJoin) {
      net.send({ t: 'join', ...pendingJoin });
      pendingJoin = null;
    }
    // Yeniden baglandigimizde lobideysek ayni odaya geri don.
    if (joinedRoom && !pendingJoin && !renderer) {
      net.send({ t: 'join', nm: playerName(), md: selectedMode(), room: joinedRoom });
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

// ------------------------------------------------------------------ mesajlar

function registerHandlers(n) {
  n.on('welcome', (m) => {
    myId = m.id;
    myTeam = m.team;
    joinedRoom = m.room;
    lobby.setMyId(myId);
    // Oyun baslamadiysa lobi ekranindayiz.
    if (!renderer) lobby.showRoom();
  });

  n.on('roomstate', (m) => lobby.setRoom(m));

  n.on('rooms', (m) => lobby.setServers(m.rooms));

  n.on('announcements', (m) => lobby.setAnnouncements(m.items));

  n.on('left', () => {
    joinedRoom = null;
    lobby.showMenu();
    els.status.textContent = 'Lobiden çıktın.';
    els.status.className = 'status';
  });

  n.on('start', () => startGame());

  n.on('roster', (m) => {
    lastRoster = m.players || [];
    renderer?.setRoster(lastRoster);
    hud.setRoster(lastRoster, myId);
  });

  n.on('snapshot', (m) => {
    if (!renderer) return;
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
    if (m.kind === 'start') {
      // Lobi bitti, mac basliyor: oyun ekranina gec.
      startGame();
    } else if (m.kind === 'goal') {
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
    // Oyun baslamadiysa menuye don.
    if (!renderer) lobby.showMenu();
  });
}

// ------------------------------------------------------------------ oyun ekrani

function startGame() {
  lobby.showGame();
  input.enabled = true;

  if (!renderer) {
    renderer = new Renderer(els.canvas);
    renderer.setZoom(zoom);
    hud.setZoomLabel(zoom);
    if (lastRoster.length) renderer.setRoster(lastRoster);
    if (lastRoster.length) hud.setRoster(lastRoster, myId);
  }

  predicted = { x: PITCH_CENTER.x, y: PITCH_CENTER.y, vx: 0, vy: 0, fx: 0, tm: myTeam };
  predictor.reset({ x: predicted.x, y: predicted.y, vx: 0, vy: 0, fx: 0 });

  if (window.matchMedia('(pointer: coarse)').matches) {
    els.touch.classList.remove('hidden');
    document.body.classList.add('touch-mode');
    input.bindTouch(els.joystick, els.stick);
  }
  if (!loopStarted) { loopStarted = true; requestAnimationFrame(loop); }
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
