// Menü ve lobi (oda bekleme) ekranlarının arayüz mantığı.
//
// Menü: duyurular, canlı sunucu listesi, "Oyna" (hızlı maç) ve "+" (yeni lobi).
// Lobi: oda kodu, oyuncular, geri sayım; maç başlayınca oyun ekranına geçilir.

export class Lobby {
  constructor(els) {
    this.els = els;
    this.myId = null;
    this.onJoin = () => {};
    this.onCreate = () => {};
    this.onJoinCode = () => {};
    this.onStartNow = () => {};
    this.onLeave = () => {};
    this.bind();
  }

  bind() {
    const e = this.els;
    e.play?.addEventListener('click', () => this.onJoin());
    e.newRoom?.addEventListener('click', () => this.onCreate());
    e.joinCode?.addEventListener('click', () => {
      const code = (e.codeInput?.value || '').trim().toUpperCase();
      if (code) this.onJoinCode(code);
    });
    e.startNow?.addEventListener('click', () => this.onStartNow());
    e.leave?.addEventListener('click', () => this.onLeave());
  }

  // ---------------------------------------------------------------- menü

  setAnnouncements(items) {
    const list = this.els.announcements;
    if (!list) return;
    list.innerHTML = '';
    const arr = Array.isArray(items) ? items : [];
    if (!arr.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Şu an duyuru yok.';
      list.appendChild(li);
      return;
    }
    for (const a of arr) {
      const li = document.createElement('li');
      const title = document.createElement('b');
      title.textContent = a.title || '';
      const date = document.createElement('span');
      date.className = 'ann-date';
      date.textContent = a.date || '';
      const body = document.createElement('p');
      body.textContent = a.body || '';
      li.append(title, date, body);
      list.appendChild(li);
    }
  }

  setServers(rooms) {
    const list = this.els.servers;
    if (!list) return;
    list.innerHTML = '';
    const arr = Array.isArray(rooms) ? rooms : [];
    if (!arr.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Açık oda yok — bir tane kur.';
      list.appendChild(li);
      return;
    }
    for (const r of arr) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'server-btn';
      if (r.started) btn.classList.add('busy');

      const code = document.createElement('span');
      code.className = 'code';
      code.textContent = r.code;

      const info = document.createElement('span');
      info.className = 'info';
      info.textContent = r.started
        ? `${r.size}v${r.size} · oyun sürüyor`
        : `${r.size}v${r.size} · ${r.humans} kişi · ${r.countdown} sn`;

      btn.append(code, info);
      btn.disabled = !!r.started;
      btn.addEventListener('click', () => this.onJoinCode(r.code));
      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  // ---------------------------------------------------------------- lobi

  setRoom(state) {
    const e = this.els;

    if (e.roomCode) e.roomCode.textContent = state.code || '—';
    if (e.roomInfo) {
      const size = state.size || 5;
      e.roomInfo.textContent = `${size}v${size} modu · ${state.humans || 0}/${state.capacity || size * 2} oyuncu`;
    }
    if (e.roomCountdown) {
      e.roomCountdown.textContent = state.started ? 'BAŞLIYOR' : String(state.countdown ?? 0);
    }
    if (e.countdownLabel) {
      e.countdownLabel.textContent = state.started
        ? 'Maç başlıyor…'
        : 'Oyuncular bekleniyor, maç otomatik başlayacak.';
    }
    if (e.startNow) {
      // Erken baslatma sadece odayi kuran oyuncuda olur.
      const isHost = state.host != null && state.host === this.myId;
      e.startNow.classList.toggle('hidden', !isHost || !!state.started);
    }

    const list = e.roomPlayers;
    if (list) {
      list.innerHTML = '';
      for (const p of state.players || []) {
        const li = document.createElement('li');
        li.innerHTML = `<span class="dot t${p.tm}"></span>`
          + `<span class="nm"></span>`
          + `<span class="role">${p.bot ? 'BOT' : p.role}</span>`;
        li.querySelector('.nm').textContent = p.nm;
        list.appendChild(li);
      }
    }
  }

  setMyId(id) {
    this.myId = id;
  }

  // Hangi ekranda oldugumuzu gosterir.
  showMenu() {
    this.els.menu?.classList.remove('hidden');
    this.els.room?.classList.add('hidden');
    this.els.game?.classList.add('hidden');
  }

  showRoom() {
    this.els.menu?.classList.add('hidden');
    this.els.room?.classList.remove('hidden');
    this.els.game?.classList.add('hidden');
  }

  showGame() {
    this.els.menu?.classList.add('hidden');
    this.els.room?.classList.add('hidden');
    this.els.game?.classList.remove('hidden');
  }
}
