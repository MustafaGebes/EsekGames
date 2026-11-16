// Oyuncu hareketi: sunucu (otoriter simülasyon) ve istemci (yerel tahmin)
// ayni fonksiyonu kullanir, böylece iki taraf birebir ayni sonucu üretir.

import { PLAYER } from './constants.js';

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

  // Depar: hareket yonunde (yoksa baki yonunde) hizli it.
  if (input.d && p.dashCd <= 0) {
    let dx = mx;
    let dy = my;
    if (dx === 0 && dy === 0) {
      dx = Math.cos(p.fx || 0);
      dy = Math.sin(p.fx || 0);
    }
    p.vx = dx * PLAYER.dashSpeed;
    p.vy = dy * PLAYER.dashSpeed;
    p.dashCd = PLAYER.dashCd;
    p.dashLeft = PLAYER.dashTime;
    p.fx = Math.atan2(dy, dx);
  }

  p.vx = (p.vx || 0) + mx * PLAYER.accel * dt;
  p.vy = (p.vy || 0) + my * PLAYER.accel * dt;

  const f = Math.pow(p.dashLeft > 0 ? PLAYER.dashFriction : PLAYER.friction, dt * 60);
  p.vx *= f;
  p.vy *= f;

  // Depar sirasinda hiz siniri gecerli degil.
  const maxSpeed = p.dashLeft > 0 ? PLAYER.dashSpeed : PLAYER.maxSpeed;
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > maxSpeed) {
    p.vx = (p.vx / sp) * maxSpeed;
    p.vy = (p.vy / sp) * maxSpeed;
  }

  if (mx !== 0 || my !== 0) {
    p.fx = Math.atan2(my, mx);
  }

  p.x = (p.x || 0) + p.vx * dt;
  p.y = (p.y || 0) + p.vy * dt;

  return p;
}
