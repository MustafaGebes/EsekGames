// Oda (lobi) yöneticisi: kod üretme, oda bulma, hızlı eşleşme, boş oda temizliği.

import { Room } from './game.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  randomCode() {
    let code;
    do {
      code = Array.from(
        { length: 5 },
        () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
      ).join('');
    } while (this.rooms.has(code));
    return code;
  }

  ensure(code, teamSize) {
    let room = this.rooms.get(code);
    if (!room) {
      room = new Room(code, teamSize);
      this.rooms.set(code, room);
    }
    return room;
  }

  // Yeni oda kur (her zaman benzersiz kod ile).
  create(teamSize) {
    const code = this.randomCode();
    return this.ensure(code, teamSize);
  }

  get(code) {
    return this.rooms.get(code);
  }

  // Hızlı maç: aynı modda, henüz başlamamış ve yer olan bir oda bul.
  // Yoksa null döner (çağıran yeni oda kurar).
  findOpen(teamSize) {
    let best = null;
    for (const room of this.rooms.values()) {
      if (room.started) continue;
      if (room.teamSize !== teamSize) continue;
      if (room.humanCount() >= room.capacity()) continue;
      if (!best || room.humanCount() > best.humanCount()) best = room;
    }
    return best;
  }

  // Menüde gösterilen sunucu listesi (insanı olan odalar).
  list() {
    return [...this.rooms.values()]
      .filter((r) => r.humanCount() > 0)
      .map((r) => ({
        code: r.code,
        humans: r.humanCount(),
        size: r.teamSize,
        started: r.started,
        countdown: Math.max(0, Math.ceil(r.lobbyLeft)),
      }));
  }

  cleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.humanCount() === 0) {
        // Başlamamış ve boş lobi anında silinir; oyuncu eskisi görünmesin.
        if (!room.started) {
          this.rooms.delete(code);
          continue;
        }
        // Maçı bitip boşalan oda kısa süre sonra silinir, aynı kod tekrar kullanılabilir.
        if (now - room.lastHumanAt > 15000) this.rooms.delete(code);
      }
    }
  }
}
