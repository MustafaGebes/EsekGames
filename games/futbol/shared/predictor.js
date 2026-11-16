// Yerel tahmin (prediction) + gorsel hata sonumleme.
//
// Sorun: sunucu 20 Hz snapshot gonderir. Onceki surumde her snapshot'ta
// konum hatasinin %30'u ANINDA cekiliyordu. Kalici kucuk bir hata
// (ornegin 14 px) her snapshot'ta ~4 px'lik ziplamaya donusuyordu ve
// oyuncu ekranda "takiliyordu" (rubber-band).
//
// Cozum (netcode teshisi):
//   - Mantiksal durum (state) sunucuya dogru KADEMELI duzeltilir.
//   - Duzeltmenin gorsel kismi ofset olarak devralinir; ofset ~150 ms'de
//     ustel olarak sonumlenir. Ekranda anlik ziplama olmaz, oyuncu
//     yumusakca hatayi kapatir.
//   - Cok buyuk hata (> SNAP_ERR) aninda duzeltilir (snap), aksi halde
//     oyuncu geriden gelirken surekli kayar.

import { applyInput } from './movement.js';
import { PLAYER } from './constants.js';

const SNAP_ERR = 110;     // px: bu esigin uzerindeki hata aninda duzeltilir
const CORRECT = 0.5;      // her snapshot'ta kapatilan hata orani
const OFFSET_TAU = 0.15;  // gorsel ofsetin sonumleme suresi (saniye)

export class Predictor {
  constructor() {
    this.state = null;
    this.offX = 0;
    this.offY = 0;
  }

  reset(p) {
    this.state = {
      x: p.x, y: p.y, vx: p.vx || 0, vy: p.vy || 0, fx: p.fx || 0, tm: p.tm,
      dashCd: 0, dashLeft: 0,
      dashDirX: Math.cos(p.fx || 0), dashDirY: Math.sin(p.fx || 0),
    };
    this.offX = 0;
    this.offY = 0;
  }

  step(dt, input) {
    if (!this.state) return;
    applyInput(this.state, input, dt);
    // Gorsel ofset sonumlenir: eski hata yumusakca kapanir.
    const k = Math.exp(-dt / OFFSET_TAU);
    this.offX *= k;
    this.offY *= k;
  }

  reconcile(p) {
    if (!this.state) {
      this.reset(p);
      return;
    }
    const ex = p.x - this.state.x;
    const ey = p.y - this.state.y;
    const err = Math.hypot(ex, ey);

    if (err > SNAP_ERR) {
      // Buyuk hata (sifirlama, saha degisimi vb.): aninda duzelt.
      this.state.x = p.x;
      this.state.y = p.y;
      this.offX = 0;
      this.offY = 0;
      // Buyuk hata genelde bir oyun olayi (gol sonrasi kickoff sifirlamasi):
      // sunucu depar durumunu da sifirladi, yerel depar da sifirlanir.
      // Aksi halde istemci sunucu durmamis deparla birkac kare kayar.
      this.state.dashLeft = 0;
    } else {
      // Kucuk hata: mantiksal durum kademeli duzeltilir, fark gorsel
      // ofset olarak devralinir -> ekranda anlik ziplama olmaz.
      this.state.x += ex * CORRECT;
      this.state.y += ey * CORRECT;
      this.offX -= ex * CORRECT;
      this.offY -= ey * CORRECT;
    }

    this.state.vx = p.vx;
    this.state.vy = p.vy;
    this.state.tm = p.tm;
    // Depar bekleme suresi sunucudan gelen barla esitlenir.
    if (typeof p.dsh === 'number') {
      this.state.dashCd = Math.max(0, Math.min(PLAYER.dashCd, (1 - p.dsh) * PLAYER.dashCd));
    }
  }

  // Ekranda cizilecek konum: mantiksal konum + yumusak gorsel ofset.
  get renderX() {
    return this.state ? this.state.x + this.offX : 0;
  }

  get renderY() {
    return this.state ? this.state.y + this.offY : 0;
  }
}
