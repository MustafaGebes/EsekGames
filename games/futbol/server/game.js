// Oda (maç) mantığı: oyuncular, botlar, fizik, fazlar ve olaylar.
// Sunucu OTORİTERDİR: istemci konum göndermez, sadece input gönderir.

import {
  PITCH, GOAL, PLAYER, BALL, MATCH, TEAM_SIZE, PHASE, BOT_NAMES,
} from '../shared/constants.js';
import { applyInput } from '../shared/movement.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const r1 = (v) => Math.round(v * 10) / 10;

const ROLE_X = [0.08, 0.28, 0.36, 0.52, 0.68];
const ROLE_Y = [0.5, 0.34, 0.66, 0.5, 0.58];
const ROLES = ['GK', 'DEF', 'DEF', 'MID', 'FWD'];

let nextPlayerId = 1;

export class Room {
  constructor(code) {
    this.code = code;
    this.players = new Map();
    this.slots = [[], []]; // takım -> slot -> player id
    this.clients = new Set(); // bağlı WebSocket'ler
    this.ball = { x: PITCH.w / 2, y: PITCH.h / 2, vx: 0, vy: 0 };
    this.score = [0, 0];
    this.half = 1;
    this.timeLeft = MATCH.halfSeconds;
    this.phase = PHASE.kickoff;
    this.phaseTimer = MATCH.kickoffDelay;
    this.tick = 0;
    this.lastTouch = -1;
    this.events = [];
    this.snapAcc = 0;
    this.createdAt = Date.now();
    this.lastHumanAt = Date.now();
    this.botSeq = 0;
    this.usedNames = new Set();

    for (let t = 0; t < 2; t++) this.slots[t] = new Array(TEAM_SIZE).fill(null);

    this.fillWithBots();
    this.resetKickoff();
  }

  // ---------------------------------------------------------------- oyuncular

  humanCounts() {
    const c = [0, 0];
    for (const p of this.players.values()) if (!p.bot) c[p.team]++;
    return c;
  }

  humanCount() {
    const c = this.humanCounts();
    return c[0] + c[1];
  }

  fillWithBots() {
    for (let t = 0; t < 2; t++) {
      for (let i = 0; i < TEAM_SIZE; i++) {
        if (this.slots[t][i]) continue;
        const bot = this.makePlayer({
          name: this.nextBotName(),
          team: t, slot: i, bot: true,
        });
        this.players.set(bot.id, bot);
        this.slots[t][i] = bot.id;
      }
    }
  }

  // Ayni odada ayni bot ismi birden fazla kullanilmaz.
  nextBotName() {
    for (const n of BOT_NAMES) {
      if (!this.usedNames.has(n)) {
        this.usedNames.add(n);
        return n;
      }
    }
    this.botSeq++;
    const name = `Bot ${this.botSeq}`;
    this.usedNames.add(name);
    return name;
  }

  makePlayer({ name, team, slot, bot }) {
    const sp = this.spots(team)[slot];
    return {
      id: nextPlayerId++,
      name,
      team,
      slot,
      bot,
      role: sp.role,
      x: sp.x, y: sp.y, vx: 0, vy: 0,
      fx: team === 0 ? 0 : Math.PI,
      kickCd: 0,
      input: { mx: 0, my: 0, sp: false, k: false, p: false },
      target: { x: sp.x, y: sp.y },
      think: Math.random() * 0.2,
      anim: Math.random() * 6,
    };
  }

  spots(team) {
    const dir = this.attackDir(team);
    const arr = [];
    for (let i = 0; i < TEAM_SIZE; i++) {
      const fx = ROLE_X[i];
      arr.push({
        x: dir === 1 ? fx * PITCH.w : (1 - fx) * PITCH.w,
        y: ROLE_Y[i] * PITCH.h,
        role: ROLES[i],
      });
    }
    return arr;
  }

  addHuman(name) {
    const counts = this.humanCounts();
    const team = counts[0] <= counts[1] ? 0 : 1;
    // Once saha slotlarini tercih et; kaleci slotu en sona kalir.
    let slot = -1;
    for (let i = 1; i < TEAM_SIZE; i++) {
      const id = this.slots[team][i];
      if (id && this.players.get(id)?.bot) { slot = i; break; }
    }
    if (slot === -1) {
      const id = this.slots[team][0];
      if (id && this.players.get(id)?.bot) slot = 0;
    }
    if (slot === -1) return null; // oda dolu

    const botId = this.slots[team][slot];
    this.players.delete(botId);

    const p = this.makePlayer({ name, team, slot, bot: false });
    this.players.set(p.id, p);
    this.slots[team][slot] = p.id;
    this.lastHumanAt = Date.now();
    this.resetKickoff();
    return p;
  }

  removeHuman(id) {
    const p = this.players.get(id);
    if (!p) return null;
    this.players.delete(id);
    this.slots[p.team][p.slot] = null;
    // Yerine bot gelsin ki takım hep dolu olsun.
    const bot = this.makePlayer({
      name: this.nextBotName(),
      team: p.team, slot: p.slot, bot: true,
    });
    this.players.set(bot.id, bot);
    this.slots[p.team][p.slot] = bot.id;
    this.resetKickoff();
    return p;
  }

  // ---------------------------------------------------------------- maç akışı

  attackDir(team) {
    const base = team === 0 ? 1 : -1;
    return this.half === 2 ? -base : base;
  }

  teamAttacking(dir) {
    return this.attackDir(0) === dir ? 0 : 1;
  }

  resetKickoff() {
    this.ball.x = PITCH.w / 2;
    this.ball.y = PITCH.h / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    for (const p of this.players.values()) {
      const sp = this.spots(p.team)[p.slot];
      p.x = sp.x; p.y = sp.y;
      p.vx = 0; p.vy = 0;
      p.kickCd = 0;
      p.input.mx = 0; p.input.my = 0; p.input.k = false; p.input.p = false;
      p.target.x = sp.x; p.target.y = sp.y;
    }
  }

  resetMatch() {
    this.score = [0, 0];
    this.half = 1;
    this.timeLeft = MATCH.halfSeconds;
    this.phase = PHASE.kickoff;
    this.phaseTimer = MATCH.kickoffDelay;
    this.lastTouch = -1;
    this.resetKickoff();
    this.events.push({ kind: 'restart' });
  }

  onGoal(team) {
    this.score[team]++;
    this.phase = PHASE.kickoff;
    this.phaseTimer = MATCH.kickoffDelay;
    this.events.push({ kind: 'goal', team });
    this.resetKickoff();
  }

  handlePhase(dt) {
    if (this.phase === PHASE.kickoff) {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this.phase = PHASE.play;
        this.events.push({ kind: 'start' });
      }
    } else if (this.phase === PHASE.play) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        if (this.half === 1) {
          this.half = 2;
          this.timeLeft = MATCH.halfSeconds;
          this.phase = PHASE.halftime;
          this.phaseTimer = MATCH.halftimeDelay;
          this.resetKickoff();
          this.events.push({ kind: 'halftime' });
        } else {
          this.phase = PHASE.end;
          this.events.push({ kind: 'end' });
        }
      }
    } else if (this.phase === PHASE.halftime) {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this.phase = PHASE.kickoff;
        this.phaseTimer = MATCH.kickoffDelay;
        this.resetKickoff();
      }
    }
  }

  // ---------------------------------------------------------------- simülasyon

  step(dt) {
    this.tick++;

    for (const p of this.players.values()) {
      p.kickCd = Math.max(0, p.kickCd - dt);
      if (p.bot) this.botThink(p, dt);
      applyInput(p, p.input, dt);
      p.x = clamp(p.x, PLAYER.r, PITCH.w - PLAYER.r);
      p.y = clamp(p.y, PLAYER.r, PITCH.h - PLAYER.r);
      p.anim += Math.hypot(p.vx, p.vy) * dt * 0.06;
    }

    this.handleKicks();
    this.stepBall(dt);
    this.handlePhase(dt);
  }

  handleKicks() {
    const b = this.ball;
    for (const p of this.players.values()) {
      if (!p.input.k) continue;
      if (p.kickCd > 0) continue;
      p.input.k = false;

      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d > PLAYER.r + BALL.r + 16) { p.kickCd = 0.18; continue; }

      let ang = p.fx;
      let speed = BALL.kickSpeed;
      if (p.input.p) {
        const mate = this.bestPass(p);
        if (mate) {
          ang = Math.atan2(mate.y - p.y, mate.x - p.x);
          speed = BALL.passSpeed;
        }
      }
      const dirX = Math.cos(ang);
      const dirY = Math.sin(ang);
      b.x = p.x + dirX * (PLAYER.r + BALL.r);
      b.y = p.y + dirY * (PLAYER.r + BALL.r);
      b.vx = dirX * speed + p.vx * 0.4;
      b.vy = dirY * speed + p.vy * 0.4;
      p.kickCd = PLAYER.kickCd;
      this.lastTouch = p.team;
      this.events.push({ kind: 'kick', i: p.id });
    }
    for (const p of this.players.values()) p.input.p = false;
  }

  bestPass(p) {
    const dir = this.attackDir(p.team);
    let best = null;
    let bestScore = -Infinity;
    for (const m of this.players.values()) {
      if (m.team !== p.team || m.id === p.id) continue;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 45 || d > 340) continue;
      const score = dx * dir - Math.abs(dy) * 0.6 - d * 0.15;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    return best;
  }

  stepBall(dt) {
    const b = this.ball;
    b.vx *= Math.pow(BALL.friction, dt * 60);
    b.vy *= Math.pow(BALL.friction, dt * 60);
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    const mouthTop = (PITCH.h - GOAL.height) / 2;
    const mouthBot = (PITCH.h + GOAL.height) / 2;

    if (b.y < BALL.r) { b.y = BALL.r; b.vy = -b.vy; }
    if (b.y > PITCH.h - BALL.r) { b.y = PITCH.h - BALL.r; b.vy = -b.vy; }

    if (b.x < 0) {
      if (b.y > mouthTop && b.y < mouthBot) { this.onGoal(this.teamAttacking(-1)); return; }
      b.x = -b.x; b.vx = -b.vx;
    } else if (b.x > PITCH.w) {
      if (b.y > mouthTop && b.y < mouthBot) { this.onGoal(this.teamAttacking(1)); return; }
      b.x = 2 * PITCH.w - b.x; b.vx = -b.vx;
    }

    for (const p of this.players.values()) {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const d = Math.hypot(dx, dy);
      const minD = PLAYER.r + BALL.r;
      if (d < minD && d > 0.0001) {
        const nx = dx / d;
        const ny = dy / d;
        b.x = p.x + nx * minD;
        b.y = p.y + ny * minD;
        const rel = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
        if (rel < 0) {
          b.vx -= rel * nx * 1.05;
          b.vy -= rel * ny * 1.05;
          this.lastTouch = p.team;
        }
      }
    }

    const arr = [...this.players.values()];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const c = arr[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const d = Math.hypot(dx, dy);
        const minD = PLAYER.r * 2;
        if (d < minD && d > 0.0001) {
          const push = (minD - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push; a.y -= ny * push;
          c.x += nx * push; c.y += ny * push;
        }
      }
    }

    if (Math.hypot(b.vx, b.vy) < BALL.restSpeed) { b.vx = 0; b.vy = 0; }
  }

  // ---------------------------------------------------------------- bot yapay zekası

  botThink(p, dt) {
    p.think -= dt;
    if (p.think <= 0) {
      p.think = 0.13 + Math.random() * 0.12;
      this.botDecide(p);
    }

    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      p.input.mx = dx / d;
      p.input.my = dy / d;
      p.input.sp = d > 70;
    } else {
      p.input.mx = 0;
      p.input.my = 0;
      p.input.sp = false;
    }

    const b = this.ball;
    const bd = Math.hypot(b.x - p.x, b.y - p.y);
    if (this.phase === PHASE.play && bd < PLAYER.r + BALL.r + 10) {
      const dir = this.attackDir(p.team);
      const goalX = dir === 1 ? PITCH.w + 60 : -60;
      const goalY = PITCH.h / 2 + (Math.random() - 0.5) * 70;
      p.fx = Math.atan2(goalY - p.y, goalX - p.x);
      p.input.k = true;
    }
  }

  botDecide(p) {
    const b = this.ball;
    const dir = this.attackDir(p.team);
    const ownGoalX = dir === 1 ? 0 : PITCH.w;

    if (p.role === 'GK') {
      p.target.x = ownGoalX + dir * 42;
      p.target.y = clamp(b.y, PITCH.h * 0.22, PITCH.h * 0.78);
      if (Math.abs(b.x - ownGoalX) < 220) p.target.x = ownGoalX + dir * 26;
      return;
    }

    if (this.lastTouch !== p.team) {
      // Her bot topun farkli bir tarafina gider, hepsi tek noktaya yigilmaz.
      const ang = (p.slot / TEAM_SIZE) * Math.PI * 2;
      p.target.x = b.x - dir * 6 + Math.cos(ang) * 26;
      p.target.y = b.y + Math.sin(ang) * 26;
      return;
    }

    const ahead = p.role === 'FWD' ? 130 : p.role === 'MID' ? 70 : -45;
    p.target.x = clamp(b.x + dir * ahead, 40, PITCH.w - 40);
    p.target.y = clamp(b.y + (p.slot - 2) * 45, 40, PITCH.h - 40);
  }

  // ---------------------------------------------------------------- çıktı

  roster() {
    return [...this.players.values()].map((p) => ({
      i: p.id, nm: p.name, tm: p.team, bot: p.bot, role: p.role,
    }));
  }

  snapshot() {
    const players = [];
    for (const p of this.players.values()) {
      players.push({
        i: p.id, x: r1(p.x), y: r1(p.y), vx: r1(p.vx), vy: r1(p.vy),
        tm: p.team, fx: r1(p.fx), an: r1(p.anim), sl: p.slot,
      });
    }
    return {
      t: 'snapshot',
      tick: this.tick,
      srv: Date.now(),
      phase: this.phase,
      tl: r1(this.timeLeft),
      half: this.half,
      score: this.score,
      ball: {
        x: r1(this.ball.x), y: r1(this.ball.y),
        vx: r1(this.ball.vx), vy: r1(this.ball.vy),
      },
      players,
    };
  }
}
