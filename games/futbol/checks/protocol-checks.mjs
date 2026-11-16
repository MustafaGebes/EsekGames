// Uçtan uca ağ testi: gerçek sunucuya iki istemci bağlanır, protokol doğrulanır.
// Önce sunucu ayakta olmalı: npm start
// Çalıştırma: node checks/protocol-checks.mjs
//
// Akış: menü -> lobi -> maç. İstemci odaya katılır, lobi durumu gelir,
// host erken başlatabilir, maç başlayınca snapshot akışı başlar.

import assert from 'node:assert/strict';
import WebSocket from 'ws';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const WS_URL = BASE.replace(/^http/, 'ws') + '/ws';

// Her calistirmada farkli oda kodlari: onceki kosudan kalan odalara takilmayalim.
const RUN = Math.random().toString(36).slice(2, 6).toUpperCase();

function connect(name, room, md, create) {
  const code = room ? (room + RUN).slice(0, 8) : undefined;
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const c = {
      ws, id: null, room: null, team: null, snapshots: 0, roster: null,
      events: [], chats: [], last: null, errors: [], size: null, maxVx: 0,
      rooms: null, announcements: null, roomState: null, started: false, left: false,
    };
    const timer = setTimeout(() => reject(new Error(`${name}: welcome gelmedi`)), 8000);
    ws.on('open', () => ws.send(JSON.stringify({ t: 'join', nm: name, room: code, md, create })));
    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.t === 'welcome') {
        clearTimeout(timer);
        c.id = m.id; c.room = m.room; c.team = m.team;
        c.size = m.size; c.host = m.host;
        resolve(c);
      } else if (m.t === 'snapshot') {
        c.snapshots++; c.last = m;
        const me = m.players.find((p) => p.i === c.id);
        if (me && Math.abs(me.vx) > c.maxVx) c.maxVx = Math.abs(me.vx);
      } else if (m.t === 'roster') { c.roster = m.players; } else if (m.t === 'event') { c.events.push(m); if (m.kind === 'start') c.started = true; } else if (m.t === 'chat') { c.chats.push(m); } else if (m.t === 'error') { c.errors.push(m); } else if (m.t === 'rooms') { c.rooms = m.rooms; } else if (m.t === 'announcements') { c.announcements = m.items; } else if (m.t === 'roomstate') { c.roomState = m; } else if (m.t === 'left') { c.left = true; }
    });
    ws.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Bir koşul sağlanana kadar bekle (ağ gecikmesine duyarlı testler için).
async function waitFor(fn, ms = 10000, step = 100) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (fn()) return true;
    await sleep(step);
  }
  return false;
}

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('Ağ protokolü testleri');

// Sunucu ayakta değilse testi atla; CI gibi sunucusuz ortamlarda
// hata vermek yerine SKIP döner.
try {
  const ping = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(5000) });
  if (!ping.ok) throw new Error(`HTTP ${ping.status}`);
} catch (err) {
  console.log(`SKIP  Sunucuya ulasilamadi (${BASE}): ${err.message}`);
  console.log('      Once sunucuyu baslat: npm start');
  process.exit(0);
}

await check('/health yanıt verir', async () => {
  const res = await fetch(`${BASE}/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
});

await check('/api/rooms oda listesi döner', async () => {
  const res = await fetch(`${BASE}/api/rooms`);
  const body = await res.json();
  assert.ok(Array.isArray(body.rooms));
});

await check('baglanınca duyurular gönderilir', async () => {
  const a = await connect('Duyurucu', 'TESTANN');
  await sleep(300);
  assert.ok(Array.isArray(a.announcements), 'duyuru listesi yok');
  assert.ok(a.announcements.length > 0, 'duyuru listesi bos');
  assert.ok(a.announcements[0].title, 'duyuru basligi yok');
  a.ws.close();
});

await check('baglanınca canlı sunucu listesi gönderilir', async () => {
  const a = await connect('Listeleyen', 'TESTLIST');
  await sleep(300);
  assert.ok(Array.isArray(a.rooms), 'sunucu listesi yok');
  a.ws.close();
});

await check('odaya katılınca lobi durumu gelir', async () => {
  const a = await connect('Lobici', 'TESTLOB', 3);
  await sleep(400);
  assert.ok(a.roomState, 'lobi durumu gelmedi');
  assert.equal(a.roomState.code, a.room);
  assert.equal(a.roomState.size, 3);
  assert.equal(a.roomState.started, false, 'maç lobide başlamamalı');
  assert.ok(a.roomState.countdown >= 0, 'geri sayım yok');
  assert.ok(a.roomState.players.length > 0, 'lobi oyuncu listesi bos');
  a.ws.close();
});

await check('lobide oda sunucu listesinde görünür', async () => {
  const a = await connect('Gosteren', 'TESTSHOW');
  await sleep(500);
  const listed = (a.rooms || []).some((r) => r.code === a.room);
  assert.ok(listed, 'oda sunucu listesinde yok');
  a.ws.close();
});

await check('iki istemci aynı odaya girer ve aynı lobide olur', async () => {
  const a = await connect('OyuncuA', 'TESTNET');
  const b = await connect('OyuncuB', 'TESTNET');
  assert.equal(a.room, b.room, 'iki istemci farkli odada');
  assert.notEqual(a.id, b.id);
  await sleep(600);
  assert.ok(a.roomState, 'A lobi durumu yok');
  assert.ok(b.roomState, 'B lobi durumu yok');
  assert.equal(a.roomState.humans, 2, 'lobide 2 insan olmali');

  a.ws.close();
  b.ws.close();
});

await check('hızlı eşleşme açık odaya katılır', async () => {
  const a = await connect('Kurucu', 'TESTQUICK', 2, true);
  await sleep(400);
  const b = await connect('Hizli', null, 2);
  await sleep(400);
  assert.equal(b.room, a.room, 'hızlı eşleşme ayrı oda açtı');
  b.ws.close();
  a.ws.close();
});

await check('host erken başlatabilir, maç başlar ve snapshot akar', async () => {
  const a = await connect('Host', 'TESTSTART');
  const b = await connect('Misafir', 'TESTSTART');
  await sleep(500);
  assert.equal(a.host, true, 'ilk oyuncu host olmali');
  assert.equal(b.host, false, 'ikinci oyuncu host olmamali');

  a.ws.send(JSON.stringify({ t: 'startnow' }));
  const started = await waitFor(() => a.started && b.started, 8000);
  assert.ok(started, 'maç başlamadı');
  await waitFor(() => a.snapshots > 5 && b.snapshots > 5, 8000);
  assert.ok(a.snapshots > 5, `snapshot gelmedi (${a.snapshots})`);
  assert.ok(b.snapshots > 5, `snapshot gelmedi (b: ${b.snapshots})`);
  assert.equal(a.last.players.length, 10, 'odada 10 oyuncu olmalı');

  a.ws.close();
  b.ws.close();
});

await check('host olmayan oyuncu erken başlatamaz', async () => {
  const a = await connect('Host', 'TESTHOST');
  const b = await connect('Misafir', 'TESTHOST');
  await sleep(500);
  b.ws.send(JSON.stringify({ t: 'startnow' }));
  await sleep(800);
  assert.equal(a.started, false, 'host olmayan maçı başlattı');
  a.ws.close();
  b.ws.close();
});

await check('input gönderimi oyuncuyu hareket ettirir', async () => {
  const a = await connect('Hareket', 'TESTMOVE');
  await sleep(400);
  a.ws.send(JSON.stringify({ t: 'startnow' }));
  await waitFor(() => a.started, 8000);
  await waitFor(() => a.snapshots > 0, 8000);
  const before = a.last.players.find((p) => p.i === a.id);
  const x0 = before.x;
  for (let i = 0; i < 20; i++) {
    a.ws.send(JSON.stringify({ t: 'input', mx: 1, my: 0, sp: false, k: false, p: false }));
    await sleep(50);
  }
  await sleep(300);
  const after = a.last.players.find((p) => p.i === a.id);
  assert.ok(after.x > x0 + 15, `oyuncu hareket etmedi: ${x0} -> ${after.x}`);
  a.ws.close();
});

await check('chat mesajı diğer istemciye ulaşır', async () => {
  const a = await connect('Yazan', 'TESTCHAT');
  const b = await connect('Okuyan', 'TESTCHAT');
  await sleep(300);
  a.ws.send(JSON.stringify({ t: 'chat', msg: 'merhaba' }));
  await sleep(500);
  assert.ok(b.chats.some((c) => c.msg === 'merhaba'), 'chat ulaşmadı');
  a.ws.close();
  b.ws.close();
});

await check('leave mesajı menüye döner', async () => {
  const a = await connect('Cikan', 'TESTLEAVE2');
  await sleep(400);
  a.ws.send(JSON.stringify({ t: 'leave' }));
  const ok = await waitFor(() => a.left, 5000);
  assert.ok(ok, 'left mesajı gelmedi');
  a.ws.close();
});

await check('ayrılınca roster güncellenir', async () => {
  const a = await connect('Ayrilan', 'TESTLEAVE');
  const b = await connect('Kalan', 'TESTLEAVE');
  await sleep(400);
  a.ws.close();
  // Roster mesaji ag gecikmesine bagli; sabit bekleme yerine poll'lu beklenir.
  let ok = false;
  for (let i = 0; i < 40; i++) {
    await sleep(150);
    const names = (b.roster || []).map((p) => p.nm);
    if (!names.includes('Ayrilan') && names.includes('Kalan')) { ok = true; break; }
  }
  assert.ok(ok, 'ayrılan oyuncu listede kaldı');
  b.ws.close();
});

await check('depar (dash) oyuncuyu hızlandırır', async () => {
  const a = await connect('Deparci', 'TESTDASH');
  await sleep(400);
  a.ws.send(JSON.stringify({ t: 'startnow' }));
  await waitFor(() => a.started, 8000);
  for (let i = 0; i < 12; i++) {
    a.ws.send(JSON.stringify({ t: 'input', mx: 1, my: 0, sp: false, k: false, p: false, d: i === 0 }));
    await sleep(50);
  }
  await sleep(500);
  assert.ok(a.maxVx > 190, `depar hızı görünmedi: maxVx=${a.maxVx}`);
  assert.ok(a.maxVx <= 431, `hız sınırı aşıldı: maxVx=${a.maxVx}`);
  a.ws.close();
});

await check('roster ve snapshot emote/avatar alanı içermez', async () => {
  const a = await connect('SadeAlan', 'TESTCLEAN');
  await sleep(400);
  a.ws.send(JSON.stringify({ t: 'startnow' }));
  await waitFor(() => a.started && a.snapshots > 0, 8000);
  const roster = a.roster || [];
  assert.ok(roster.length > 0, 'roster bos');
  for (const p of roster) {
    assert.equal(p.ch, undefined, 'rosterda avatar alanı var');
    assert.equal(p.em, undefined, 'rosterda emote alanı var');
  }
  const me = (a.last?.players || []).find((p) => p.i === a.id);
  assert.ok(me, 'snapshotta oyuncu yok');
  assert.equal(me.ch, undefined, 'snapshotta avatar alanı var');
  assert.equal(me.em, undefined, 'snapshotta emote alanı var');
  assert.equal(me.eml, undefined, 'snapshotta emote süresi alanı var');
  a.ws.close();
});

await check('maç modu (1v1) oda boyutunu belirler', async () => {
  const a = await connect('Birebir', 'TESTMODE', 1);
  await sleep(500);
  assert.equal(a.size, 1);
  assert.equal(a.roomState.size, 1);
  a.ws.close();
});

await check('istek gövdesi bozuksa sunucu çökmez', async () => {
  const ws = new WebSocket(WS_URL);
  await new Promise((res) => ws.on('open', res));
  ws.send('bu json degil {{{');
  ws.send(JSON.stringify({ t: 'input', mx: 9999, my: -9999 }));
  ws.send(JSON.stringify({ t: 'bilinmeyen' }));
  ws.send(JSON.stringify({ t: 'emote', e: 999 }));
  ws.send(JSON.stringify({ t: 'join', nm: 'X', room: 'ZZ', ch: 99 }));
  ws.send(JSON.stringify({ t: 'startnow' }));
  await sleep(300);
  assert.equal(ws.readyState, WebSocket.OPEN, 'bağlantı kapandı');
  ws.close();
});

console.log(`\n${passed} test geçti.`);
if (process.exitCode) console.log('BAŞARISIZ TEST VAR');
process.exit(process.exitCode || 0);
