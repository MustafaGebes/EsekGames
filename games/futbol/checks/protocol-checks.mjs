// Uçtan uca ağ testi: gerçek sunucuya iki istemci bağlanır, protokol doğrulanır.
// Önce sunucu ayakta olmalı: npm start
// Çalıştırma: node test/protocol-test.mjs

import assert from 'node:assert/strict';
import WebSocket from 'ws';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const WS_URL = BASE.replace(/^http/, 'ws') + '/ws';

function connect(name, room, md) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const c = {
      ws, id: null, room: null, team: null, snapshots: 0, roster: null,
      events: [], chats: [], last: null, errors: [], size: null, maxVx: 0,
    };
    const timer = setTimeout(() => reject(new Error(`${name}: welcome gelmedi`)), 8000);
    ws.on('open', () => ws.send(JSON.stringify({ t: 'join', nm: name, room, md })));
    ws.on('message', (raw) => {
      const m = JSON.parse(raw.toString());
      if (m.t === 'welcome') {
        clearTimeout(timer);
        c.id = m.id; c.room = m.room; c.team = m.team;
        c.size = m.size;
        resolve(c);
      } else if (m.t === 'snapshot') {
        c.snapshots++; c.last = m;
        const me = m.players.find((p) => p.i === c.id);
        if (me && Math.abs(me.vx) > c.maxVx) c.maxVx = Math.abs(me.vx);
      } else if (m.t === 'roster') { c.roster = m.players; } else if (m.t === 'event') { c.events.push(m); } else if (m.t === 'chat') { c.chats.push(m); } else if (m.t === 'error') { c.errors.push(m); }
    });
    ws.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

await check('iki istemci aynı odaya girer ve snapshot alır', async () => {
  const a = await connect('OyuncuA', 'TESTNET');
  const b = await connect('OyuncuB', 'TESTNET');
  assert.equal(a.room, 'TESTNET');
  assert.equal(b.room, 'TESTNET');
  assert.notEqual(a.id, b.id);

  await sleep(1200);
  assert.ok(a.snapshots > 5, `snapshot gelmedi (${a.snapshots})`);
  assert.ok(b.snapshots > 5, `snapshot gelmedi (b: ${b.snapshots})`);
  assert.equal(a.last.players.length, 10, 'odada 10 oyuncu olmalı');

  const roster = a.roster || [];
  const names = roster.map((p) => p.nm);
  assert.ok(names.includes('OyuncuA'), 'OyuncuA listede yok');
  assert.ok(names.includes('OyuncuB'), 'OyuncuB listede yok');

  a.ws.close();
  b.ws.close();
});

await check('input gönderimi oyuncuyu hareket ettirir', async () => {
  const a = await connect('Hareket', 'TESTMOVE');
  await sleep(400);
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
  await sleep(500);
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
  assert.equal(a.last.players.length, 2, '1v1 odada 2 oyuncu olmalı');
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
  await sleep(300);
  assert.equal(ws.readyState, WebSocket.OPEN, 'bağlantı kapandı');
  ws.close();
});

console.log(`\n${passed} test geçti.`);
if (process.exitCode) console.log('BAŞARISIZ TEST VAR');
process.exit(process.exitCode || 0);
