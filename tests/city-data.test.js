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
  for (const building of city.buildings) assert.ok(footprints.some(entry => entry.id === building.id && entry.slot === building.slot), `missing ${building.id}`);
  assert.equal(new Set(city.buildings.map(building => building.slot)).size, city.buildings.length);
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

test('mahalle ara sokakları ve karma kullanımlı dükkân/konut aralıkları yaya geçişine açık', () => {
  let attachedHomeLanes = 0, mixedUseLanes = 0;
  for (let ix = 0; ix < city.blockCount; ix += 1) for (let iz = 0; iz < city.blockCount; iz += 1) {
    const buildings = city.getBlockPlan(ix, iz).buildings;
    const row = buildings.filter(building => ['rowhouse', 'townhouse'].includes(building.kind));
    if (row.length === 3 && Math.max(...row.map(building => building.z)) - Math.min(...row.map(building => building.z)) < .02) {
      row.sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i += 1) assert.ok(row[i].x - row[i - 1].x - (row[i].width + row[i - 1].width) / 2 >= 1.45, `alley between ${row[i - 1].id} and ${row[i].id} is too narrow`);
      attachedHomeLanes += 1;
    }
    const shop = buildings.find(building => building.kind === 'corner-shop'), apartment = buildings.find(building => building.kind === 'apartment');
    if (shop && apartment) {
      const gap = Math.abs(shop.x - apartment.x) - (shop.width + apartment.width) / 2;
      assert.ok(gap >= 1.45, `mixed-use alley between ${shop.id} and ${apartment.id} is too narrow`);
      mixedUseLanes += 1;
    }
  }
  assert.ok(attachedHomeLanes > 0, 'expected attached-home alleys');
  assert.ok(mixedUseLanes > 0, 'expected mixed-use alleys');
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
