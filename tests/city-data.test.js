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

test('10×10 haritanın tüm blokları planlı; eski doğma sokağı ve merkez mahalle korunuyor', () => {
  const plans=[];
  for(let ix=0;ix<city.blockCount;ix++)for(let iz=0;iz<city.blockCount;iz++)plans.push(city.getBlockPlan(ix,iz));
  assert.equal(city.blockCount,10);
  assert.equal(city.roadLines.length,11);
  assert.equal(plans.length,100);
  assert.ok(plans.every(Boolean));
  assert.equal(city.getBlockPlan(5,5).landUse,'spawn-alley');
  assert.equal(city.getBlockPlan(5,5).buildings.length,2);
  assert.equal(city.getBlockPlan(5,5).alleyWidth,4);
  assert.ok(plans.filter(plan=>plan.landUse==='pocket-park').length>=12);
  assert.equal(city.roadLines[2],-126);
  assert.equal(city.roadLines[8],126);
});

test('mahalledeki her bina benzersiz ID ve açılabilir kapı yuvasına sahip', () => {
  const footprints=city.getAllBuildingFootprints();
  assert.ok(footprints.length>=150);
  assert.equal(new Set(footprints.map(building=>building.id)).size,footprints.length);
  assert.ok(footprints.every(building=>building.id&&building.width>0&&building.depth>0));
  for(const building of city.buildings)assert.ok(footprints.some(entry=>entry.id===building.id&&entry.slot===building.slot),`missing ${building.id}`);
  assert.equal(new Set(city.buildings.map(building=>building.slot)).size,city.buildings.length);
});

test('bina ayak izleri birbirine ve kaldırım/parsel sınırlarına taşmıyor', () => {
  const footprints=city.getAllBuildingFootprints();
  for(let i=0;i<footprints.length;i++){
    const building=footprints[i];
    for(let j=i+1;j<footprints.length;j++)assert.equal(overlaps(building,footprints[j]),false,`${building.id} overlaps ${footprints[j].id}`);
  }
  for(let ix=0;ix<city.blockCount;ix++)for(let iz=0;iz<city.blockCount;iz++){
    const bounds=city.getBlockBounds(ix,iz),plan=city.getBlockPlan(ix,iz);
    for(const building of plan.buildings){
      const c=Math.cos(building.face||0),s=Math.sin(building.face||0),ex=(Math.abs(c)*building.width+Math.abs(s)*building.depth)/2,ez=(Math.abs(s)*building.width+Math.abs(c)*building.depth)/2;
      assert.ok(building.x-ex>=bounds.left-.02,`${building.id} crosses west sidewalk`);
      assert.ok(building.x+ex<=bounds.right+.02,`${building.id} crosses east sidewalk`);
      assert.ok(building.z-ez>=bounds.front-.02,`${building.id} crosses south sidewalk`);
      assert.ok(building.z+ez<=bounds.back+.02,`${building.id} crosses north sidewalk`);
    }
  }
});

test('100 kaldırım çöp kutusu düzenli dağılmış; hiçbiri bina içine/üstüne konmuyor',()=>{
  const props=city.getAllStreetProps(),buildings=city.getAllBuildingFootprints();
  assert.equal(props.length,city.blockCount**2);
  assert.equal(new Set(props.map(prop=>prop.id)).size,props.length);
  assert.ok(props.every(prop=>prop.type==='dumpster'&&prop.hideSpot));
  for(const prop of props)for(const building of buildings)assert.equal(overlaps(prop,building),false,`${prop.id} overlaps ${building.id}`);
});

test('bina kataloğu farklı mimari ve oynanabilir kamu hizmetlerini kapsıyor',()=>{
  const kinds=new Set(city.getAllBuildingFootprints().map(building=>building.kind));
  for(const kind of ['rowhouse','townhouse','apartment','corner-shop','school','police-station','fire-station','hospital','prison','library','clinic','community-center','bus-depot','market-hall'])assert.ok(kinds.has(kind),`missing ${kind}`);
  for(const id of ['city-police-station','city-fire-station','city-prison','city-hospital'])assert.ok(city.getAllBuildingFootprints().some(building=>building.id===id),`missing ${id}`);
  const prison=city.getAllBuildingFootprints().find(building=>building.id==='city-prison'),police=city.getAllBuildingFootprints().find(building=>building.id==='city-police-station');
  assert.ok(prison.width>police.width&&prison.depth>police.depth,'prison should be a larger special facility');
  assert.ok(Math.abs(prison.x-police.x)<50&&Math.abs(prison.z-police.z)<2,'prison should be next to the police station');
  assert.ok(kinds.size>=18,`expected varied architecture, found ${kinds.size} kinds`);
});

test('combat ve polis değerleri kısa menzil/can ve 60 saniye sözleşmesini koruyor',()=>{
  assert.equal(city.policeSearchMs,60_000);
  assert.ok(city.meleeRange<=3);
  assert.ok(city.policeFireRange<city.policeVisionRange);
  assert.ok(city.npcHealth<=2);
  assert.ok(city.citizens.some(person=>person.behavior==='attack'));
  assert.ok(city.citizens.some(person=>person.behavior==='flee'));
});
