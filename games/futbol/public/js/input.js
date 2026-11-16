// Klavye + dokunmatik girdi -> input paketi.

const KEYMAP = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = { x: 0, y: 0 };
    this.shot = false;
    this.pass = false;
    this.dash = false;
    this.enabled = false;
  }

  bind() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      const tag = e.target?.tagName || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (KEYMAP[e.code]) {
        this.keys.add(e.code);
        e.preventDefault();
      } else if (e.code === 'Space') {
        this.shot = true;
        e.preventDefault();
      } else if (e.code === 'KeyE') {
        this.pass = true;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
        // Depar (kayma) - Aniball'daki gibi Shift.
        this.dash = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (KEYMAP[e.code]) this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => this.reset());
  }

  reset() {
    this.keys.clear();
    this.dash = false;
    this.touch.x = 0;
    this.touch.y = 0;
  }

  bindTouch(joystick, stick) {
    let active = false;
    let originX = 0;
    let originY = 0;
    const radius = 48;

    const move = (e) => {
      const t = e.touches?.[0] || e;
      const cx = originX;
      const cy = originY;
      let dx = t.clientX - cx;
      let dy = t.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > radius) { dx = (dx / d) * radius; dy = (dy / d) * radius; }
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.touch.x = dx / radius;
      this.touch.y = dy / radius;
    };

    const end = () => {
      active = false;
      stick.style.transform = 'translate(0px, 0px)';
      this.touch.x = 0;
      this.touch.y = 0;
    };

    joystick.addEventListener('touchstart', (e) => {
      const rect = joystick.getBoundingClientRect();
      const t = e.touches[0];
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      active = true;
      move(e);
      e.preventDefault();
    }, { passive: false });

    joystick.addEventListener('touchmove', (e) => {
      if (!active) return;
      move(e);
      e.preventDefault();
    }, { passive: false });

    joystick.addEventListener('touchend', end);
    joystick.addEventListener('touchcancel', end);
  }

  sample() {
    let mx = 0;
    let my = 0;
    for (const code of this.keys) {
      const v = KEYMAP[code];
      mx += v[0];
      my += v[1];
    }
    mx += this.touch.x;
    my += this.touch.y;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }

    const out = { mx, my, sp: false, k: this.shot, p: this.pass, d: this.dash };
    this.shot = false;
    this.pass = false;
    this.dash = false;
    return out;
  }
}
