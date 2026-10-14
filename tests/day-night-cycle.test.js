const test = require('node:test');
const assert = require('node:assert/strict');

class Color {
  constructor(value = 0) { this.value = value; }
  copy(other) { this.value = other.value; return this; }
  lerp(other, alpha) { this.value += (other.value - this.value) * alpha; return this; }
}

async function createCycleAt(progress) {
  const { createDayNightCycle } = await import('../games/eseksimulator/day-night-cycle.js');
  const scene = { background: new Color(), fog: { color: new Color() } };
  const hemisphere = { color: new Color(), groundColor: new Color(), intensity: 0 };
  const ambient = { color: new Color(), intensity: 0 };
  const sun = { color: new Color(), intensity: 0, position: { set() {} } };
  const streetLamp = { intensity: 0, visible: false };
  createDayNightCycle({ Color }, { scene, hemisphere, ambient, sun, streetLampEmitters: [streetLamp], cycleSeconds: 240, startProgress: progress });
  return streetLamp;
}

test('sokak lambaları gece gerçek ışık verir, gündüz kapanır', async () => {
  const night = await createCycleAt(0.9);
  const day = await createCycleAt(0.5);
  assert.ok(night.visible);
  assert.ok(night.intensity > 30);
  assert.equal(day.visible, false);
  assert.equal(day.intensity, 0);
});
