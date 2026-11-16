// Sunucu ve istemci tarafından ortak kullanılan sabitler.
// Bu dosya saf ESM olmalı (tarayıcıda da doğrudan import edilir).

export const PITCH = { w: 960, h: 600 };

// Kale ağzı: dikeyde ortada, yükseklik GOAL.height
export const GOAL = { height: 150 };

export const PLAYER = {
  r: 16,           // oyuncu yarıçapı
  accel: 900,      // ivme (birim/s^2)
  maxSpeed: 190,   // temel maksimum hız
  friction: 0.88,  // tick başına hız çarpanı
  kickCd: 0.26,    // vuruş arası bekleme (saniye)
  dashSpeed: 520,  // depar (kayma) hızı
  dashCd: 2.5,     // depar arası bekleme (saniye)
  dashTime: 0.22,  // depar sürüş süresi (saniye)
  dashFriction: 0.97,
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
  seconds: 90,        // tek devre süresi
  kickoffDelay: 2.0,  // gol sonrası / başlangıç beklemesi
  goldenSeconds: 60,  // altın gol süresi (beraberlikte)
};

export const TEAM_SIZE = 5;          // takım başına oyuncu (bot dahil) - en fazla
export const MIN_TEAM_SIZE = 1;      // 1v1 modu
export const MAX_ROOM_PLAYERS = TEAM_SIZE * 2;

// Takım başına oyuncu sayısına göre diziliş.
// x: kendi kale çizgisine uzaklık (saha oranı), y: saha oranı.
export const FORMATIONS = {
  1: [{ x: 0.30, y: 0.50, role: 'FWD' }],
  2: [
    { x: 0.08, y: 0.50, role: 'GK' },
    { x: 0.48, y: 0.50, role: 'FWD' },
  ],
  3: [
    { x: 0.08, y: 0.50, role: 'GK' },
    { x: 0.30, y: 0.34, role: 'DEF' },
    { x: 0.54, y: 0.62, role: 'FWD' },
  ],
  4: [
    { x: 0.08, y: 0.50, role: 'GK' },
    { x: 0.28, y: 0.34, role: 'DEF' },
    { x: 0.42, y: 0.66, role: 'MID' },
    { x: 0.62, y: 0.50, role: 'FWD' },
  ],
  5: [
    { x: 0.08, y: 0.50, role: 'GK' },
    { x: 0.28, y: 0.34, role: 'DEF' },
    { x: 0.36, y: 0.66, role: 'DEF' },
    { x: 0.52, y: 0.50, role: 'MID' },
    { x: 0.68, y: 0.58, role: 'FWD' },
  ],
};

export const PHASE = {
  kickoff: 'kickoff',
  play: 'play',
  golden: 'golden',   // beraberlik sonrası altın gol
  end: 'end',
};

// Aniball tarzı ifadeler: 1-6 tuşları ve alt butonlar.
export const EMOTES = [
  { key: '1', emoji: '😂', label: 'Kahkaha' },
  { key: '2', emoji: '🔥', label: 'Ateş' },
  { key: '3', emoji: '💪', label: 'Güç' },
  { key: '4', emoji: '😭', label: 'Ağla' },
  { key: '5', emoji: '😡', label: 'Sinir' },
  { key: '6', emoji: '👋', label: 'Selam' },
];

export const EMOTE_MS = 3000;

// Karakter (avatar) seçimi.
export const AVATARS = ['🐱', '🐶', '🐯', '🦊', '🐻', '🐼', '🐸', '🐷'];
export const AVATAR_COUNT = AVATARS.length;

export const TEAM_COLORS = {
  0: { main: '#38bdf8', dark: '#0ea5e9', name: 'Mavi' },
  1: { main: '#f87171', dark: '#dc2626', name: 'Kırmızı' },
};

export const BOT_NAMES = [
  'Bot Efe', 'Bot Kaan', 'Bot Mert', 'Bot Arda', 'Bot Can',
  'Bot Yigit', 'Bot Ozan', 'Bot Burak', 'Bot Emre', 'Bot Tolga',
];
