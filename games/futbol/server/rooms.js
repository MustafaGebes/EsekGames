// Oda (lobby) yöneticisi: kod üretme, oda bulma, boş oda temizliği.

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

  ensure(code) {
    let room = this.rooms.get(code);
    if (!room) {
      room = new Room(code);
      this.rooms.set(code, room);
    }
    return room;
  }

  get(code) {
    return this.rooms.get(code);
  }

  list() {
    return [...this.rooms.values()].map((r) => ({
      code: r.code,
      humans: r.humanCount(),
      phase: r.phase,
      score: r.score,
    }));
  }

  cleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.humanCount() === 0 && now - room.lastHumanAt > 120000) {
        this.rooms.delete(code);
      }
    }
  }
}
