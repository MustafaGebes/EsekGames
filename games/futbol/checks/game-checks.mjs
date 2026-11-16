// Saf oyun mantığı testleri (tarayıcı ve ağ gerekmez).
// Çalıştırma: node test/game-test.mjs

import assert from 'node:assert/strict';
import { Room } from '../server/game.js';
import { PITCH, GOAL, PHASE, TEAM_SIZE } from '../shared/constants.js';

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

check('kickoff sonrası maç başlar', () => {
  const room = new Room('TEST04');
  for (let i = 0; i < 120; i++) room.step(1 / 30);
  assert.equal(room.phase, PHASE.play);
});

check('sağ kaleye gol sayılır', () => {
  const room = new Room('TEST05');
  room.phase = PHASE.play;
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
  room.ball.x = -5;
  room.ball.y = PITCH.h / 2;
  room.ball.vx = -10;
  room.step(1 / 30);
  assert.equal(room.score[room.teamAttacking(-1)], 1);
});

check('kale dışındaki top kaleci çizgisinde sekerek geri döner', () => {
  const room = new Room('TEST07');
  room.phase = PHASE.play;
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
  const startX = human.x;
  human.input.mx = 1;
  for (let i = 0; i < 30; i++) room.step(1 / 30);
  assert.ok(human.x > startX + 20, `oyuncu ilerlemedi: ${startX} -> ${human.x}`);
});

check('şut topu hızlandırır', () => {
  const { room, human } = soloRoom('TEST09');
  room.phase = PHASE.play;
  human.x = 400; human.y = 300; human.fx = 0; human.vx = 0; human.vy = 0;
  room.ball.x = 420; room.ball.y = 300; room.ball.vx = 0; room.ball.vy = 0;
  human.input.k = true;
  room.step(1 / 30);
  assert.ok(room.ball.vx > 100, `top vurulmadı: vx=${room.ball.vx}`);
});

check('pas topu arkadaşına doğru gönderir', () => {
  const { room, human } = soloRoom('TEST12');
  room.phase = PHASE.play;
  human.x = 200; human.y = 300; human.fx = 0; human.vx = 0; human.vy = 0;
  room.ball.x = 220; room.ball.y = 300; room.ball.vx = 0; room.ball.vy = 0;
  const mate = [...room.players.values()].find((x) => x.team === human.team && x.id !== human.id);
  mate.x = 400; mate.y = 300;
  human.input.k = true;
  human.input.p = true;
  room.step(1 / 30);
  assert.ok(room.ball.vx > 100, `pas topu göndermedi: vx=${room.ball.vx}`);
});

check('devre sonunda devre arası olur ve yönler değişir', () => {
  const room = new Room('TEST10');
  room.phase = PHASE.play;
  room.timeLeft = 0.01;
  const before = room.attackDir(0);
  room.step(1 / 30);
  assert.equal(room.phase, PHASE.halftime);
  assert.equal(room.half, 2);
  assert.notEqual(room.attackDir(0), before);
});

check('snapshot oyuncu sayısı maç oyuncu sayısıyla eşit', () => {
  const room = new Room('TEST11');
  const snap = room.snapshot();
  assert.equal(snap.players.length, room.players.size);
  assert.equal(snap.ball.x, PITCH.w / 2);
});

console.log(`\n${passed} test geçti.`);
if (process.exitCode) console.log('BAŞARISIZ TEST VAR');
