// Oyuncu hareketi: sunucu (otoriter simülasyon) ve istemci (yerel tahmin)
// ayni fonksiyonu kullanir, böylece iki taraf birebir ayni sonucu üretir.
//
// Depar (dash) tasarımı - "takılma" sorununun çözümü:
//   Eski yöntem hızı ANLIK olarak 520'ye atıyor, depar bitince de hız
//   anında 190'a kesiliyordu. Bu iki ani sıçrama oyuncuyu "takılatıyordu".
//   Yeni yöntem:
//     - Depar tetiklenince hız değil YÖN kilitlenir, hız ivme rampasıyla
//       (moveToward) yumuşakça hedefe yaklaşır.
//     - Depar bitince hız sert kesilmez; maxSpeed üstü kısım sürtünme
//       katsayısı yumuşakça artar ve decel hızıyla kademeli düşer.
//   Böylece oyuncu "takılmaz", akıcı bir yay gibi kayar.

import { PLAYER } from './constants.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Değeri hedefe doğru en fazla maxDelta kadar yaklaştırır.
export function moveToward(v, target, maxDelta) {
  if (v < target) return Math.min(v + maxDelta, target);
  if (v > target) return Math.max(v - maxDelta, target);
  return v;
}

export function applyInput(p, input, dt) {
  let mx = Number(input.mx) || 0;
  let my = Number(input.my) || 0;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }

  // Depar (kayma) sayaclari: her iki tarafta da ayni sekilde azalir.
  p.dashCd = Math.max(0, (p.dashCd || 0) - dt);
  p.dashLeft = Math.max(0, (p.dashLeft || 0) - dt);

  // Depar tetiklemesi: yon kilitlenir, hiz ANLIK ATANMAZ.
  if (input.d && p.dashCd <= 0) {
    let dx = mx;
    let dy = my;
    if (dx === 0 && dy === 0) {
      dx = Math.cos(p.fx || 0);
      dy = Math.sin(p.fx || 0);
    }
    const l = Math.hypot(dx, dy) || 1;
    p.dashDirX = dx / l;
    p.dashDirY = dy / l;
    p.dashCd = PLAYER.dashCd;
    p.dashLeft = PLAYER.dashTime;
    p.fx = Math.atan2(p.dashDirY, p.dashDirX);

    // Yon aninda degistirilir ama HIZ korunur (ani sıçrama olmaz).
    const sp = Math.hypot(p.vx || 0, p.vy || 0);
    p.vx = p.dashDirX * sp;
    p.vy = p.dashDirY * sp;
  }

  if (p.dashLeft > 0) {
    // Depar sirasinda: hiz ivme rampasiyla hedefe (dashSpeed) yaklasir.
    const sp = Math.hypot(p.vx || 0, p.vy || 0);
    const newSp = moveToward(sp, PLAYER.dashSpeed, PLAYER.dashAccel * dt);
    p.vx = p.dashDirX * newSp;
    p.vy = p.dashDirY * newSp;
  } else {
    // Normal hareket: ivme + surtunme.
    p.vx = (p.vx || 0) + mx * PLAYER.accel * dt;
    p.vy = (p.vy || 0) + my * PLAYER.accel * dt;

    // Depar sonrasi kalinan hiz icin surtunme yumusak olarak artar:
    // maxSpeed'te normal friction, dashSpeed'e dogru recoverFriction.
    const sp = Math.hypot(p.vx, p.vy);
    const span = Math.max(1, PLAYER.dashSpeed - PLAYER.maxSpeed);
    const over = clamp((sp - PLAYER.maxSpeed) / span, 0, 1);
    const fr = PLAYER.friction + (PLAYER.recoverFriction - PLAYER.friction) * over;
    const f = Math.pow(fr, dt * 60);
    p.vx *= f;
    p.vy *= f;

    // Yumusak hiz siniri: sert kesme yerine kademeli yavaslama.
    const sp2 = Math.hypot(p.vx, p.vy);
    if (sp2 > PLAYER.maxSpeed) {
      const ns = Math.max(PLAYER.maxSpeed, sp2 - PLAYER.decel * dt);
      p.vx = (p.vx / sp2) * ns;
      p.vy = (p.vy / sp2) * ns;
    }
  }

  if (mx !== 0 || my !== 0) {
    p.fx = Math.atan2(my, mx);
  }

  p.x = (p.x || 0) + p.vx * dt;
  p.y = (p.y || 0) + p.vy * dt;

  return p;
}
