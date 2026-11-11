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

test('şehir bina türleri ayrı iç/dış model parçaları üretir ve kapı akışını korur', async () => {
  const { createEnterableBuildings } = await import('../games/eseksimulator/enterable-buildings.js');
  const scene = new Group();
  const collisionRects = [];
  const specs = [
    { id: 'prototype-cafe', kind: 'cafe', architecture: 'cafe', sign: 'KAFE', w: 8.6, d: 8.4, h: 13, x: 0, z: 0, face: 0, color: 0xc9826c, trim: 0x4c443a, accent: 0x9e6042, awning: 0x84a585, seed: 11 },
    { id: 'prototype-home', kind: 'home', architecture: 'townhouse', sign: 'EV', w: 8.6, d: 8.4, h: 15, x: 20, z: 0, face: 0, color: 0xdcb66d, trim: 0x674638, accent: 0xa87b5d, awning: 0x766354, seed: 13 },
    { id: 'prototype-courtyard', kind: 'home', architecture: 'courtyard-house', sign: 'EV', w: 8.6, d: 8.4, h: 17, x: 40, z: 0, face: 0, color: 0x87a981, trim: 0x405f59, accent: 0x78909a, awning: 0x586e76, seed: 17 },
    { id: 'prototype-hospital', kind: 'hospital', architecture: 'hospital', sign: 'HASTANE', w: 16.5, d: 16.5, h: 16, x: 60, z: 0, face: 0, color: 0xe2d1b5, trim: 0x405f59, accent: 0xc75048, awning: 0xe2d9c8, seed: 19 },
  ];
  const additionalKinds = ['apartment','community-center','community-hall','corner-shop','courtyard-house','fire-station','hospital','library','police-station','prison','rowhouse','shop','school','townhouse','workshop','market','grocery','boutique','icecream-shop','armory','veterinary-clinic','clinic'];
  const additionalSpecs = additionalKinds.map((kind,index)=>({id:`archetype-${kind}`,kind,architecture:kind,sign:kind.toLocaleUpperCase('tr-TR'),w:16,d:16,h:16,x:100+index*30,z:0,face:0,color:0xdcb66d,trim:0x405f59,accent:0xc75048,awning:0xe2d9c8,seed:index+21}));
  const world = createEnterableBuildings(THREE, scene, [...specs,...additionalSpecs], collisionRects);
  const models = world.buildings;
  assert.equal(models.length, 4+additionalKinds.length);
  assert.ok(new Set(models.map(model=>model.roofProfile)).size >= 18, 'building archetypes should use distinct roof and massing profiles');
  assert.equal(new Set(models.slice(0,4).map(model => model.root.children.length)).size, 4, 'café, townhouse, courtyard home, and hospital should have distinct model assemblies');
  assert.ok(models.slice(4).every(model=>model.root.children.length>20),'every city archetype should assemble a visible exterior and interior');
  assert.ok(collisionRects.length > 20, 'room furniture and walls must keep collision shapes');
  const hospital = models[3];
  const hospitalExteriorNames = new Set(hospital.root.children.map(child => child.name).filter(Boolean));
  assert.equal(hospital.roofProfile, 'hospital-stepped', 'hospital should retain its stepped civic roof profile');
  for (const name of ['hospital-entrance-canopy','hospital-sign-panel','hospital-sign-text','hospital-central-pavilion','hospital-roof-cross-vertical','hospital-roof-cross-horizontal','hospital-roof-wing--1','hospital-roof-wing-1']) {
    assert.ok(hospitalExteriorNames.has(name), `hospital exterior should include ${name}`);
  }
  const pavilion = hospital.root.children.find(child => child.name === 'hospital-central-pavilion');
  const roofCross = hospital.root.children.find(child => child.name === 'hospital-roof-cross-vertical');
  assert.ok(Math.abs(pavilion.position.y - roofCross.position.y) < 0.1, 'hospital cross should sit on the central pavilion, not float above the roof');
  assert.ok(hospital.root.children.filter(child => child.geometry?.type === 'box' && child.material?.color === 0x83b5c0).length >= 25, 'hospital upper facade should have a five-by-five framed window grid');
  assert.ok(hospital.interiorRoot, 'hospital should expose a separately inspectable interior assembly');
  assert.deepEqual(hospital.hospitalInteriorOpenings.map(opening => opening.side), ['left','right']);
  assert.ok(hospital.hospitalInteriorOpenings.every(opening => opening.hasDoor === false && opening.width >= 2.4), 'both ward openings should be wide and doorless');
  assert.equal(hospital.hospitalInteriorLayout.beds.length, 4, 'hospital should have two beds in each ward');
  assert.deepEqual(hospital.hospitalInteriorLayout.beds.map(bed => bed.side), ['left','left','right','right']);
  const layout = hospital.hospitalInteriorLayout;
  assert.ok((layout.corridorWidth - layout.reception.width) / 2 >= .8, 'clear passage should remain around the reception counter');
  assert.equal(layout.waitingSeats, 4, 'hospital lobby should have two waiting seats on both sides of the central entry aisle');
  assert.equal(layout.curtains.length, 12, 'each patient bed should have a three-sided privacy curtain');
  assert.equal(hospital.interiorRoot.children.filter(child => child.name.startsWith('hospital-bed-monitor-')).length, 4, 'each patient bed should have a monitor');
  assert.equal(hospital.interiorRoot.children.filter(child => child.name.startsWith('hospital-call-button-')).length, 4, 'each patient bed should have a call button');
  assert.ok(hospital.interiorRoot.children.some(child => child.name === 'hospital-pharmacy-rack'), 'lobby should include a stocked pharmacy shelf');
  assert.ok(hospital.interiorRoot.children.some(child => child.name === 'hospital-supply-cart'), 'hospital should include a stocked mobile supply cart');
  const opening = hospital.hospitalInteriorOpenings[0];
  for (const side of [-1,1]) {
    const frontDivider = hospital.interiorRoot.children.find(child => child.name === `hospital-divider-${side}-front`);
    const backDivider = hospital.interiorRoot.children.find(child => child.name === `hospital-divider-${side}-back`);
    const frontEdge = frontDivider.position.z - frontDivider.geometry.args[2] / 2;
    const backEdge = backDivider.position.z + backDivider.geometry.args[2] / 2;
    assert.ok(Math.abs(frontEdge - (opening.z + opening.width / 2)) < .001, 'front partition should stop at the opening edge');
    assert.ok(Math.abs(backEdge - (opening.z - opening.width / 2)) < .001, 'rear partition should stop at the opening edge');
    assert.ok(!hospital.interiorRoot.children.some(child => child.name === `hospital-door-${side}`), 'ward opening should not have a door leaf');
  }
  const partitionX = layout.corridorWidth / 2;
  for (const bed of layout.beds) {
    assert.ok(Math.abs(bed.x) - bed.width / 2 > partitionX, `${bed.id} should stay inside its ward rather than the corridor`);
    assert.ok(Math.abs(bed.x) + bed.width / 2 < hospital.width / 2 - .28, `${bed.id} should not overlap an outside wall`);
    assert.ok(bed.z + bed.depth / 2 < hospital.hospitalInteriorOpenings[0].z - hospital.hospitalInteriorOpenings[0].width / 2, `${bed.id} should leave the doorless entry clear`);
    assert.ok(collisionRects.some(rect => rect.layoutId === bed.id), `${bed.id} should have a matching collision shape`);
  }
  const layoutColliders = hospital.colliders.filter(rect => String(rect.layoutId || '').startsWith('hospital-'));
  assert.ok(layoutColliders.some(rect => rect.layoutId === 'hospital-reception-counter'), 'reception desk should block movement');
  for (const id of ['hospital-waiting-seat-left-1','hospital-waiting-seat-left-2','hospital-waiting-seat-right-1','hospital-waiting-seat-right-2','hospital-pharmacy-rack','hospital-supply-cart','hospital-wheelchair']) {
    assert.ok(layoutColliders.some(rect => rect.layoutId === id), `${id} should have a matching collision shape`);
  }
  for (const rect of layoutColliders) {
    assert.ok(rect.minX >= hospital.x - hospital.width / 2 + .02 && rect.maxX <= hospital.x + hospital.width / 2 - .02, `${rect.layoutId} should fit within the side walls`);
    assert.ok(rect.minZ >= hospital.z - hospital.depth / 2 + .02 && rect.maxZ <= hospital.z + hospital.depth / 2 - .02, `${rect.layoutId} should fit within the front/back walls`);
  }
  const bedColliders = layout.beds.map(bed => collisionRects.find(rect => rect.layoutId === bed.id));
  for (let i = 0; i < bedColliders.length; i += 1) for (let j = i + 1; j < bedColliders.length; j += 1) {
    const a = bedColliders[i], b = bedColliders[j];
    assert.ok(a.maxX <= b.minX || b.maxX <= a.minX || a.maxZ <= b.minZ || b.maxZ <= a.minZ, 'hospital beds should not overlap each other');
  }
  const collidersOverlap = (a,b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
  const receptionCollider = layoutColliders.find(rect => rect.layoutId === 'hospital-reception-counter');
  for (const id of ['hospital-waiting-seat-left-1','hospital-waiting-seat-left-2','hospital-waiting-seat-right-1','hospital-waiting-seat-right-2','hospital-pharmacy-rack','hospital-supply-cart','hospital-wheelchair', ...layout.beds.map(bed => bed.id)]) {
    assert.ok(!collidersOverlap(receptionCollider, layoutColliders.find(rect => rect.layoutId === id)), `${id} should not intersect the reception counter`);
  }
  const waitingSeats = ['hospital-waiting-seat-left-1','hospital-waiting-seat-right-1'].map(id => layoutColliders.find(rect => rect.layoutId === id));
  assert.ok(waitingSeats[0].maxX < receptionCollider.minX && receptionCollider.maxX < waitingSeats[1].minX, 'waiting seats should keep both sides of the lobby route around the desk open');
  assert.equal(world.setDoorOpen('prototype-cafe', true), true);
  assert.equal(world.setDoorOpen('prototype-hospital', true), true);
  world.update(0.1, { x: 0, z: 0 });
  assert.ok(models[0].door.rotation.y < 0, 'the redesigned café must keep its animated entrance');
  assert.ok(hospital.open && hospital.door.rotation.y < 0, 'hospital outer entrance should remain animated while its side ward openings stay doorless');
  assert.ok(scene.children.includes(models[0].root));
});
