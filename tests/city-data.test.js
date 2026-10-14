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

test('10×10 haritanın tamamı planlı; merkez blok dairesel çeşmeli meydan olarak boş bırakılıyor', () => {
  const plans = [];
  for (let ix = 0; ix < city.blockCount; ix += 1) for (let iz = 0; iz < city.blockCount; iz += 1) plans.push(city.getBlockPlan(ix, iz));
  assert.equal(city.blockCount, 10);
  assert.equal(city.roadLines.length, 11);
  assert.equal(plans.length, 100);
  assert.ok(plans.every(Boolean));
  assert.equal(city.getBlockPlan(5, 5).landUse, 'central-plaza');
  assert.equal(city.getBlockPlan(5, 5).buildings.length, 0);
  assert.deepEqual(city.plazaPosition, { x: 22, z: 22 });
  assert.deepEqual(city.spawnAlley, { ix: 4, iz: 5 });
  assert.equal(city.getBlockPlan(4, 5).landUse, 'spawn-alley');
  assert.equal(city.getBlockPlan(4, 5).buildings.length, 4);
  assert.equal(city.spawnPosition.y, 0);
  assert.ok(Math.abs(city.spawnPosition.x - city.getBlockBounds(4, 5).centerX) < 0.01);
  assert.ok(Math.abs(city.spawnPosition.z - city.getBlockBounds(4, 5).centerZ) < 0.01);
  assert.ok(plans.filter(plan => plan.landUse === 'pocket-park').length >= 10);
  assert.equal(city.roadLines[2], -126);
  assert.equal(city.roadLines[8], 126);
});

test('bütün binaların kimlikleri benzersiz; açılabilir binaların kapı yuvaları korunuyor', () => {
  const footprints = city.getAllBuildingFootprints();
  assert.ok(footprints.length >= 150);
  assert.equal(new Set(footprints.map(building => building.id)).size, footprints.length);
  assert.ok(footprints.every(building => building.id && building.width > 0 && building.depth > 0));
  assert.ok(new Set(footprints.map(building => building.color)).size >= 8, 'facades should use a varied, restrained neighborhood palette');
  for (const building of city.buildings) assert.ok(footprints.some(entry => entry.id === building.id && entry.slot === building.slot), `missing ${building.id}`);
  assert.equal(new Set(city.buildings.map(building => building.slot)).size, city.buildings.length);
});

test('açılabilir bina kataloğunun yuvaları şehir verisiyle bire bir eşleşiyor', async () => {
  const { ENTERABLE_BUILDING_CATALOG } = await import('../games/eseksimulator/enterable-buildings.js');
  const catalogBySlot = new Map(ENTERABLE_BUILDING_CATALOG.map(building => [building.slot, building]));
  assert.equal(catalogBySlot.size, city.buildings.length);
  for (const building of city.buildings) assert.equal(catalogBySlot.get(building.slot)?.id, building.id, `catalog mismatch for ${building.id}`);
});

test('bina ayak izleri birbirine ve kaldırım/parsel sınırlarına taşmıyor', () => {
  const footprints = city.getAllBuildingFootprints();
  for (let i = 0; i < footprints.length; i += 1) {
    const building = footprints[i];
    for (let j = i + 1; j < footprints.length; j += 1) assert.equal(overlaps(building, footprints[j]), false, `${building.id} overlaps ${footprints[j].id}`);
  }
  for (let ix = 0; ix < city.blockCount; ix += 1) for (let iz = 0; iz < city.blockCount; iz += 1) {
    const bounds = city.getBlockBounds(ix, iz), plan = city.getBlockPlan(ix, iz);
    for (const building of plan.buildings) {
      const c = Math.cos(building.face || 0), s = Math.sin(building.face || 0), ex = (Math.abs(c) * building.width + Math.abs(s) * building.depth) / 2, ez = (Math.abs(s) * building.width + Math.abs(c) * building.depth) / 2;
      assert.ok(building.x - ex >= bounds.left - .02, `${building.id} crosses west sidewalk`);
      assert.ok(building.x + ex <= bounds.right + .02, `${building.id} crosses east sidewalk`);
      assert.ok(building.z - ez >= bounds.front - .02, `${building.id} crosses south sidewalk`);
      assert.ok(building.z + ez <= bounds.back + .02, `${building.id} crosses north sidewalk`);
    }
  }
});

test('ara sokaklar düz, sabit genişlikte ve bina cepheleriyle hizalı', () => {
  let residentialLanes = 0, spawnLanes = 0, mixedUseLanes = 0;
  for (let ix = 0; ix < city.blockCount; ix += 1) for (let iz = 0; iz < city.blockCount; iz += 1) {
    const plan = city.getBlockPlan(ix, iz), buildings = plan.buildings;
    if (plan.alley) {
      assert.ok(['x','z'].includes(plan.alley.axis), `alley in ${ix}:${iz} should follow a straight grid axis`);
      assert.ok(plan.alley.width >= 2.4, `alley in ${ix}:${iz} should remain walkable`);
      if (plan.landUse === 'spawn-alley') { assert.equal(plan.alley.axis,'x'); spawnLanes += 1; continue; }
      if (plan.alley.axis === 'x') {
        const south = buildings.filter(building => building.z < plan.alley.centerZ).sort((a, b) => a.x - b.x);
        const north = buildings.filter(building => building.z > plan.alley.centerZ).sort((a, b) => a.x - b.x);
        assert.equal(south.length, 2, `south row in ${ix}:${iz}`);
        assert.equal(north.length, 2, `north row in ${ix}:${iz}`);
        for (const building of south) assert.equal(building.face, 0, `${building.id} should face north into the alley`);
        for (const building of north) assert.equal(building.face, Math.PI, `${building.id} should face south into the alley`);
        for (const building of buildings) assert.ok(Math.abs(building.z - plan.alley.centerZ) - building.depth / 2 >= plan.alley.width / 2 + .65, `${building.id} intrudes into the straight alley`);
        residentialLanes += 1;
      } else {
        const shop = buildings.find(building => building.kind === 'corner-shop'), apartment = buildings.find(building => building.kind === 'apartment');
        const rearHome = buildings.find(building => building.kind === 'townhouse');
        assert.ok(shop && apartment && rearHome, `complete straight mixed-use lane in ${ix}:${iz}`);
        assert.ok(Math.abs(shop.z - apartment.z) < .02, 'shop and apartment fronts should share one straight facade line');
        assert.equal(shop.face, Math.PI / 2); assert.equal(apartment.face, -Math.PI / 2);
        const gap = Math.abs(shop.x - apartment.x) - (shop.depth + apartment.depth) / 2;
        assert.ok(gap - plan.alley.width >= .18, `mixed-use alley is pinched at ${ix}:${iz}`);
        assert.ok(plan.alley.centerZ + plan.alley.length / 2 <= rearHome.z - rearHome.depth / 2 - .5, 'straight alley should end before the rear house');
        mixedUseLanes += 1;
      }
    }
  }
  assert.ok(residentialLanes > 0, 'expected repeated, straight residential alleys');
  assert.equal(spawnLanes, 1, 'the start alley should be the only special spawn lane');
  assert.ok(mixedUseLanes > 0, 'expected mixed-use pedestrian gaps');
});

test('küçük konutlar ve hizmet binaları minimum şehir ölçeğini koruyor', () => {
  const footprints = city.getAllBuildingFootprints();
  for (const building of footprints.filter(entry => ['rowhouse', 'townhouse', 'courtyard-house'].includes(entry.kind))) assert.ok(building.height >= 10, `${building.id} is too short at ${building.height}m`);
  for (const [id, height] of [['city-hospital', 16], ['city-police-station', 14], ['city-fire-station', 15]]) assert.ok(footprints.find(building => building.id === id).height >= height, `${id} should read as a civic landmark`);
});

test('21 çöp kutusu yalnızca aralıklı kaldırım noktalarında; bina ve merkez meydandan uzakta', () => {
  const props = city.getAllStreetProps(), buildings = city.getAllBuildingFootprints();
  assert.equal(props.length, 21);
  assert.equal(new Set(props.map(prop => prop.id)).size, props.length);
  assert.ok(props.every(prop => prop.type === 'dumpster' && prop.hideSpot));
  assert.ok(props.every(prop => prop.blockKey !== '5:5' && Number(prop.blockKey.split(':')[0]) % 2 === 0 && Number(prop.blockKey.split(':')[1]) % 2 === 0));
  for (const prop of props) for (const building of buildings) assert.equal(overlaps(prop, building), false, `${prop.id} overlaps ${building.id}`);
});

test('meydan çevresinde dükkânlar, yakınında hastane/polis/itfaiye ve farklı konut tipleri var', () => {
  const footprints = city.getAllBuildingFootprints(), kinds = new Set(footprints.map(building => building.kind));
  for (const kind of ['rowhouse', 'townhouse', 'apartment', 'corner-shop', 'school', 'police-station', 'fire-station', 'hospital', 'prison', 'library', 'community-center']) assert.ok(kinds.has(kind), `missing ${kind}`);
  for (const id of ['city-police-station', 'city-fire-station', 'city-prison', 'city-hospital']) assert.ok(footprints.some(building => building.id === id), `missing ${id}`);
  assert.equal(city.shops.length, 7);
  assert.ok(city.shops.every(shop => Math.max(Math.abs(Number(shop.slot.split(':')[0]) - 5), Math.abs(Number(shop.slot.split(':')[1]) - 5)) === 1), 'shops should occupy blocks bordering the plaza');
  for (const id of ['city-police-station', 'city-fire-station', 'city-hospital']) {
    const building = footprints.find(entry => entry.id === id);
    assert.ok(Math.hypot(building.x - city.plazaPosition.x, building.z - city.plazaPosition.z) < 90, `${id} should remain near the central neighborhood`);
  }
  const prison = footprints.find(building => building.id === 'city-prison'), police = footprints.find(building => building.id === 'city-police-station');
  assert.ok(prison.width > police.width && prison.depth > police.depth, 'prison should be a larger special facility');
  assert.ok(Math.abs(prison.x - police.x) < 50 && Math.abs(prison.z - police.z) < 2, 'prison should be next to the police station');
  assert.ok(kinds.size >= 15, `expected varied architecture, found ${kinds.size} kinds`);
});

test('eşek doğma noktası meydan yakınındaki dükkân ve konutlar arasındaki yaya aralığında', () => {
  const buildings = city.getBlockPlan(city.spawnAlley.ix, city.spawnAlley.iz).buildings;
  const spawnFootprint = { ...city.spawnPosition, width: .9, depth: .9, face: 0 };
  assert.equal(buildings.length, 4, 'shops and homes remain around the alley');
  assert.deepEqual(buildings.map(building => building.face), [0, 0, Math.PI, Math.PI], 'shop fronts and home entrances face the shared alley');
  assert.ok(Math.hypot(city.spawnPosition.x - city.plazaPosition.x, city.spawnPosition.z - city.plazaPosition.z) < 50, 'the alley remains close to the plaza');
  assert.ok(buildings.every(building => !overlaps(spawnFootprint, building)), 'spawn point must be clear of building footprints');
  assert.ok(!city.getAllStreetProps().some(prop => prop.blockKey === `${city.spawnAlley.ix}:${city.spawnAlley.iz}`));
});

test('combat ve polis değerleri kısa menzil/can ve 60 saniye sözleşmesini koruyor', () => {
  assert.equal(city.policeSearchMs, 60_000);
  assert.ok(city.meleeRange <= 3);
  assert.ok(city.policeFireRange < city.policeVisionRange);
  assert.ok(city.npcHealth <= 2);
  assert.ok(city.citizens.some(person => person.behavior === 'attack'));
  assert.ok(city.citizens.some(person => person.behavior === 'flee'));
});
