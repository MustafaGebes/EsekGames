// Sunucu ve istemci tarafından ortak kullanılan sabitler.
// Bu dosya saf ESM olmalı (tarayıcıda da doğrudan import edilir).

export const PITCH = { w: 960, h: 600 };

// Kale ağzı: dikeyde ortada, yükseklik GOAL.height
export const GOAL = { height: 150 };

export const PLAYER = {
  r: 16,          // oyuncu yarıçapı
  accel: 900,     // ivme (birim/s^2)
  maxSpeed: 190,  // temel maksimum hız
  sprintMul: 1.35,
  friction: 0.88, // tick başına hız çarpanı
  kickCd: 0.26,   // vuruş arası bekleme (saniye)
};

export const BALL = {
  r: 10,
  friction: 0.995,
  kickSpeed: 420,
  passSpeed: 320,
  restSpeed: 12,   // bu hızın altı durmuş sayılır
};

export const TICK = {
  hz: 30,      // sunucu fizik adımı
  snapHz: 20,  // istemciye gönderilen snapshot sıklığı
};

export const MATCH = {
  halfSeconds: 90,   // devre süresi
  kickoffDelay: 2.0, // gol sonrası / başlangıç beklemesi
  halftimeDelay: 3.0,
};

export const TEAM_SIZE = 5;          // takım başına oyuncu (bot dahil)
export const MAX_ROOM_PLAYERS = TEAM_SIZE * 2;

export const TEAM_COLORS = {
  0: { main: '#38bdf8', dark: '#0ea5e9', name: 'Mavi' },
  1: { main: '#f87171', dark: '#dc2626', name: 'Kırmızı' },
};

export const BOT_NAMES = [
  'Bot Efe', 'Bot Kaan', 'Bot Mert', 'Bot Arda', 'Bot Can',
  'Bot Yigit', 'Bot Ozan', 'Bot Burak', 'Bot Emre', 'Bot Tolga',
];

export const PHASE = {
  kickoff: 'kickoff',
  play: 'play',
  halftime: 'halftime',
  end: 'end',
};
