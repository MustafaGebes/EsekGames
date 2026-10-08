const test = require('node:test');
const assert = require('node:assert/strict');
const city = require('../games/eseksimulator/city-data.js');

const dot = (a, b) => a.x * b.x + a.z * b.z;
function axes(building) {
  const c = Math.cos(building.face || 0), s = Math.sin(building.face || 0);
  return [{ x: c, z: -s }, { x: s, z: c }];
}
function projectedRadius(building, axis) {
  const [xAxis, zAxis] = axes(building);
  return building.width / 2 * Math.abs(dot(xAxis, axis)) + building.depth / 2 * Math.abs(dot(zAxis, axis));
}
function overlaps(a, b) {
  const center = { x: b.x - a.x, z: b.z - a.z };
  return [...axes(a), ...axes(b)].every(axis => Math.abs(dot(center, axis)) < projectedRadius(a, axis) + projectedRadius(b, axis) - 0.12);
}

test('all 36 blocks have explicit plans and the reserved spawn remains open', () => {
  const plans = [];
  for (let ix = 0; ix < 6; ix += 1) for (let iz = 0; iz < 6; iz += 1) plans.push(city.getBlockPlan(ix, iz));
  assert.equal(plans.length, 36);
  assert.ok(plans.every(Boolean));
  assert.equal(city.getBlockPlan(3, 3).landUse, 'spawn-alley');
  assert.equal(city.getBlockPlan(3, 3).buildings.length, 2);
  assert.equal(city.getBlockPlan(3, 3).alleyWidth, 4);
  assert.equal(plans.filter(plan => plan.landUse === 'pocket-park').length, 5);
});

test('all enterable building slots survive the new parcel layout', () => {
  const footprints = city.getAllBuildingFootprints();
  for (const building of city.buildings) assert.ok(footprints.some(footprint => footprint.slot === building.slot), `missing ${building.id}`);
  assert.equal(new Set(city.buildings.map(building => building.slot)).size, city.buildings.length);
});

test('rotated building footprints neither overlap each other nor spill into road/sidewalk margins', () => {
  const footprints = city.getAllBuildingFootprints();
  for (let i = 0; i < footprints.length; i += 1) {
    const building = footprints[i];
    for (let j = i + 1; j < footprints.length; j += 1) assert.equal(overlaps(building, footprints[j]), false, `${building.kind} overlaps ${footprints[j].kind}`);
  }
  for (let ix = 0; ix < 6; ix += 1) for (let iz = 0; iz < 6; iz += 1) {
    const bounds=city.getBlockBounds(ix,iz),plan=city.getBlockPlan(ix,iz);
    for(const building of plan.buildings){
      const c=Math.cos(building.face||0),s=Math.sin(building.face||0);
      const ex=(Math.abs(c)*building.width+Math.abs(s)*building.depth)/2;
      const ez=(Math.abs(s)*building.width+Math.abs(c)*building.depth)/2;
      assert.ok(building.x-ex>=bounds.left-.02, `${building.kind} crosses west sidewalk in ${ix}:${iz}`);
      assert.ok(building.x+ex<=bounds.right+.02, `${building.kind} crosses east sidewalk in ${ix}:${iz}`);
      assert.ok(building.z-ez>=bounds.front-.02, `${building.kind} crosses south sidewalk in ${ix}:${iz}`);
      assert.ok(building.z+ez<=bounds.back+.02, `${building.kind} crosses north sidewalk in ${ix}:${iz}`);
    }
  }
});

test('district includes mixed civic, residential and retail forms, not one repeated building template', () => {
  const kinds = new Set(city.getAllBuildingFootprints().map(building => building.kind));
  for (const kind of ['rowhouse', 'townhouse', 'apartment', 'corner-shop', 'school', 'police-station', 'fire-station', 'library', 'clinic', 'community-center']) assert.ok(kinds.has(kind), `missing ${kind}`);
  assert.ok(kinds.size >= 12, `expected varied architecture, found ${kinds.size} kinds`);
});

test('combat and police tuning shares a short-range, minute-long data contract', () => {
  assert.equal(city.policeSearchMs, 60_000);
  assert.ok(city.meleeRange <= 3);
  assert.ok(city.policeFireRange < city.policeVisionRange);
  assert.ok(city.npcHealth <= 2);
  assert.ok(city.citizens.some(person => person.behavior === 'attack'));
  assert.ok(city.citizens.some(person => person.behavior === 'flee'));
});
