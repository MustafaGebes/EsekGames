// Canvas çizimi: yakınlaştırılmış, topu takip eden kamera + mini harita.

import { PITCH, GOAL, PLAYER, BALL, TEAM_COLORS } from '../shared/constants.js';

const INTERP_MS = 110;
const VIEW_W = 700;   // ekranda gorunur saha genisligi (dunya birimi)

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.buffer = [];
    this.roster = new Map();
    this.cam = { x: PITCH.w / 2, y: PITCH.h / 2 };
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const wrap = this.canvas.parentElement;
    const w = wrap.clientWidth || 600;
    const h = wrap.clientHeight || 400;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.floor(w * dpr));
    this.canvas.height = Math.max(1, Math.floor(h * dpr));
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    // Gorunur alan sabit genislikte; yukseklik ekran oranina gore belirlenir.
    const aspect = this.canvas.width / this.canvas.height;
    this.scale = Math.min(this.canvas.width / VIEW_W, this.canvas.height / (VIEW_W / aspect));
    this.viewW = this.canvas.width / this.scale;
    this.viewH = this.canvas.height / this.scale;
  }

  setRoster(list) {
    this.roster = new Map((list || []).map((p) => [p.i, p]));
  }

  push(snap) {
    this.buffer.push({ t: performance.now(), s: snap });
    if (this.buffer.length > 30) this.buffer.shift();
  }

  sample(now) {
    const buf = this.buffer;
    if (buf.length === 0) return null;
    const target = now - INTERP_MS;
    for (let i = buf.length - 1; i > 0; i--) {
      if (buf[i - 1].t <= target && buf[i].t >= target) {
        const span = buf[i].t - buf[i - 1].t || 1;
        const f = Math.max(0, Math.min(1, (target - buf[i - 1].t) / span));
        return this.lerpSnap(buf[i - 1].s, buf[i].s, f);
      }
    }
    return buf[buf.length - 1].s;
  }

  lerpSnap(a, b, f) {
    const mapB = new Map(b.players.map((p) => [p.i, p]));
    const players = a.players.map((pa) => {
      const pb = mapB.get(pa.i) || pa;
      return {
        ...pb,
        x: pa.x + (pb.x - pa.x) * f,
        y: pa.y + (pb.y - pa.y) * f,
      };
    });
    return {
      ball: {
        x: a.ball.x + (b.ball.x - a.ball.x) * f,
        y: a.ball.y + (b.ball.y - a.ball.y) * f,
        vx: b.ball.vx,
        vy: b.ball.vy,
      },
      players,
      score: b.score,
      tl: b.tl,
      half: b.half,
      phase: b.phase,
    };
  }

  // Kamera topu ve kendi oyuncumuzu takip eder, saha disina tasmaz.
  updateCamera(dt, focusX, focusY) {
    const k = Math.min(1, dt * 6);
    this.cam.x += (focusX - this.cam.x) * k;
    this.cam.y += (focusY - this.cam.y) * k;

    const halfW = this.viewW / 2;
    const halfH = this.viewH / 2;
    const margin = 40; // kaleler de gorunur kalsin
    this.cam.x = halfW * 2 >= PITCH.w
      ? PITCH.w / 2
      : clamp(this.cam.x, halfW - margin, PITCH.w - halfW + margin);
    this.cam.y = halfH * 2 >= PITCH.h
      ? PITCH.h / 2
      : clamp(this.cam.y, halfH - margin, PITCH.h - halfH + margin);
  }

  draw(now, myId, predicted, dt = 0.016) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const snap = this.sample(now);
    if (!snap) return;

    const me = predicted ? { x: predicted.x, y: predicted.y } : null;
    // Kamera topa bakar ama kendi oyuncumuz ekrandan cikip gitmez.
    let focusX = snap.ball.x;
    let focusY = snap.ball.y;
    if (me) {
      const spanX = Math.abs(snap.ball.x - me.x);
      const spanY = Math.abs(snap.ball.y - me.y);
      focusX = spanX > this.viewW - 90 ? (snap.ball.x + me.x) / 2 : snap.ball.x;
      focusY = spanY > this.viewH - 90 ? (snap.ball.y + me.y) / 2 : snap.ball.y;
    }
    this.updateCamera(dt, focusX, focusY);

    ctx.save();
    ctx.translate(
      this.canvas.width / 2 - this.cam.x * this.scale,
      this.canvas.height / 2 - this.cam.y * this.scale,
    );
    ctx.scale(this.scale, this.scale);

    this.drawPitch(ctx);
    this.drawBall(ctx, snap.ball);

    for (const p of snap.players) {
      if (predicted && p.i === myId) continue;
      this.drawPlayer(ctx, p, p.i === myId);
    }
    if (predicted) {
      this.drawPlayer(ctx, { ...predicted, i: myId }, true);
    }
    ctx.restore();

    this.drawMinimap(ctx, snap, myId);
  }

  drawPitch(ctx) {
    ctx.fillStyle = '#1e7a44';
    ctx.fillRect(0, 0, PITCH.w, PITCH.h);

    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(0, i * (PITCH.h / 12), PITCH.w, PITCH.h / 24);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, PITCH.w - 3, PITCH.h - 3);

    ctx.beginPath();
    ctx.moveTo(PITCH.w / 2, 0);
    ctx.lineTo(PITCH.w / 2, PITCH.h);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(PITCH.w / 2, PITCH.h / 2, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(PITCH.w / 2, PITCH.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    const pd = 150;
    const ph = 320;
    ctx.strokeRect(0, (PITCH.h - ph) / 2, pd, ph);
    ctx.strokeRect(PITCH.w - pd, (PITCH.h - ph) / 2, pd, ph);

    const gd = 55;
    const gh = 220;
    ctx.strokeRect(0, (PITCH.h - gh) / 2, gd, gh);
    ctx.strokeRect(PITCH.w - gd, (PITCH.h - gh) / 2, gd, gh);

    const mh = GOAL.height;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(-32, (PITCH.h - mh) / 2, 32, mh);
    ctx.fillRect(PITCH.w, (PITCH.h - mh) / 2, 32, mh);
  }

  drawPlayer(ctx, p, isMe) {
    const info = this.roster.get(p.i);
    const color = TEAM_COLORS[p.tm]?.main || '#ffffff';

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(p.x + 2, p.y + 5, PLAYER.r, PLAYER.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.fx || 0);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(PLAYER.r * 0.45, 0, PLAYER.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = isMe ? '#ffffff' : 'rgba(0,0,0,0.45)';
    ctx.lineWidth = isMe ? 3.5 : 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.r, 0, Math.PI * 2);
    ctx.stroke();

    const name = info?.nm || '';
    if (name) {
      ctx.font = '600 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      // Isimler ust uste binmesin: slot tek/ciift ekrana gore kaydirilir.
      const off = (p.sl ?? 0) % 2 === 0 ? -(PLAYER.r + 5) : (PLAYER.r + 16);
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillText(name, p.x + 1, p.y + off + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, p.x, p.y + off);
    }
  }

  drawBall(ctx, ball) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(ball.x + 2, ball.y + 5, BALL.r, BALL.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sol alt kosede tum sahayi gosteren mini harita.
  drawMinimap(ctx, snap, myId) {
    const w = Math.min(190, this.canvas.width * 0.2);
    const h = w * (PITCH.h / PITCH.w);
    const pad = 10;
    const x = pad;
    const y = this.canvas.height - h - pad;
    const s = w / PITCH.w;

    ctx.save();
    this.roundRect(ctx, x - 5, y - 5, w + 10, h + 10, 8);
    ctx.fillStyle = 'rgba(6, 12, 22, 0.78)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(30, 122, 68, 0.95)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(0, 0, w, h);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    for (const p of snap.players) {
      ctx.fillStyle = TEAM_COLORS[p.tm]?.main || '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x * s, p.y * s, p.i === myId ? 3.4 : 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (p.i === myId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(snap.ball.x * s, snap.ball.y * s, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Kamera gorunur alani
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      (this.cam.x - this.viewW / 2) * s,
      (this.cam.y - this.viewH / 2) * s,
      this.viewW * s,
      this.viewH * s,
    );
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
