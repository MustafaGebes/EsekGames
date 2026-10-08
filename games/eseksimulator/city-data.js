(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.EsekCityData = data;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const roadLines = Object.freeze([-210, -168, -126, -84, -42, 0, 42, 84, 126, 168, 210]);
  const blockCount = roadLines.length - 1;
  const roadWidth = (value) => Math.abs(value) < 0.01 ? 14 : (Math.abs(value) < 50 ? 10 : 8.5);
  const parks = new Set(['2:2','2:6','3:7','6:2','7:6','0:0','0:8','1:9','4:0','4:9','8:1','9:4','9:8']);
  const civicUses = Object.freeze({
    '7:2':'police-station','3:2':'school','6:3':'fire-station','2:4':'library','7:5':'clinic','3:6':'community-center',
    '8:2':'prison','4:1':'train-station','0:5':'veterinary-clinic','1:1':'gas-station','1:7':'market-hall','8:5':'bus-depot','9:2':'parking-garage','5:8':'sports-center'
  });
  const facadePalette = Object.freeze([0xb8aa94, 0xa59c8d, 0x8f8579, 0xb5b3a7, 0x9da7a5, 0x9e8575, 0xc0b08f, 0x777875, 0xa99d8a]);
  const trimPalette = Object.freeze([0x665b4e, 0x514d47, 0x756954, 0x686b66, 0x594b42]);

  function getBlockBounds(ix, iz) {
    if (!Number.isInteger(ix) || !Number.isInteger(iz) || ix < 0 || ix >= blockCount || iz < 0 || iz >= blockCount) return null;
    const left = roadLines[ix] + roadWidth(roadLines[ix]) / 2 + 4.15;
    const right = roadLines[ix + 1] - roadWidth(roadLines[ix + 1]) / 2 - 4.15;
    const front = roadLines[iz] + roadWidth(roadLines[iz]) / 2 + 4.15;
    const back = roadLines[iz + 1] - roadWidth(roadLines[iz + 1]) / 2 - 4.15;
    return { left, right, front, back, width: right - left, depth: back - front, centerX: (left + right) / 2, centerZ: (front + back) / 2 };
  }

  function getBuildingSlot(slot) {
    const [ix, iz, index] = String(slot).split(':').map(Number);
    const bounds = getBlockBounds(ix, iz);
    if (!bounds || !Number.isInteger(index) || index < 0 || index > 4) return null;
    if(index===4){const width=Math.max(8,Math.min(bounds.width-3.4,16.5)),depth=Math.max(8,Math.min(bounds.depth-3.4,16.5));return{x:bounds.centerX,z:bounds.centerZ,width,depth,face:Math.PI,ix,iz,index};}
    const outerBlock = ix === 0 || iz === 0 || ix === blockCount - 1 || iz === blockCount - 1;
    const centers = outerBlock ? [[-1, -1], [1, 1]] : [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    const signs = centers[index];
    if (!signs) return null;
    const [sx, sz] = signs;
    const width = Math.min(8.6, (bounds.width - 4.5) / 2);
    const depth = Math.min(8.4, (bounds.depth - 4.5) / 2);
    const x = bounds.centerX + sx * (width / 2 + 1.65);
    const z = bounds.centerZ + sz * (depth / 2 + 1.65);
    const distanceLeft = Math.abs(x - bounds.left);
    const distanceRight = Math.abs(bounds.right - x);
    const distanceFront = Math.abs(z - bounds.front);
    const distanceBack = Math.abs(bounds.back - z);
    const closest = Math.min(distanceLeft, distanceRight, distanceFront, distanceBack);
    const face = closest === distanceLeft ? -Math.PI / 2 : closest === distanceRight ? Math.PI / 2 : closest === distanceFront ? Math.PI : 0;
    return { x, z, width, depth, face, ix, iz, index };
  }

  const items = Object.freeze([
    { id: 'icecream', name: 'Dondurma', icon: '🍦', category: 'Yiyecek', kind: 'food', price: 8, heal: 0.25, stackable: true, description: 'Serinletici bir atıştırmalık.' },
    { id: 'bottled_water', name: 'Su', icon: '💧', category: 'Yiyecek', kind: 'food', price: 6, heal: 0.2, stackable: true, description: 'Küçük bir enerji takviyesi.' },
    { id: 'coffee', name: 'Sıcak kahve', icon: '☕', category: 'Yiyecek', kind: 'food', price: 10, heal: 0.3, stackable: true, description: 'Biraz toparlanmana yardım eder.' },
    { id: 'soup', name: 'Günün çorbası', icon: '🥣', category: 'Yiyecek', kind: 'food', price: 16, heal: 0.8, stackable: true, description: 'Sıcak bir öğün; az miktarda can yeniler.' },
    { id: 'sandwich', name: 'Sandviç', icon: '🥪', category: 'Yiyecek', kind: 'food', price: 13, heal: 0.6, stackable: true, description: 'Yolda yemek için pratik.' },
    { id: 'bread', name: 'Ekmek', icon: '🍞', category: 'Yiyecek', kind: 'food', price: 7, heal: 0.3, stackable: true, description: 'Mahalle fırınından taze ekmek.' },
    { id: 'bandage', name: 'İlk yardım kiti', icon: '🩹', category: 'Sağlık', kind: 'food', price: 28, heal: 2, stackable: true, description: 'Kullanıldığında 2 kalbe kadar can yeniler.' },
    { id: 'wooden_baton', name: 'Tahta sopa', icon: '🪵', category: 'Yakın dövüş', kind: 'weapon', price: 45, damage: 3, range: 3.2, description: 'Yumruğa göre daha etkili, kısa menzilli oyun eşyası.' },
    { id: 'street_baton', name: 'Sağlam cop', icon: '🥢', category: 'Yakın dövüş', kind: 'weapon', price: 95, damage: 4, range: 3.4, description: 'Yakın dövüşte kullanılan oyun eşyası.' },
    { id: 'flashlight', name: 'El feneri', icon: '🔦', category: 'Alet', kind: 'tool', price: 22, description: 'Karanlık sokaklarda kullanabileceğin bir alet.' },
    { id: 'wrench', name: 'İngiliz anahtarı', icon: '🔧', category: 'Alet', kind: 'weapon', price: 36, damage: 2.5, range: 2.8, description: 'Aletçi tezgâhından sağlam bir anahtar.' },
    { id: 'repair_kit', name: 'Tamir kiti', icon: '🧰', category: 'Alet', kind: 'tool', price: 32, description: 'Şehirde saklayabileceğin küçük bir tamir seti.' },
    { id: 'jacket', name: 'Mahalle ceketi', icon: '🧥', category: 'Kıyafet', kind: 'armor', price: 65, damageReduction: 0.1, description: 'Hafif bir ceket; alınan hasarı az miktarda azaltır.' },
    { id: 'safety_vest', name: 'Koruyucu yelek', icon: '🦺', category: 'Kıyafet', kind: 'armor', price: 135, damageReduction: 0.25, description: 'Daha dayanıklı bir oyun içi koruyucu yelek.' },
  ]);

  const shiftSlot=(value)=>{const [ix,iz,index]=value.split(':').map(Number);return `${ix+2}:${iz+2}:${index}`;};
  const shops = Object.freeze([
    { id: 'icecream-shop', slot: '2:3:0', title: 'Dondurmacı', items: ['icecream', 'bottled_water'] },
    { id: 'weapons-shop', slot: '2:3:1', title: 'Silahçı', items: ['wooden_baton', 'street_baton'] },
    { id: 'cafe', slot: '2:3:2', title: 'Kafeci', items: ['coffee', 'soup', 'sandwich'] },
    { id: 'market', slot: '2:3:3', title: 'Marketçi', items: ['bread', 'bottled_water', 'bandage'] },
    { id: 'grocery', slot: '3:2:0', title: 'Bakkal', items: ['bread', 'bottled_water', 'bandage'] },
    { id: 'tool-shop', slot: '3:2:1', title: 'Aletçi', items: ['flashlight', 'wrench', 'repair_kit'] },
    { id: 'clothing-shop', slot: '3:4:2', title: 'Zırh & Kıyafet', items: ['jacket', 'safety_vest'] },
  ].map((shop)=>({...shop,slot:shiftSlot(shop.slot)})));

  const buildings = Object.freeze([
    ...shops.map((shop) => ({ id: shop.id, slot: shop.slot, title: shop.title, kind: 'shop' })),
    { id: 'home-one', slot: shiftSlot('2:2:3'), title: 'Ev', kind: 'home' },
    { id: 'home-two', slot: shiftSlot('4:4:0'), title: 'Ev', kind: 'home' },
    { id: 'city-hospital', slot: shiftSlot('2:2:0'), title: 'Şehir Hastanesi', kind: 'hospital' },
    { id: 'city-police-station', slot: '7:2:4', title: 'Polis Merkezi', kind: 'police-station' },
    { id: 'city-fire-station', slot: '6:3:4', title: 'İtfaiye', kind: 'fire-station' },
    { id: 'city-prison', slot: '8:2:4', title: 'Şehir Hapishanesi', kind: 'prison' },
  ]);
  const enterableBySlot = new Map(buildings.map((building) => [building.slot, building]));

  function footprint(kind, x, z, width, depth, height, face, seed, slot = null) {
    const ix=slot?Number(slot.split(':')[0]):Math.max(0,Math.min(blockCount-1,Math.floor((x-roadLines[0])/42)));
    const iz=slot?Number(slot.split(':')[1]):Math.max(0,Math.min(blockCount-1,Math.floor((z-roadLines[0])/42)));
    const id=slot?(enterableBySlot.get(slot)?.id||`city-building-slot-${slot.replaceAll(':','-')}`):`city-building-${ix}-${iz}-${Math.round(x*10)}-${Math.round(z*10)}-${seed}`;
    return {
      id, kind, x, z, width, depth, height, face, slot,
      color: facadePalette[Math.abs(seed) % facadePalette.length],
      trim: trimPalette[(seed * 3 + 1) % trimPalette.length],
      seed,
    };
  }

  function getBlockPlan(ix, iz) {
    const bounds = getBlockBounds(ix, iz);
    if (!bounds) return null;
    if (ix === 5 && iz === 5) {
      const alleyWidth=4.0,facadeLength=18,buildingDepth=8.1,offset=(alleyWidth+buildingDepth)/2;
      return { ix, iz, landUse: 'spawn-alley', alleyWidth, buildings: [
        footprint('apartment',bounds.centerX-offset,bounds.centerZ,facadeLength,buildingDepth,21,Math.PI/2,31),
        footprint('apartment',bounds.centerX+offset,bounds.centerZ,facadeLength,buildingDepth,18,-Math.PI/2,32),
      ] };
    }
    const blockKey = `${ix}:${iz}`;
    const serviceKind=civicUses[blockKey];
    const required = buildings.filter((building) => building.slot.startsWith(`${blockKey}:`));
    const specialFacility=required.find((building)=>building.slot.endsWith(':4'));
    if(specialFacility){const slot=getBuildingSlot(specialFacility.slot),isPrison=specialFacility.id==='city-prison',width=isPrison?Math.min(bounds.width-5,slot.width*1.16):slot.width,depth=isPrison?Math.min(bounds.depth-5,slot.depth*1.16):slot.depth;return{ix,iz,landUse:serviceKind||specialFacility.kind,buildings:[footprint(specialFacility.kind,slot.x,slot.z,width,depth,serviceKind==='police-station'?11:serviceKind==='fire-station'?10:10,slot.face,ix*31+iz*17,specialFacility.slot)]};}
    if (required.length) {
      const planned = [];
      for (let index = 0; index < 4; index += 1) {
        const slotName = `${blockKey}:${index}`;
        const slot = getBuildingSlot(slotName);
        if (!slot) continue;
        const known = enterableBySlot.get(slotName);
        const archetypes = ['rowhouse', 'corner-shop', 'apartment', 'townhouse'];
        planned.push(footprint(known ? known.kind : archetypes[(ix + iz + index) % archetypes.length], slot.x, slot.z, slot.width, slot.depth, known?.kind === 'hospital' ? 14 : 9 + ((ix * 3 + iz + index) % 4) * 2, slot.face, ix * 19 + iz * 11 + index, slotName));
      }
      return { ix, iz, landUse: 'mixed-use', buildings: planned };
    }
    if (parks.has(blockKey)) return { ix, iz, landUse: 'pocket-park', buildings: [] };

    const h = (ix * 73 + iz * 151 + ix * iz * 29 + 47) % 997;
    const innerW = Math.max(15, bounds.width - 2.6);
    const innerD = Math.max(15, bounds.depth - 2.6);
    const cx = bounds.centerX, cz = bounds.centerZ;
    const streetFace = ((ix + iz) % 2 === 0) ? Math.PI : 0;
    if (serviceKind) {
      const dimensions = serviceKind === 'school' ? [innerW * .79, innerD * .73, 11] : [innerW * .78, innerD * .72, 10];
      return { ix, iz, landUse: serviceKind, buildings: [footprint(serviceKind, cx, cz, dimensions[0], dimensions[1], dimensions[2], streetFace, h)] };
    }

    const plans = [];
    const push = (kind, x, z, w, d, height, face = streetFace, offset = 0) => plans.push(footprint(kind, x, z, w, d, height, face, h + offset));
    switch (h % 6) {
      case 0: { // Narrow attached homes along a walkable mid-block lane.
        const w = Math.min(6.0, (innerW - 3.2) / 3), d = innerD * .68;
        for (let i = 0; i < 3; i += 1) push(i === 1 ? 'townhouse' : 'rowhouse', cx + (i - 1) * (w + .95), cz, w, d, 7 + ((h + i) % 3) * 2, streetFace, i);
        break;
      }
      case 1: { // A deep courtyard pair with distinct footprints and heights.
        push('apartment', cx - innerW * .25, cz, innerW * .39, innerD * .76, 17 + (h % 5), 0, 1);
        push('courtyard-house', cx + innerW * .25, cz + innerD * .06, innerW * .34, innerD * .64, 8 + (h % 4), Math.PI, 2);
        break;
      }
      case 2: { // A corner shop, small rear house, and a taller mixed-use block.
        push('corner-shop', cx - innerW * .23, cz - innerD * .23, innerW * .40, innerD * .36, 9, Math.PI, 3);
        push('apartment', cx + innerW * .22, cz - innerD * .18, innerW * .40, innerD * .44, 18 + (h % 6), 0, 4);
        push('townhouse', cx, cz + innerD * .28, innerW * .47, innerD * .28, 8, 0, 5);
        break;
      }
      case 3: { // A single distinctive civic-scale workshop or community hall.
        push(h % 12 === 3 ? 'community-hall' : 'workshop', cx, cz, innerW * .78, innerD * .70, 9 + (h % 6), streetFace, 6);
        break;
      }
      case 4: { // Four varied houses around a shared, open courtyard.
        const w = innerW * .39, d = innerD * .36;
        const positions = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
        positions.forEach(([sx, sz], i) => push(i === 2 ? 'courtyard-house' : 'townhouse', cx + sx * innerW * .255, cz + sz * innerD * .25, w * (i === 1 ? .9 : 1), d * (i === 0 ? .88 : 1), 7 + ((h + i) % 4) * 2, i % 2 ? Math.PI / 2 : streetFace, 7 + i));
        break;
      }
      default: { // Apartments with a lower wing, keeping the block permeable.
        push('apartment', cx - innerW * .17, cz, innerW * .47, innerD * .68, 19 + (h % 7), 0, 12);
        push('townhouse', cx + innerW * .31, cz + innerD * .19, innerW * .24, innerD * .34, 8, Math.PI, 13);
        break;
      }
    }
    return { ix, iz, landUse: 'residential-mixed', buildings: plans };
  }

  function getAllBuildingFootprints() {
    const output = [];
    for (let ix = 0; ix < blockCount; ix += 1) for (let iz = 0; iz < blockCount; iz += 1) {
      const plan = getBlockPlan(ix, iz);
      if (plan) output.push(...plan.buildings);
    }
    return output;
  }

  function getBlockStreetProps(ix,iz){
    const bounds=getBlockBounds(ix,iz);if(!bounds)return[];
    const left=(ix+iz)%2===0,offset=((ix*7+iz*11)%3-1)*5.4;
    return[{id:`dumpster-${ix}-${iz}`,type:'dumpster',x:left?bounds.left-.95:bounds.right+.95,z:bounds.centerZ+offset,width:.92,depth:.78,rotation:left?-Math.PI/2:Math.PI/2,hideSpot:true}];
  }
  function getAllStreetProps(){const out=[];for(let ix=0;ix<blockCount;ix++)for(let iz=0;iz<blockCount;iz++)out.push(...getBlockStreetProps(ix,iz));return out;}

  const citizens = Object.freeze([
    { id: 'citizen-elif', name: 'Elif', disposition: 'friendly', behavior: 'flee', x: -34.75, z: -21, yaw: Math.PI, cashDrop: 18, dialogue: 'Merhaba! Dondurmacı köşedeki sokakta, iyi günler.' },
    { id: 'citizen-ali', name: 'Ali', disposition: 'neutral', behavior: 'attack', x: -49.25, z: 21, yaw: 0, cashDrop: 24, dialogue: 'Şehir bugün epey hareketli.' },
    { id: 'citizen-deniz', name: 'Deniz', disposition: 'friendly', behavior: 'flee', x: -7.25, z: -21, yaw: Math.PI / 2, cashDrop: 32, dialogue: 'Kaldırımlardan gitmek daha rahat.' },
    { id: 'citizen-mert', name: 'Mert', disposition: 'neutral', behavior: 'flee', x: 7.25, z: 21, yaw: -Math.PI / 2, cashDrop: 26, dialogue: 'Ben sadece yoluma bakıyorum.' },
    { id: 'citizen-kabadayi-1', name: 'Sokak kabadayısı', disposition: 'aggressive', behavior: 'attack', x: 34.75, z: -21, yaw: Math.PI, cashDrop: 48, dialogue: 'Burada ne işin var? Uzak dur.' },
    { id: 'citizen-kabadayi-2', name: 'Huysuz mahalleli', disposition: 'aggressive', behavior: 'attack', x: 49.25, z: 21, yaw: 0, cashDrop: 55, dialogue: 'Bana bulaşma, kendi işine bak.' },
    { id: 'citizen-irem', name: 'İrem', disposition: 'friendly', behavior: 'flee', x: -21, z: 7.25, yaw: 0, cashDrop: 22, dialogue: 'Hastane yakındaki ara sokakta. Kendine dikkat et.' },
    { id: 'citizen-kaan', name: 'Kaan', disposition: 'neutral', behavior: 'attack', x: 21, z: -7.25, yaw: Math.PI, cashDrop: 29, dialogue: 'Yeni açılan dükkânları gördün mü?' },
  ]);

  const hospitalSlot = getBuildingSlot('4:4:0');
  const hospitalSpawn = Object.freeze({
    x: hospitalSlot.x + Math.sin(hospitalSlot.face) * (hospitalSlot.depth / 2 - 1.8),
    y: 0,
    z: hospitalSlot.z + Math.cos(hospitalSlot.face) * (hospitalSlot.depth / 2 - 1.8),
  });

  return Object.freeze({
    roadLines,
    roadWidth,
    blockCount,
    getBlockBounds,
    getBlockStreetProps,
    getAllStreetProps,
    getBuildingSlot,
    getBlockPlan,
    getAllBuildingFootprints,
    items,
    shops,
    buildings,
    citizens,
    hospitalSpawn,
    bagCapacity: 12,
    npcHealth: 2,
    npcRespawnMs: 90_000,
    policeSearchMs: 60_000,
    meleeRange: 2.85,
    policeVisionRange: 16,
    policeFireRange: 5.5,
    cashMin: 0,
    cashMax: 999_999,
  });
});
