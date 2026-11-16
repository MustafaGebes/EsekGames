// Oyuncu hareketi: sunucu (otoriter simülasyon) ve istemci (yerel tahmin)
// aynı fonksiyonu kullanır, böylece iki taraf birebir aynı sonucu üretir.

import { PLAYER } from './constants.js';

export function applyInput(p, input, dt) {
  let mx = Number(input.mx) || 0;
  let my = Number(input.my) || 0;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  const sprint = input.sp ? PLAYER.sprintMul : 1;
  const maxSpeed = PLAYER.maxSpeed * sprint;

  p.vx = (p.vx || 0) + mx * PLAYER.accel * dt;
  p.vy = (p.vy || 0) + my * PLAYER.accel * dt;

  const f = Math.pow(PLAYER.friction, dt * 60);
  p.vx *= f;
  p.vy *= f;

  const sp = Math.hypot(p.vx, p.vy);
  if (sp > maxSpeed) {
    p.vx = (p.vx / sp) * maxSpeed;
    p.vy = (p.vy / sp) * maxSpeed;
    if (sp > 0) p.fx = Math.atan2(p.vy, p.vx);
  }

  if (mx !== 0 || my !== 0) {
    p.fx = Math.atan2(my, mx);
  }

  p.x = (p.x || 0) + p.vx * dt;
  p.y = (p.y || 0) + p.vy * dt;

  return p;
}
