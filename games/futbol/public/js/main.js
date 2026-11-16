// Ana akış: lobby -> oyun, WebSocket bağlantısı, oyun döngüsü.

import { Net } from './net.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { Hud } from './hud.js';
import { Predictor } from './predict.js';

const $ = (id) => document.getElementById(id);

const els = {
  lobby: $('lobby'),
  game: $('game'),
  name: $('nameInput'),
  room: $('roomInput'),
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

  ensureNet();
  pendingJoin = { nm, room };
  if (net.status === 'online') {
    net.send({ t: 'join', ...pendingJoin });
    pendingJoin = null;
  }
});

els.again.addEventListener('click', () => {
  net?.send({ t: 'again' });
  hud.hideAgain();
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
    btn.appendChild(document.createTextNode(r.code));
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = `${r.humans} kişi`;
    btn.appendChild(count);
    btn.addEventListener('click', () => {
      els.room.value = r.code;
      els.room.focus();
    });
    li.appendChild(btn);
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

function registerHandlers(n) {
  n.on('welcome', (m) => {
    myId = m.id;
    myTeam = m.team;
    els.lobby.classList.add('hidden');
    els.game.classList.remove('hidden');
    input.enabled = true;
    renderer = new Renderer(els.canvas);
    predicted = { x: PITCH_CENTER.x, y: PITCH_CENTER.y, vx: 0, vy: 0, fx: 0, tm: myTeam };
    hud.center(`Odaya katıldın: ${m.room}`, 2200);
    if (window.matchMedia('(pointer: coarse)').matches) {
      els.touch.classList.remove('hidden');
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
      predicted = { ...predictor.state, tm: me.tm, sl: me.sl };
    }
    hud.setScore(m.score, m.tl, m.half, m.phase);
  });

  n.on('event', (m) => {
    if (m.kind === 'goal') {
      hud.center(`⚽ GOL! ${m.team === 0 ? 'Mavi' : 'Kırmızı'} takımı`, 2500);
    } else if (m.kind === 'halftime') {
      hud.center('Devre arası — yönler değişiyor', 3200);
    } else if (m.kind === 'end') {
      hud.center('Maç bitti!', 8000);
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

const PITCH_CENTER = { x: 480, y: 300 };

let lastFrame = performance.now();
let sendAcc = 0;
let pendingShot = false;
let pendingPass = false;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  const inp = input.sample();
  pendingShot = pendingShot || inp.k;
  pendingPass = pendingPass || inp.p;

  predictor.step(dt, inp);
  if (predicted && predictor.state) {
    predicted.x = predictor.state.x;
    predicted.y = predictor.state.y;
    predicted.fx = predictor.state.fx;
  }

  sendAcc += dt;
  if (sendAcc >= 0.05) {
    sendAcc = 0;
    net?.send({
      t: 'input', mx: inp.mx, my: inp.my, sp: inp.sp, k: pendingShot, p: pendingPass,
    });
    pendingShot = false;
    pendingPass = false;
  }

  renderer?.draw(now, myId, predicted, dt);
}

window.addEventListener('resize', () => renderer?.resize());
