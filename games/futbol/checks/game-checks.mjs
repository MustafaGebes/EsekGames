// Saf oyun mantığı testleri (tarayıcı ve ağ gerekmez).
// Çalıştırma: node test/game-test.mjs

import assert from 'node:assert/strict';
import { Room } from '../server/game.js';
import { RoomManager } from '../server/rooms.js';
import { Predictor } from '../shared/predictor.js';
import { PITCH, GOAL, PHASE, TEAM_SIZE, PLAYER, LOBBY } from '../shared/constants.js';

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('Oyun mantığı testleri');

check('oda 5v5 botla başlar', () => {
  const room = new Room('TEST01');
  assert.equal(room.players.size, TEAM_SIZE * 2);
  assert.equal(room.humanCounts()[0], 0);
  assert.equal(room.humanCounts()[1], 0);
  const bots = [...room.players.values()].filter((p) => p.bot);
  assert.equal(bots.length, 10);
});

check('yeni oda lobi durumunda başlar (maç henüz başlamaz)', () => {
  const room = new Room('TEST22');
  assert.equal(room.started, false);
  assert.equal(room.lobbyLeft, 0);
  assert.equal(room.hostId, null);
  const state = room.roomState();
  assert.equal(state.code, 'TEST22');
  assert.equal(state.started, false);
  assert.equal(state.size, TEAM_SIZE);
  assert.ok(state.capacity === TEAM_SIZE * 2);
});

check('ilk insan host olur ve geri sayım başlar', () => {
  const room = new Room('TEST23');
  const p = room.addHuman('Mustik');
  assert.equal(room.hostId, p.id);
  assert.equal(room.lobbyLeft, LOBBY.waitSeconds);
  assert.equal(room.started, false);
});

check('geri sayım bitince maç başlar', () => {
  const room = new Room('TEST24');
  room.addHuman('Mustik');
  for (let i = 0; i < LOBBY.waitSeconds * 30 + 5; i++) room.step(1 / 30);
  assert.equal(room.started, true);
  assert.equal(room.lobbyLeft, 0);
  assert.ok(room.events.some((e) => e.kind === 'start'), 'start olayı yok');
});

check('lobi sırasında fizik çalışmaz', () => {
  const room = new Room('TEST25');
  const human = room.addHuman('Test');
  human.x = 400; human.y = 300;
  human.input.mx = 1;
  for (let i = 0; i < 10; i++) room.step(1 / 30);
  assert.equal(human.x, 400, 'lobide oyuncu hareket etmemeli');
});

check('host ayrılınca host rolü devredilir', () => {
  const room = new Room('TEST26');
  const a = room.addHuman('A');
  const b = room.addHuman('B');
  assert.equal(room.hostId, a.id);
  room.removeHuman(a.id);
  assert.equal(room.hostId, b.id);
});

check('oda dolunca bekleme olmadan başlar', () => {
  const room = new Room('TEST27', 1);
  room.addHuman('A');
  room.addHuman('B');
  assert.equal(room.lobbyLeft, 0);
  room.step(1 / 30);
  assert.equal(room.started, true);
});

check('startMatch sadece bir kez calisir', () => {
  const room = new Room('TEST28');
  room.addHuman('A');
  assert.equal(room.startMatch(), true);
  assert.equal(room.startMatch(), false);
});

check('insan oyuncu botun yerini alır, takım 5 kişi kalır', () => {
  const room = new Room('TEST02');
  const p = room.addHuman('Mustik');
  assert.ok(p);
  assert.equal(p.bot, false);
  assert.equal(room.players.size, TEAM_SIZE * 2);
  assert.equal(room.humanCounts()[p.team], 1);
  assert.equal([...room.players.values()].filter((x) => x.bot).length, 9);
});

check('insan çıkınca yerine bot gelir', () => {
  const room = new Room('TEST03');
  const p = room.addHuman('Mustik');
  room.removeHuman(p.id);
  assert.equal(room.players.size, TEAM_SIZE * 2);
  assert.equal(room.humanCounts()[0] + room.humanCounts()[1], 0);
});

check('1v1 modunda oda 2 oyunculu', () => {
  const room = new Room('TEST16', 1);
  assert.equal(room.teamSize, 1);
  assert.equal(room.players.size, 2);
  assert.equal(room.capacity(), 2);
});

check('kickoff sonrası maç başlar', () => {
  const room = new Room('TEST04');
  room.addHuman('Mustik');
  // Not: botlar bu sürede gol atabilir ve faz tekrar 'kickoff' olabilir;
  // bu yüzden "play fazına geçildi mi" diye bakıyoruz, son faza değil.
  let sawPlay = false;
  const steps = (LOBBY.waitSeconds + 6) * 30;
  for (let i = 0; i < steps; i++) {
    room.step(1 / 30);
    if (room.phase === PHASE.play) sawPlay = true;
  }
  assert.ok(room.started, 'lobi beklemesi bitmedi');
  assert.ok(sawPlay, 'maç başlamadı');
});

check('sağ kaleye gol sayılır', () => {
  const room = new Room('TEST05');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  room.ball.x = PITCH.w + 5;
  room.ball.y = PITCH.h / 2;
  room.ball.vx = 10;
  room.step(1 / 30);
  const total = room.score[0] + room.score[1];
  assert.equal(total, 1);
  assert.equal(room.score[room.teamAttacking(1)], 1);
});

check('sol kaleye gol sayılır', () => {
  const room = new Room('TEST06');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  room.ball.x = -5;
  room.ball.y = PITCH.h / 2;
  room.ball.vx = -10;
  room.step(1 / 30);
  assert.equal(room.score[room.teamAttacking(-1)], 1);
});

check('kendi kaleye gol tespit edilir', () => {
  const room = new Room('TEST13');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  const scorer = [...room.players.values()].find((p) => p.team === 0);
  room.lastTouch = 0;
  room.lastTouchId = scorer.id;
  room.ball.x = -5;
  room.ball.y = PITCH.h / 2;
  room.ball.vx = -10;
  room.step(1 / 30);
  // Top sol kaleye girdi, orada Mavi takım savunma yapıyordu.
  assert.equal(room.score[1], 1);
  const goal = room.events.find((e) => e.kind === 'goal');
  assert.ok(goal, 'gol olayı yok');
  assert.equal(goal.own, true);
  assert.equal(goal.by, scorer.name);
});

check('gol atanın gol sayacı artar', () => {
  const room = new Room('TEST17');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  const scorer = [...room.players.values()].find((p) => p.team === 0);
  room.lastTouch = 0;
  room.lastTouchId = scorer.id;
  room.ball.x = PITCH.w + 5;
  room.ball.y = PITCH.h / 2;
  room.ball.vx = 10;
  room.step(1 / 30);
  assert.equal(scorer.goals, 1);
});

check('kale dışındaki top kaleci çizgisinde sekerek geri döner', () => {
  const room = new Room('TEST07');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  room.ball.x = -5;
  room.ball.y = 40; // kalenin dışında
  room.ball.vx = -20;
  room.step(1 / 30);
  assert.ok(room.ball.x >= 0, `top çizginin dışında kaldı: ${room.ball.x}`);
  assert.ok(room.ball.vx > 0);
});

// Botlardan arındırılmış, sadece insan oyuncu içeren oda (test izolasyonu).
function soloRoom(code) {
  const room = new Room(code);
  const human = room.addHuman('Test');
  for (const b of [...room.players.values()]) {
    if (!b.bot) continue;
    b.x = 30; b.y = 30; b.vx = 0; b.vy = 0; b.think = 10; b.input.k = false;
  }
  return { room, human };
}

check('input yönünde hareket eder', () => {
  const { room, human } = soloRoom('TEST08');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  const startX = human.x;
  human.input.mx = 1;
  for (let i = 0; i < 30; i++) room.step(1 / 30);
  assert.ok(human.x > startX + 20, `oyuncu ilerlemedi: ${startX} -> ${human.x}`);
});

check('şut topu hızlandırır', () => {
  const { room, human } = soloRoom('TEST09');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  human.x = 400; human.y = 300; human.fx = 0; human.vx = 0; human.vy = 0;
  room.ball.x = 420; room.ball.y = 300; room.ball.vx = 0; room.ball.vy = 0;
  human.input.k = true;
  room.step(1 / 30);
  assert.ok(room.ball.vx > 100, `top vurulmadı: vx=${room.ball.vx}`);
});

check('pas topu arkadaşına doğru gönderir', () => {
  const { room, human } = soloRoom('TEST12');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  human.x = 200; human.y = 300; human.fx = 0; human.vx = 0; human.vy = 0;
  room.ball.x = 220; room.ball.y = 300; room.ball.vx = 0; room.ball.vy = 0;
  const mate = [...room.players.values()].find((x) => x.team === human.team && x.id !== human.id);
  mate.x = 400; mate.y = 300;
  human.input.k = true;
  human.input.p = true;
  room.step(1 / 30);
  assert.ok(room.ball.vx > 100, `pas topu göndermedi: vx=${room.ball.vx}`);
});

check('depar hizi ANLIK atanmaz, ivme rampasiyla artar', () => {
  const { room, human } = soloRoom('TEST14');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  human.x = 400; human.y = 300; human.vx = 0; human.vy = 0; human.fx = 0;
  human.input.d = true;
  room.step(1 / 30);
  // Ilk karede hiz anlika dashSpeed olmamali (takilma yapmaz).
  assert.ok(human.vx > 0, 'depar baslamadi');
  assert.ok(human.vx < PLAYER.dashSpeed * 0.5, `hiz anlik atandi: vx=${human.vx}`);
  assert.ok(human.dashCd > 0, 'depar bekleme suresi islenmedi');
  // Rampa devam eder: birkac karede yuksek hiza ulasir.
  for (let i = 0; i < 6; i++) room.step(1 / 30);
  assert.ok(human.vx > PLAYER.maxSpeed * 1.5, `depar hizi artmadi: vx=${human.vx}`);
  assert.ok(human.vx <= PLAYER.dashSpeed + 1, `hiz siniri asildi: vx=${human.vx}`);
});

check('depar bittikten sonra hiz yumusak yavaslar (sert kesme yok)', () => {
  const { room, human } = soloRoom('TEST23');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  human.x = 400; human.y = 300; human.vx = 0; human.vy = 0; human.fx = 0;
  human.input.d = true;
  const dashFrames = Math.ceil(PLAYER.dashTime * 30);
  for (let i = 0; i < dashFrames; i++) room.step(1 / 30);
  const peak = Math.hypot(human.vx, human.vy);
  assert.ok(peak > PLAYER.maxSpeed * 1.5, `depar hizi dusuk: ${peak}`);
  room.step(1 / 30);
  const after = Math.hypot(human.vx, human.vy);
  assert.ok(after < peak, `hiz artmamali: ${peak} -> ${after}`);
  assert.ok(after > PLAYER.maxSpeed, `hiz sert kesildi: ${peak} -> ${after}`);
});

check('depar bekleme suresi dolmadan ikinci depar olmaz', () => {
  const { room, human } = soloRoom('TEST18');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  human.x = 400; human.y = 300; human.vx = 0; human.vy = 0; human.fx = 0;
  human.input.d = true;
  room.step(1 / 30);
  const cdAfterFirst = human.dashCd;
  assert.ok(cdAfterFirst > 0, 'depar bekleme suresi islenmedi');
  // Ikinci depar denemesi bekleme suresini yeniden baslatmamali.
  human.input.d = true;
  room.step(1 / 30);
  assert.ok(human.dashCd < cdAfterFirst, `bekleme suresi yeniden basladi: ${human.dashCd} >= ${cdAfterFirst}`);
});

check('süre bitince beraberlikte altın gol oynanır', () => {
  const room = new Room('TEST10');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  room.timeLeft = 0.01;
  room.score = [0, 0];
  room.step(1 / 30);
  assert.equal(room.phase, PHASE.golden);
  assert.equal(room.golden, true);
  assert.ok(room.events.some((e) => e.kind === 'golden'), 'altın gol olayı yok');
});

check('süre bitince farklı skorda maç biter ve kazanan belli olur', () => {
  const room = new Room('TEST19');
  room.phase = PHASE.play;
  room.started = true;   // lobi beklemesini atlayip dogrudan oyuna gir
  room.timeLeft = 0.01;
  room.score = [2, 1];
  room.step(1 / 30);
  assert.equal(room.phase, PHASE.end);
  const end = room.events.find((e) => e.kind === 'end');
  assert.ok(end, 'maç sonu olayı yok');
  assert.equal(end.winner, 0);
});

check('altın golde atılan gol maçı bitirir', () => {
  const room = new Room('TEST20');
  room.phase = PHASE.golden;
  room.started = true;
  room.golden = true;
  room.goldenLeft = 30;
  room.score = [1, 1];
  const scorer = [...room.players.values()].find((p) => p.team === 0);
  room.lastTouch = 0;
  room.lastTouchId = scorer.id;
  room.ball.x = PITCH.w + 5;
  room.ball.y = PITCH.h / 2;
  room.ball.vx = 10;
  room.step(1 / 30);
  assert.equal(room.score[0], 2);
  assert.equal(room.phase, PHASE.end);
  const end = room.events.find((e) => e.kind === 'end');
  assert.equal(end.winner, 0);
});

check('altın gol süresi biterse maç berabere biter', () => {
  const room = new Room('TEST21');
  room.phase = PHASE.golden;
  room.started = true;
  room.golden = true;
  room.goldenLeft = 0.01;
  room.score = [1, 1];
  room.step(1 / 30);
  assert.equal(room.phase, PHASE.end);
  const end = room.events.find((e) => e.kind === 'end');
  assert.equal(end.winner, -1);
});

check('roster ve snapshot emote/avatar alani icermez', () => {
  const room = new Room('TEST15');
  const r = room.roster()[0];
  assert.equal(r.ch, undefined, 'rosterda avatar alani var');
  assert.equal(r.em, undefined, 'rosterda emote alani var');
  const s = room.snapshot().players[0];
  assert.equal(s.ch, undefined, 'snapshotta avatar alani var');
  assert.equal(s.em, undefined, 'snapshotta emote alani var');
  assert.equal(s.eml, undefined, 'snapshotta emote sure alani var');
  assert.equal(typeof s.dsh, 'number', 'depar bar alani korunmali');
});

check('snapshot oyuncu sayısı maç oyuncu sayısıyla eşit', () => {
  const room = new Room('TEST11');
  const snap = room.snapshot();
  assert.equal(snap.players.length, room.players.size);
  assert.equal(snap.ball.x, PITCH.w / 2);
  assert.equal(snap.size, TEAM_SIZE);
});

check('yeni maç skoru ve süreyi sıfırlar', () => {
  const room = new Room('TEST22');
  room.score = [3, 2];
  room.golden = true;
  room.timeLeft = 12;
  room.resetMatch();
  assert.deepEqual(room.score, [0, 0]);
  assert.equal(room.golden, false);
  assert.equal(room.timeLeft, 90);
  assert.equal(room.phase, PHASE.kickoff);
});

check('tahmin duzeltmesi anlik ziplama yapmaz (gorsel ofset)', () => {
  const pr = new Predictor();
  pr.reset({ x: 100, y: 100, vx: 0, vy: 0, fx: 0 });
  const beforeX = pr.renderX;
  // Sunucu 10 px ileride bildiriyor.
  pr.reconcile({ x: 110, y: 100, vx: 0, vy: 0, fx: 0 });
  assert.equal(pr.renderX, beforeX, 'gorsel konum anlik degismemeli');
  assert.ok(pr.state.x > 100, 'mantiksal konum duzeltilmedi');
  // Ofset sonumlenir: gorsel konum mantiksal konuma yaklasir.
  for (let i = 0; i < 30; i++) pr.step(1 / 60, { mx: 0, my: 0 });
  assert.ok(Math.abs(pr.renderX - pr.state.x) < 1, 'gorsel ofset sonumlenmedi');
});

check('buyuk konum hatasinda aninda duzeltme (snap) yapilir', () => {
  const pr = new Predictor();
  pr.reset({ x: 100, y: 100, vx: 0, vy: 0, fx: 0 });
  pr.reconcile({ x: 400, y: 100, vx: 0, vy: 0, fx: 0 });
  assert.equal(pr.renderX, 400, 'buyuk hata duzeltilmedi');
});

check('kickoff sifirlamasinda yerel depar durumu da sifirlanir', () => {
  const pr = new Predictor();
  pr.reset({ x: 100, y: 100, vx: 0, vy: 0, fx: 0 });
  // Oyuncu depar yaparken gol yendi: sunucu herkesi kickoff noktasina aldi.
  pr.state.dashLeft = 0.3;
  pr.reconcile({ x: 400, y: 100, vx: 0, vy: 0, fx: 0, dsh: 1 });
  assert.equal(pr.state.dashLeft, 0, 'yerel depar durumu bayat kaldi');
  assert.equal(pr.state.dashCd, 0, 'depar bekleme suresi sifirlanmadi');
});

// ------------------------------------------------------------------ oda yöneticisi

check('oda yöneticisi hızlı eşleşme için açık oda bulur', () => {
  const mgr = new RoomManager();
  const room = mgr.create(3);
  room.addHuman('Ali');
  const found = mgr.findOpen(3);
  assert.ok(found, 'açık oda bulunamadı');
  assert.equal(found.code, room.code);
  assert.equal(mgr.findOpen(5), null, 'farklı modda oda bulunmamalı');
});

check('başlamış oda hızlı eşleşmede kullanılmaz', () => {
  const mgr = new RoomManager();
  const room = mgr.create(3);
  room.addHuman('Ali');
  room.startMatch();
  assert.equal(mgr.findOpen(3), null);
});

check('sunucu listesi insanı olan odaları gösterir', () => {
  const mgr = new RoomManager();
  const room = mgr.create(2);
  room.addHuman('Ali');
  const list = mgr.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].code, room.code);
  assert.equal(list[0].humans, 1);
  assert.equal(list[0].size, 2);
  assert.equal(list[0].started, false);
  assert.ok(typeof list[0].countdown === 'number');
});

check('insanı olmayan boş lobi listeden silinir', () => {
  const mgr = new RoomManager();
  const room = mgr.create(2);
  const p = room.addHuman('Ali');
  room.removeHuman(p.id);
  mgr.cleanup();
  assert.equal(mgr.get(room.code), undefined, 'bos lobi silinmedi');
});

console.log(`\n${passed} test geçti.`);
if (process.exitCode) console.log('BAŞARISIZ TEST VAR');
