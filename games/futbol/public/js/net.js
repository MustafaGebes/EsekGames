// WebSocket istemcisi: otomatik yeniden bağlanma ve ping ölçümü.

export class Net {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = new Map();
    this.status = 'idle';
    this.retry = 0;
    this.ping = null;
    this.onStatus = () => {};
    this.onPing = () => {};
    this.pingTimer = null;
  }

  on(type, fn) { this.handlers.set(type, fn); }

  emit(type, data) {
    const h = this.handlers.get(type);
    if (h) h(data);
  }

  setStatus(s) {
    this.status = s;
    this.onStatus(s);
  }

  connect() {
    if (this.status === 'connecting') return;
    this.setStatus('connecting');
    let ws;
    try {
      ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.retry = 0;
      this.setStatus('online');
      this.startPing();
    };

    ws.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (m.t === 'pong') {
        const v = Math.round(performance.now() - (m.ts || 0));
        this.ping = v;
        this.onPing(v);
        return;
      }
      this.emit(m.t, m);
    };

    ws.onclose = () => {
      this.stopPing();
      this.setStatus('offline');
      this.scheduleReconnect();
    };

    ws.onerror = () => {};
  }

  scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(1.6, this.retry), 8000);
    this.retry++;
    setTimeout(() => this.connect(), delay);
  }

  startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ t: 'ping', ts: performance.now() });
    }, 3000);
  }

  stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  send(obj) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(obj));
      return true;
    }
    return false;
  }
}
