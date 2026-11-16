// Canvas çizimi: sabit kamera - tüm saha tek ekranda görünür (kaydırma yok).
// Aniball tarzı detaylar: avatar rozetleri, "Sen" işareti, ifade balonu, depar barı.

import { PITCH, GOAL, PLAYER, BALL, TEAM_COLORS, AVATARS, EMOTES } from '../shared/constants.js';

const INTERP_MS = 110;
// Sahanın etrafındaki boşluk (kale arkası + masa çerçevesi) dünya biriminde.
const MARGIN = 28;
// Yakın kamerada kullanılan yakınlaştırma katsayısı.
const ZOOM_NEAR = 1.45;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.buffer = [];
    this.roster = new Map();
    this.zoom = 'far';
    this.baseScale = 1;
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

    // Sabit kamera: saha + cerceve ekrana tam sigar, gorsunum kaymaz.
    const worldW = PITCH.w + MARGIN * 2;
    const worldH = PITCH.h + MARGIN * 2;
    this.baseScale = Math.min(this.canvas.width / worldW, this.canvas.height / worldH);

    // Kamera daima saha merkezine sabitlenir.
    this.cam.x = PITCH.w / 2;
    this.cam.y = PITCH.h / 2;
  }

  setRoster(list) {
    this.roster = new Map((list || []).map((p) => [p.i, p]));
  }

  // 'far' = tum saha gorunur, 'near' = oyuncuya yakinlasik.
  setZoom(z) {
    this.zoom = z === 'near' ? 'near' : 'far';
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
      golden: b.golden,
      goldenLeft: b.goldenLeft,
    };
  }

  // Kamera sabittir: gorsunum alani degismez, top nereye giderse gitsin
  // tum saha ekranda gorunur kalir. Yakin modda kamera oyuncuya gider.
  draw(now, myId, predicted) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Masa zemini: sahanin etrafini tamamen kaplar (Aniball tarzi).
    ctx.fillStyle = '#a9713c';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const snap = this.sample(now);
    if (!snap) return;

    let scale = this.baseScale;
    let camX = PITCH.w / 2;
    let camY = PITCH.h / 2;
    if (this.zoom === 'near') {
      const focus = predicted || snap.ball;
      camX = focus.x;
      camY = focus.y;
      scale = this.baseScale * ZOOM_NEAR;
    }

    ctx.save();
    ctx.translate(
      this.canvas.width / 2 - camX * scale,
      this.canvas.height / 2 - camY * scale,
    );
    ctx.scale(scale, scale);

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
  }

  drawPitch(ctx) {
    // Sahanin kenari: hafif golge ile masa uzerinde hafif kabartma hissi.
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(-8, -8, PITCH.w + 16, PITCH.h + 16);

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
    ctx.arc(PITCH.w / 2, PITCH.h / 2, PITCH.h * 0.165, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(PITCH.w / 2, PITCH.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Ceza sahasi ve kale sahasi: saha oranina gore olceklenir.
    const pd = PITCH.w * 0.16;
    const ph = PITCH.h * 0.54;
    ctx.strokeRect(0, (PITCH.h - ph) / 2, pd, ph);
    ctx.strokeRect(PITCH.w - pd, (PITCH.h - ph) / 2, pd, ph);

    const gd = PITCH.w * 0.06;
    const gh = PITCH.h * 0.41;
    ctx.strokeRect(0, (PITCH.h - gh) / 2, gd, gh);
    ctx.strokeRect(PITCH.w - gd, (PITCH.h - gh) / 2, gd, gh);

    // Kale aglari: saha disina tasan kutu + ince ag cizgileri.
    const mh = GOAL.height;
    const md = 30;
    const my = (PITCH.h - mh) / 2;
    for (const side of [-1, 1]) {
      const x = side < 0 ? -md : PITCH.w;
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x, my, md, mh);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, my, md, mh);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const gx = x + (md / 5) * i;
        ctx.beginPath();
        ctx.moveTo(gx, my);
        ctx.lineTo(gx, my + mh);
        ctx.stroke();
      }
      for (let i = 1; i < 4; i++) {
        const gy = my + (mh / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + md, gy);
        ctx.stroke();
      }
    }
  }

  drawPlayer(ctx, p, isMe) {
    const info = this.roster.get(p.i);
    const color = TEAM_COLORS[p.tm]?.main || '#ffffff';

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(p.x + 2, p.y + 5, PLAYER.r, PLAYER.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Govde: takim rengi daire.
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.r, 0, Math.PI * 2);
    ctx.fill();

    // Yone bakan nokta.
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.fx || 0);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(PLAYER.r * 0.45, 0, PLAYER.r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Karakter (avatar) rozeti.
    const ch = info?.ch;
    if (ch !== undefined && AVATARS[ch]) {
      ctx.font = '17px "Segoe UI Emoji", "Apple Color Emoji", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(AVATARS[ch], p.x, p.y + 1);
    }

    ctx.strokeStyle = isMe ? '#ffffff' : 'rgba(0,0,0,0.45)';
    ctx.lineWidth = isMe ? 3.5 : 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.r, 0, Math.PI * 2);
    ctx.stroke();

    // Kendi oyuncumuzun ustunde saru ucgen isareti.
    if (isMe) {
      const ty = p.y - PLAYER.r - 9;
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, ty - 8);
      ctx.lineTo(p.x - 8, ty + 5);
      ctx.lineTo(p.x + 8, ty + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Depar (kayma) hazirlık barı - sadece kendi oyuncumuzda.
    if (isMe && typeof p.dsh === 'number') {
      const w = 30;
      const h = 4;
      const bx = p.x - w / 2;
      const by = p.y + PLAYER.r + 4;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(bx, by, w, h);
      ctx.fillStyle = p.dsh >= 1 ? '#facc15' : 'rgba(250,204,21,0.55)';
      ctx.fillRect(bx, by, w * Math.max(0, Math.min(1, p.dsh)), h);
    }

    // Isim etiketi oyuncunun altinda.
    const name = info?.nm || '';
    if (name) {
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const ty = p.y + PLAYER.r + (isMe ? 22 : 16);
      const tw = ctx.measureText(name).width;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(p.x - tw / 2 - 3, ty - 9, tw + 6, 13);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, p.x, ty);
    }

    // Ifade balonu.
    if (typeof p.eml === 'number' && p.eml > 0 && p.em >= 0 && EMOTES[p.em]) {
      this.drawEmote(ctx, p.x, p.y - PLAYER.r - 30, EMOTES[p.em].emoji);
    }
  }

  drawEmote(ctx, x, y, emoji) {
    ctx.font = '18px "Segoe UI Emoji", "Apple Color Emoji", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = 26;
    const h = 26;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);
    } else {
      ctx.rect(x - w / 2, y - h / 2, w, h);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillText(emoji, x, y + 1);
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
}
