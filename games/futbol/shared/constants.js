// Sunucu ve istemci tarafından ortak kullanılan sabitler.
// Bu dosya saf ESM olmalı (tarayıcıda da doğrudan import edilir).

export const PITCH = { w: 880, h: 540 };

// Kale ağzı: dikeyde ortada, yükseklik GOAL.height
export const GOAL = { height: 130 };

export const PLAYER = {
  r: 19,           // oyuncu yarıçapı
  accel: 900,      // ivme (birim/s^2)
  maxSpeed: 190,   // temel maksimum hız
  friction: 0.88,  // tick başına hız çarpanı
  kickCd: 0.26,    // vuruş arası bekleme (saniye)
  // Depar (kayma): hız ANLIK atanmaz, ivme rampasıyla yumuşakça yükselir.
  dashSpeed: 430,    // depar hedef hızı
  dashAccel: 2000,   // depar ivmesi (birim/s^2)
  dashCd: 2.2,       // depar arası bekleme (saniye)
  dashTime: 0.34,    // depar sürüş süresi (saniye)
  // Depar bittikten sonra hız sert kesilmez, kademeli olarak yavaşlar.
  recoverFriction: 0.96,
  decel: 420,        // yumuşak hız sınırı (birim/s^2)
};

export const BALL = {
  r: 12,
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

// Lobi (oda bekleme) ayarları.
export const LOBBY = {
  waitSeconds: 10,   // odaya girince maç otomatik başlamadan önceki bekleme
  roomListHz: 2,     // sunucu listesinin sunucudan gönderilme sıklığı (saniye)
};

// Menüde gösterilen duyurular. Sunucu tarafında tanımlanır, istemciye gönderilir.
export const ANNOUNCEMENTS = [
  {
    title: 'Yeni lobi ekranı',
    body: 'Artık menüden "Oyna" ile hızlı maça başlayabilir, "+" ile kendi lobini kurabilirsin. Lobin sunucu listesinde görünür, oyuncular bekler ve maç otomatik başlar.',
    date: '16.11.2026',
  },
  {
    title: 'Akıcı depar',
    body: 'Shift (depar) artık anlık hız atlamıyor; ivme rampasıyla yumuşakça hızlanıyor ve yavaşlıyor.',
    date: '16.11.2026',
  },
  {
    title: 'Sadece renk',
    body: 'Oyuncularda avatar ve ifade kaldırıldı. Her oyuncu artık takım renginde bir daire.',
    date: '16.11.2026',
  },
  {
    title: '1v1 - 5v5 modları',
    body: 'Maç modunu menüden seç, oda büyüklüğü ona göre ayarlansın. Eksik oyuncuları botlar tamamlar.',
    date: '15.11.2026',
  },
];

export const TEAM_COLORS = {
  0: { main: '#38bdf8', dark: '#0ea5e9', name: 'Mavi' },
  1: { main: '#f87171', dark: '#dc2626', name: 'Kırmızı' },
};

export const BOT_NAMES = [
  'Bot Efe', 'Bot Kaan', 'Bot Mert', 'Bot Arda', 'Bot Can',
  'Bot Yigit', 'Bot Ozan', 'Bot Burak', 'Bot Emre', 'Bot Tolga',
];
