// Gelen mesajların doğrulanması ve temizlenmesi (güvenlik sınırı).

import { AVATAR_COUNT, MIN_TEAM_SIZE, TEAM_SIZE } from '../shared/constants.js';

export function sanitizeName(n) {
  if (typeof n !== 'string') return 'Oyuncu';
  const s = n
    .replace(/[^\p{L}\p{N} _\-.]/gu, '')
    .trim()
    .slice(0, 16);
  return s || 'Oyuncu';
}

export function sanitizeChat(m) {
  if (typeof m !== 'string') return '';
  return m.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 120);
}

export function sanitizeRoom(c) {
  if (typeof c !== 'string') return '';
  return c.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

// Karakter (avatar) indeksi: 0..AVATAR_COUNT-1
export function sanitizeChar(c) {
  const n = Math.round(Number(c));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n > AVATAR_COUNT - 1 ? AVATAR_COUNT - 1 : n;
}

// Maç modu (takım başına oyuncu sayısı): 1..TEAM_SIZE
export function sanitizeMode(m) {
  const n = Math.round(Number(m));
  if (!Number.isFinite(n)) return TEAM_SIZE;
  if (n < MIN_TEAM_SIZE) return MIN_TEAM_SIZE;
  return n > TEAM_SIZE ? TEAM_SIZE : n;
}

export function sanitizeInput(i) {
  if (!i || typeof i !== 'object') {
    return { mx: 0, my: 0, sp: false, k: false, p: false, d: false };
  }
  let mx = Number(i.mx) || 0;
  let my = Number(i.my) || 0;
  const len = Math.hypot(mx, my);
  if (len > 1) {
    mx /= len;
    my /= len;
  }
  return {
    mx,
    my,
    sp: !!i.sp,
    k: !!i.k,
    p: !!i.p,
    d: !!i.d,
  };
}

export function safeJson(raw) {
  if (typeof raw !== 'string') return null;
  if (raw.length > 4096) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
