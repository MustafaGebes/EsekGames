// Gelen mesajların doğrulanması ve temizlenmesi (güvenlik sınırı).

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

export function sanitizeInput(i) {
  if (!i || typeof i !== 'object') return { mx: 0, my: 0, sp: false, k: false, p: false };
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
