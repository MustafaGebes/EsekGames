// DOM üzerindeki HUD (skor, süre, oyuncu listesi, chat, ping).

export class Hud {
  constructor() {
    this.el = {
      score0: document.getElementById('score0'),
      score1: document.getElementById('score1'),
      time: document.getElementById('timeLabel'),
      half: document.getElementById('halfLabel'),
      roster: document.getElementById('rosterList'),
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

  setScore(score, tl, half, phase) {
    this.el.score0.textContent = score?.[0] ?? 0;
    this.el.score1.textContent = score?.[1] ?? 0;
    const t = Math.max(0, Math.ceil(tl || 0));
    const m = Math.floor(t / 60);
    const s = t % 60;
    this.el.time.textContent = `${m}:${String(s).padStart(2, '0')}`;
    this.el.half.textContent = phase === 'halftime' ? 'Devre arası' : `${half}. Devre`;
  }

  setRoster(players, myId) {
    const list = this.el.roster;
    list.innerHTML = '';
    for (const p of players) {
      const li = document.createElement('li');
      const me = p.i === myId ? ' (sen)' : '';
      li.innerHTML = `<span class="dot t${p.tm}"></span><span class="nm">${escapeHtml(p.nm)}${me}</span><span class="role">${p.bot ? 'BOT' : p.role}</span>`;
      list.appendChild(li);
    }
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
