// Yerel tahmin (prediction) + uzaktan oyuncular için interpolasyon desteği.

import { applyInput } from '../shared/movement.js';
import { PLAYER } from '../shared/constants.js';

export class Predictor {
  constructor() {
    this.state = null;
  }

  reset(p) {
    this.state = {
      x: p.x, y: p.y, vx: p.vx || 0, vy: p.vy || 0, fx: p.fx || 0, tm: p.tm,
      dashCd: 0, dashLeft: 0,
    };
  }

  step(dt, input) {
    if (!this.state) return;
    applyInput(this.state, input, dt);
  }

  reconcile(p) {
    if (!this.state) {
      this.reset(p);
      return;
    }
    const ex = p.x - this.state.x;
    const ey = p.y - this.state.y;
    const err = Math.hypot(ex, ey);
    if (err > 70) {
      this.reset(p);
      return;
    }
    this.state.x += ex * 0.3;
    this.state.y += ey * 0.3;
    this.state.vx = p.vx;
    this.state.vy = p.vy;
    this.state.tm = p.tm;
    // Depar bekleme suresi sunucudan gelen barla esitlenir.
    if (typeof p.dsh === 'number') {
      this.state.dashCd = Math.max(0, Math.min(PLAYER.dashCd, (1 - p.dsh) * PLAYER.dashCd));
    }
  }
}
