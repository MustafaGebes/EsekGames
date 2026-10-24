const test = require('node:test');
const assert = require('node:assert/strict');

class Vector3 {
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
}
class Object3D {
  constructor() {
    this.position = new Vector3();
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = new Vector3();
    this.children = [];
  }
  add(child) { this.children.push(child); return this; }
}
class Group extends Object3D {}
class Mesh extends Object3D {
  constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
}
class Material {
  constructor(options = {}) { Object.assign(this, options); }
}
const geometry = (name) => class {
  constructor(...args) { this.type = name; this.args = args; }
};
const context = {
  fillRect() {}, strokeRect() {}, fillText() {},
};
global.document = {
  createElement() { return { width: 0, height: 0, getContext: () => context }; },
};

const THREE = {
  Group, Mesh,
  BoxGeometry: geometry('box'),
  PlaneGeometry: geometry('plane'),
  ConeGeometry: geometry('cone'),
  CylinderGeometry: geometry('cylinder'),
  SphereGeometry: geometry('sphere'),
  MeshStandardMaterial: Material,
  MeshBasicMaterial: Material,
  CanvasTexture: class { constructor(canvas) { this.canvas = canvas; } },
  DoubleSide: 2,
  SRGBColorSpace: 'srgb',
};

test('kafe, ev ve hastane ayrı iç/dış model parçaları üretir ve kapı akışını korur', async () => {
  const { createEnterableBuildings } = await import('../games/eseksimulator/enterable-buildings.js');
  const scene = new Group();
  const collisionRects = [];
  const specs = [
    { id: 'prototype-cafe', kind: 'cafe', architecture: 'cafe', sign: 'KAFE', w: 8.6, d: 8.4, h: 13, x: 0, z: 0, face: 0, color: 0xc9826c, trim: 0x4c443a, accent: 0x9e6042, awning: 0x84a585, seed: 11 },
    { id: 'prototype-home', kind: 'home', architecture: 'townhouse', sign: 'EV', w: 8.6, d: 8.4, h: 15, x: 20, z: 0, face: 0, color: 0xdcb66d, trim: 0x674638, accent: 0xa87b5d, awning: 0x766354, seed: 13 },
    { id: 'prototype-courtyard', kind: 'home', architecture: 'courtyard-house', sign: 'EV', w: 8.6, d: 8.4, h: 17, x: 40, z: 0, face: 0, color: 0x87a981, trim: 0x405f59, accent: 0x78909a, awning: 0x586e76, seed: 17 },
    { id: 'prototype-hospital', kind: 'hospital', architecture: 'hospital', sign: 'HASTANE', w: 16.5, d: 16.5, h: 16, x: 60, z: 0, face: 0, color: 0xe2d1b5, trim: 0x405f59, accent: 0xc75048, awning: 0xe2d9c8, seed: 19 },
  ];
  const world = createEnterableBuildings(THREE, scene, specs, collisionRects);
  const models = world.buildings;
  assert.equal(models.length, 4);
  assert.equal(new Set(models.map(model => model.root.children.length)).size, 4, 'each prototype should add its own model/interior pieces');
  assert.ok(collisionRects.length > 20, 'room furniture and walls must keep collision shapes');
  assert.equal(world.setDoorOpen('prototype-cafe', true), true);
  world.update(0.1, { x: 0, z: 0 });
  assert.ok(models[0].door.rotation.y < 0, 'the redesigned café must keep its animated entrance');
  assert.ok(scene.children.includes(models[0].root));
});
