// DOM üzerindeki HUD (skor, süre, takım şeritleri, oyuncu listesi, chat, ping).

import { TEAM_COLORS } from '../shared/constants.js';

export class Hud {
  constructor() {
    this.el = {
      score0: document.getElementById('score0'),
      score1: document.getElementById('score1'),
      time: document.getElementById('timeLabel'),
      half: document.getElementById('halfLabel'),
      roster: document.getElementById('rosterList'),
      scorers: document.getElementById('scorerList'),
      strip0: document.getElementById('strip0'),
      strip1: document.getElementById('strip1'),
      zoomBtn: document.getElementById('zoomBtn'),
      chatLog: document.getElementById('chatLog'),
      ping: document.getElementById('pingVal'),
      conn: document.getElementById('connVal'),
      center: document.getElementById('centerMsg'),
      centerText: document.getElementById('centerText'),
      again: document.getElementById('againBtn'),
      toast: document.getElementById('toast'),
    };
    this.centerTimer = null;
    this.toastTimer = null;
  }

  // ------------------------------------------------------------ skor / süre

  setScore(score, tl, phase, golden, goldenLeft) {
    this.el.score0.textContent = score?.[0] ?? 0;
    this.el.score1.textContent = score?.[1] ?? 0;

    if (golden) {
      const g = Math.max(0, Math.ceil(goldenLeft || 0));
      this.el.time.textContent = `0:${String(g).padStart(2, '0')}`;
      this.el.half.textContent = 'Altın Gol';
      this.el.half.classList.add('golden');
      return;
    }
    this.el.half.classList.remove('golden');

    const t = Math.max(0, Math.ceil(tl || 0));
    const m = Math.floor(t / 60);
    const s = t % 60;
    this.el.time.textContent = `${m}:${String(s).padStart(2, '0')}`;
    this.el.half.textContent = phase === 'kickoff' ? 'Başlangıç' : 'Maç';
  }

  // ------------------------------------------------------------ listeler

  setRoster(players, myId) {
    const list = this.el.roster;
    if (list) {
      list.innerHTML = '';
      for (const p of players) {
        const li = document.createElement('li');
        const me = p.i === myId ? ' (sen)' : '';
        li.innerHTML = `<span class="dot t${p.tm}"></span>`
          + `<span class="nm">${escapeHtml(p.nm)}${me}</span>`
          + `<span class="role">${p.bot ? 'BOT' : p.role}</span>`;
        list.appendChild(li);
      }
    }

    // Takim seritleri (ustte 0. takim, altta 1. takim).
    for (const tm of [0, 1]) {
      const strip = this.el[`strip${tm}`];
      if (!strip) continue;
      strip.innerHTML = '';
      const team = players
        .filter((p) => p.tm === tm)
        .sort((a, b) => (a.sl ?? 0) - (b.sl ?? 0));
      for (const p of team) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        if (p.i === myId) badge.classList.add('me');
        badge.style.borderColor = TEAM_COLORS[tm]?.main || '#fff';
        badge.style.background = TEAM_COLORS[tm]?.main || '#1a2a44';
        badge.title = p.nm;
        if (p.g > 0) {
          const g = document.createElement('i');
          g.className = 'g';
          g.textContent = p.g;
          badge.appendChild(g);
        }
        strip.appendChild(badge);
      }
    }

    // Gol atanlar tablosu.
    const sc = this.el.scorers;
    if (sc) {
      sc.innerHTML = '';
      const list2 = players
        .filter((p) => (p.g || 0) > 0)
        .sort((a, b) => (b.g || 0) - (a.g || 0));
      if (!list2.length) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'Henüz gol yok.';
        sc.appendChild(li);
      }
      for (const p of list2) {
        const li = document.createElement('li');
        const me = p.i === myId ? ' (sen)' : '';
        li.innerHTML = `<span class="dot t${p.tm}"></span>`
          + `<span class="nm">${escapeHtml(p.nm)}${me}</span>`
          + `<span class="gcount">${p.g}</span>`;
        sc.appendChild(li);
      }
    }
  }

  // ------------------------------------------------------------ diger

  setZoomLabel(zoom) {
    if (!this.el.zoomBtn) return;
    this.el.zoomBtn.textContent = zoom === 'near' ? 'Kamera: Yakın' : 'Kamera: Uzak';
  }

  addChat(name, msg) {
    const line = document.createElement('div');
    line.className = 'chat-line';
    line.innerHTML = `<b>${escapeHtml(name)}:</b> ${escapeHtml(msg)}`;
    this.el.chatLog.appendChild(line);
    this.el.chatLog.scrollTop = this.el.chatLog.scrollHeight;
  }

  setPing(v) {
    this.el.ping.textContent = v;
  }

  setConn(text) {
    this.el.conn.textContent = text;
  }

  center(text, ms = 2000) {
    this.el.centerText.textContent = text;
    this.el.center.classList.remove('hidden');
    if (this.centerTimer) clearTimeout(this.centerTimer);
    this.centerTimer = setTimeout(() => {
      this.el.center.classList.add('hidden');
    }, ms);
  }

  showAgain() {
    this.el.again.classList.remove('hidden');
  }

  hideAgain() {
    this.el.again.classList.add('hidden');
  }

  toast(text, ms = 2200) {
    this.el.toast.textContent = text;
    this.el.toast.classList.remove('hidden');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.el.toast.classList.add('hidden');
    }, ms);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
