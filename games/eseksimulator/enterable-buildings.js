export const ENTERABLE_BUILDING_CATALOG = Object.freeze([
  { slot: '4:5:0', id: 'icecream-shop', title: 'Dondurmacı', sign: 'DONDURMACI', kind: 'icecream', architecture: 'icecream-shop', accent: 0x79b9c7, awning: 0xd87867 },
  { slot: '4:5:1', id: 'weapons-shop', title: 'Silahçı', sign: 'SİLAHÇI', kind: 'weapons', architecture: 'armory', accent: 0x8c7657, awning: 0x5d574b },
  { slot: '4:5:2', id: 'cafe', title: 'Kafeci', sign: 'KAFE', kind: 'cafe', architecture: 'cafe', accent: 0xc99a62, awning: 0x647b68 },
  { slot: '4:5:3', id: 'market', title: 'Marketçi', sign: 'MARKET', kind: 'market', architecture: 'market', accent: 0x75a67a, awning: 0x6c9c72 },
  { slot: '5:4:0', id: 'grocery', title: 'Bakkal', sign: 'BAKKAL', kind: 'grocery', architecture: 'grocery', accent: 0xd3a75c, awning: 0x9d724d },
  { slot: '5:4:1', id: 'tool-shop', title: 'Aletçi', sign: 'ALETÇİ', kind: 'tools', architecture: 'workshop', accent: 0x8397a1, awning: 0x596872 },
  { slot: '5:6:2', id: 'clothing-shop', title: 'Zırh & Kıyafet', sign: 'ZIRH · KIYAFET', kind: 'clothing', architecture: 'boutique', accent: 0xa386b6, awning: 0x78618b },
  { slot: '4:4:3', id: 'home-one', title: 'Ev', sign: 'EV 01', kind: 'home', architecture: 'townhouse', accent: 0xa87b5d, awning: 0x766354 },
  { slot: '6:6:0', id: 'home-two', title: 'Ev', sign: 'EV 02', kind: 'home', architecture: 'courtyard-house', accent: 0x78909a, awning: 0x586e76 },
  { slot: '4:4:0', id: 'city-hospital', title: 'Şehir Hastanesi', sign: 'HASTANE', kind: 'hospital', architecture: 'hospital', accent: 0xc75048, awning: 0xe2d9c8 },
  { slot: '7:2:4', id: 'city-police-station', title: 'Polis Merkezi', sign: 'POLİS MERKEZİ', kind: 'police-station', architecture: 'police-station', accent: 0x2f4b67, awning: 0x253c54 },
  { slot: '6:3:4', id: 'city-fire-station', title: 'İtfaiye', sign: 'İTFAİYE', kind: 'fire-station', architecture: 'fire-station', accent: 0xb94434, awning: 0xe1b16b },
  { slot: '8:2:4', id: 'city-prison', title: 'Şehir Hapishanesi', sign: 'HAPİSHANE', kind: 'prison', architecture: 'prison', accent: 0x77766e, awning: 0x4c514e },
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createEnterableBuildings(THREE, scene, specs, collisionRects) {
  const doorWidth = 1.55;
  const doorHeight = 2.38;
  const wallHeight = 3.25;
  const wallThickness = 0.28;
  const buildings = [];
  const byId = new Map();

  function worldPoint(building, localX, localZ) {
    const cosine = Math.cos(building.face);
    const sine = Math.sin(building.face);
    return {
      x: building.x + cosine * localX + sine * localZ,
      z: building.z - sine * localX + cosine * localZ,
    };
  }

  function localPoint(building, x, z) {
    const dx = x - building.x;
    const dz = z - building.z;
    const cosine = Math.cos(building.face);
    const sine = Math.sin(building.face);
    return {
      x: cosine * dx - sine * dz,
      z: sine * dx + cosine * dz,
    };
  }

  function makeCollider(building, localX, localZ, width, depth) {
    const center = worldPoint(building, localX, localZ);
    const cosine = Math.abs(Math.cos(building.face));
    const sine = Math.abs(Math.sin(building.face));
    const halfX = (cosine * width + sine * depth) / 2;
    const halfZ = (sine * width + cosine * depth) / 2;
    const collider = {
      minX: center.x - halfX,
      maxX: center.x + halfX,
      minZ: center.z - halfZ,
      maxZ: center.z + halfZ,
      active: true,
    };
    collisionRects.push(collider);
    return collider;
  }

  function box(parent, width, height, depth, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function signMaterial(text, accent) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 160;
    const context = canvas.getContext('2d');
    context.fillStyle = '#17201b';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `#${accent.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, 15, canvas.height);
    context.strokeStyle = 'rgba(255,245,220,.72)';
    context.lineWidth = 7;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    const fontSize = Math.min(68, Math.max(34, 450 / Math.max(text.length * 0.64, 1)));
    context.font = `900 ${fontSize}px system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff4dc';
    context.fillText(text, canvas.width / 2 + 7, canvas.height / 2 + 2, 570);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  }

  function addInteriorShelves(root, building, materials, addLocalCollider, side) {
    const x = side * (building.width / 2 - 0.62);
    const shelfWidth = Math.min(3.6, building.depth - 2.5);
    const z = -0.15;
    box(root, 0.14, 1.8, shelfWidth, materials.wood, x, 1.05, z);
    for (const level of [0.55, 1.15, 1.75]) box(root, 0.5, 0.10, shelfWidth, materials.trim, x - side * 0.16, level, z);
    for (let i = 0; i < 5; i++) {
      const itemZ = z - shelfWidth * 0.38 + i * (shelfWidth * 0.19);
      const colors = [materials.accent, materials.productA, materials.productB];
      box(root, 0.24, 0.30 + (i % 2) * 0.10, 0.28, colors[i % colors.length], x - side * 0.21, 0.78, itemZ);
      box(root, 0.24, 0.30, 0.28, colors[(i + 1) % colors.length], x - side * 0.21, 1.38, itemZ);
    }
    addLocalCollider(building, x, z, 0.65, shelfWidth + 0.2);
  }

  function addFurniture(root, building, materials, addLocalCollider) {
    const { kind, width, depth } = building;
    const counterWidth = Math.min(width - 2.0, 5.5);
    const counterZ = -depth * 0.16;

    if (['home', 'rowhouse', 'townhouse', 'apartment', 'courtyard-house'].includes(kind)) {
      const bedWidth = Math.min(2.15, width * 0.30);
      box(root, bedWidth, 0.34, 2.15, materials.wood, -width * .24, 0.25, -depth * .24);
      box(root, bedWidth - 0.1, 0.16, 1.9, materials.fabric, -width * .24, 0.49, -depth * .24);
      box(root, Math.min(2.35, width * .32), .55, .86, materials.fabric, width * .22, .45, -depth * .20);
      box(root, 1.25, .72, .82, materials.wood, width * .2, .42, depth * .22);
      box(root, 1.4, .08, .96, materials.trim, width * .2, .80, depth * .22);
      for (const [x,z,w,d] of [[-width*.24,-depth*.24,bedWidth+.15,2.3],[width*.22,-depth*.20,2.5,1.0],[width*.2,depth*.22,1.5,1.0]]) addLocalCollider(building,x,z,w,d);
      return;
    }

    if (kind === 'police-station') {
      box(root, Math.min(width - 2.4, 5.0), 1.12, 1.08, materials.counter, 0, .60, depth*.10);
      box(root, Math.min(width - 2.2, 5.15), .12, 1.18, materials.accent, 0, 1.20, depth*.10);
      addLocalCollider(building,0,depth*.10,Math.min(width-2.1,5.3),1.25);
      box(root, Math.min(width*.52,6.2), 1.42, .52, materials.trim, 0, .75, -depth*.31);
      for (const side of [-1,1]) {
        const x=side*Math.min(width*.31,4.2);
        box(root, 1.75, 1.8, 2.2, materials.metal, x, .94, -depth*.03);
        for(let bar=-2;bar<=2;bar++)box(root,.055,1.75,.06,materials.accent,x+bar*.28,1.0,-depth*.03+1.11);
        addLocalCollider(building,x,-depth*.03,1.86,2.28);
      }
      box(root,1.65,.9,.45,materials.wood,-width*.30,.53,-depth*.36);
      addLocalCollider(building,-width*.30,-depth*.36,1.75,.55);
      return;
    }

    if (kind === 'fire-station') {
      box(root, Math.min(width-2.0,4.8), .95, 1.0, materials.counter, 0,.52,-depth*.34);
      addLocalCollider(building,0,-depth*.34,Math.min(width-1.8,5.0),1.05);
      for(const side of [-1,1]){
        box(root,.7,2.2,1.5,materials.accent,side*width*.29,.95,-depth*.20);
        box(root,.5,.12,1.6,materials.trim,side*width*.29,2.02,-depth*.20);
        addLocalCollider(building,side*width*.29,-depth*.20,.78,1.62);
      }
      box(root,2.2,.25,.8,materials.wood,0,.32,depth*.24);
      addLocalCollider(building,0,depth*.24,2.25,.85);
      return;
    }

    if (kind === 'prison') {
      box(root, Math.min(width-2,4.6), 1.04, .94, materials.counter, 0,.56,depth*.20);
      addLocalCollider(building,0,depth*.20,Math.min(width-1.8,4.8),1.0);
      for(const side of [-1,1]){
        const x=side*Math.min(width*.31,4.2),z=-depth*.16;
        box(root,1.85,2.4,2.8,materials.trim,x,1.22,z);
        box(root,1.52,.18,2.28,materials.wood,x,.30,z);
        box(root,1.5,.18,2.24,materials.fabric,x,.48,z);
        for(let bar=-4;bar<=4;bar++)box(root,.055,2.25,.07,materials.metal,x+bar*.18,1.24,z+1.42);
        box(root,1.44,1.15,1.5,materials.metal,x, .62,z-1.7);
        addLocalCollider(building,x,z,1.95,2.9);
      }
      for(const x of [-.58,-.20,.20,.58])box(root,.06,2.25,.07,materials.metal,x,1.22,depth*.34);
      return;
    }

    if (kind === 'hospital' || kind === 'clinic' || kind === 'veterinary-clinic') {
      box(root, Math.min(width - 2.0, 4.8), 0.94, 0.82, materials.counter, 0, 0.52, counterZ);
      box(root, Math.min(width - 1.9, 4.9), 0.12, 0.94, materials.trim, 0, 1.05, counterZ);
      addLocalCollider(building, 0, counterZ, Math.min(width - 1.8, 5.0), 1.0);
      for (const x of [-Math.min(2.15,width*.25), Math.min(2.15,width*.25)]) {
        box(root, 1.52, 0.24, 2.15, materials.wood, x, 0.18, -2.25);
        box(root, 1.44, 0.16, 1.92, materials.cream, x, 0.38, -2.25);
        box(root, 1.46, 0.22, 0.46, materials.fabric, x, 0.54, -3.04);
        addLocalCollider(building, x, -2.25, 1.62, 2.3);
      }
      box(root, 0.92, 1.55, 0.68, materials.wood, width * 0.34, 0.78, 1.42);
      box(root, 1.0, 0.12, 0.74, materials.trim, width * 0.34, 1.58, 1.42);
      addLocalCollider(building, width * 0.34, 1.42, 1.05, 0.8);
      return;
    }

    if (kind === 'school') {
      box(root, Math.min(width-2,6.2),.94,1.05,materials.wood,0,.52,-depth*.30);
      addLocalCollider(building,0,-depth*.30,Math.min(width-1.8,6.3),1.1);
      for(const x of [-3,-1.2,1.2,3])if(Math.abs(x)<width/2-1.2){box(root,.72,.68,.72,materials.wood,x,.38,0);addLocalCollider(building,x,0,.78,.78);}
      box(root,Math.min(width*.6,7),1.3,.16,materials.trim,0,1.2,-depth*.43);
      addLocalCollider(building,0,-depth*.43,Math.min(width*.6,7),.24);
      return;
    }

    if (kind === 'library' || kind === 'market-hall' || kind === 'bus-depot' || kind === 'train-station' || kind === 'sports-center') {
      for(const side of [-1,1])addInteriorShelves(root,building,materials,addLocalCollider,side);
      box(root,Math.min(width*.42,4.8),.9,.85,materials.counter,0,.48,depth*.16);
      addLocalCollider(building,0,depth*.16,Math.min(width*.44,5),.92);
      return;
    }

    if (kind === 'gas-station') {
      box(root,Math.min(width-2,4.8),.9,.82,materials.counter,0,.48,-depth*.23);
      addLocalCollider(building,0,-depth*.23,Math.min(width-1.8,5),.9);
      for(const side of [-1,1])box(root,.55,1.35,.55,materials.accent,side*width*.28,.68,depth*.22);
      return;
    }

    const displayWidth = kind === 'cafe' ? 1.0 : 0.62;
    box(root, counterWidth, 0.94, displayWidth, materials.counter, 0, 0.52, counterZ);
    box(root, counterWidth + 0.08, 0.12, displayWidth + 0.12, materials.trim, 0, 1.05, counterZ);
    addLocalCollider(building, 0, counterZ, counterWidth + 0.16, displayWidth + 0.18);

    if (kind === 'cafe') {
      for (const [x, z] of [[-2.25, -1.55], [2.25, -1.55], [-2.25, 1.45], [2.25, 1.45]]) {
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.12, 12), materials.trim);
        table.position.set(x, 0.9, z); table.castShadow = true; root.add(table);
        box(root, 0.12, 0.85, 0.12, materials.wood, x, 0.44, z);
        addLocalCollider(building,x,z,.7,.7);
        for (const side of [-1, 1]) {
          box(root, 0.45, 0.12, 0.45, materials.fabric, x + side * 0.86, 0.47, z);
          box(root, 0.12, 0.62, 0.12, materials.wood, x + side * 0.86, 0.78, z - 0.16);
          addLocalCollider(building,x+side*.86,z,.48,.48);
        }
      }
      return;
    }

    if (kind === 'icecream') {
      const freezerX = -counterWidth * 0.28;
      box(root, 1.0, 0.68, 0.56, materials.freezer, freezerX, 1.42, counterZ - 0.04);
      for (let i = 0; i < 4; i++) {
        const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), [materials.productA, materials.productB, materials.cream, materials.accent][i]);
        scoop.position.set(-1.15 + i * 0.72, 1.24, -depth * 0.34); root.add(scoop);
      }
      box(root, 1.7, 1.45, 0.45, materials.wood, width * 0.31, 0.86, -depth * 0.34);
      addLocalCollider(building, width * 0.31, -depth * 0.34, 1.8, 0.55);
      return;
    }

    if (kind === 'weapons') {
      box(root, width - 2.2, 1.78, 0.25, materials.rack, 0, 1.20, -depth * 0.34);
      for (let i = 0; i < 5; i++) {
        const x = -2.55 + i * 1.25;
        box(root, 0.16, 0.62, 0.16, materials.metal, x, 1.55, -depth * 0.32);
        box(root, 0.72, 0.15, 0.14, materials.metal, x + 0.30, 1.83, -depth * 0.32);
        box(root, 0.34, 0.23, 0.18, materials.accent, x + 0.07, 1.48, -depth * 0.32);
      }
      addLocalCollider(building, 0, -depth * 0.34, width - 2.0, 0.48);
      return;
    }

    if (kind === 'tools') {
      box(root, width - 2.4, 1.75, 0.22, materials.rack, 0, 1.2, -depth * 0.35);
      for (let i = 0; i < 6; i++) {
        const x = -2.65 + i * 1.05;
        box(root, 0.12, 0.84, 0.13, materials.metal, x, 1.45, -depth * 0.31);
        box(root, 0.43, 0.12, 0.14, materials.accent, x + 0.1, 1.91, -depth * 0.31);
      }
      addLocalCollider(building, 0, -depth * 0.35, width - 2.2, 0.45);
      return;
    }

    if (kind === 'clothing') {
      box(root, width - 2.2, 0.12, 0.18, materials.metal, 0, 2.1, -depth * 0.35);
      for (let i = 0; i < 5; i++) {
        const x = -2.6 + i * 1.3;
        box(root, 0.54, 0.72, 0.12, [materials.accent, materials.productA, materials.productB, materials.fabric, materials.cream][i], x, 1.54, -depth * 0.35);
        box(root, 0.07, 0.32, 0.07, materials.wood, x, 2.0, -depth * 0.35);
      }
      addLocalCollider(building, 0, -depth * 0.35, width - 2.2, 0.35);
      return;
    }

    addInteriorShelves(root, building, materials, addLocalCollider, -1);
    addInteriorShelves(root, building, materials, addLocalCollider, 1);
    for (const [x, z, color] of [[-2.2, 0.9, materials.productA], [0, 0.9, materials.productB], [2.2, 0.9, materials.accent]]) {
      box(root, 1.45, 0.65, 1.0, materials.wood, x, 0.38, z);
      for (let i = 0; i < 3; i++) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 7), color);
        fruit.position.set(x - 0.35 + i * 0.35, 0.85, z); root.add(fruit);
      }
      addLocalCollider(building, x, z, 1.5, 1.05);
    }
  }

  for (const spec of specs) {
    const building = { ...spec, width: spec.w, depth: spec.d, open: false, progress: 0, collider: null, roof: null, door: null };
    buildings.push(building);
    byId.set(building.id, building);

    const root = new THREE.Group();
    root.position.set(building.x, 0, building.z);
    root.rotation.y = building.face;
    scene.add(root);
    building.root = root;

    const plaster = new THREE.MeshStandardMaterial({ color: building.color, roughness: 0.9 });
    const innerWall = new THREE.MeshStandardMaterial({ color: 0xd8d0bf, roughness: 0.96 });
    const arch = building.architecture || building.architecturalStyle || building.kind;
    const floor = new THREE.MeshStandardMaterial({ color: ['home','rowhouse','townhouse','apartment','courtyard-house'].includes(building.kind) ? 0x8e775e : (['hospital','police-station','fire-station','prison'].includes(building.kind) ? 0xd5d1c5 : 0x8f8b7b), roughness: 0.96 });
    const trim = new THREE.MeshStandardMaterial({ color: building.trim || 0x544a3d, roughness: 0.8 });
    const awning = new THREE.MeshStandardMaterial({ color: building.awning, roughness: 0.82 });
    const glass = new THREE.MeshStandardMaterial({ color: ['hospital','clinic','veterinary-clinic'].includes(building.kind) ? 0x82b7c5 : 0x6b9da2, emissive: 0x12292a, metalness: 0.12, roughness: 0.24, transparent: true, opacity: 0.54, depthWrite: false });
    const wood = new THREE.MeshStandardMaterial({ color: 0x704d35, roughness: 0.84 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x566064, metalness: 0.48, roughness: 0.44 });
    const rack = new THREE.MeshStandardMaterial({ color: 0x433c34, roughness: 0.86 });
    const counter = new THREE.MeshStandardMaterial({ color: 0x6e503d, roughness: 0.76 });
    const accent = new THREE.MeshStandardMaterial({ color: building.accent, roughness: 0.7, emissive: building.accent, emissiveIntensity: 0.05 });
    const productA = new THREE.MeshStandardMaterial({ color: 0xd47d58, roughness: 0.64 });
    const productB = new THREE.MeshStandardMaterial({ color: 0x86a85c, roughness: 0.62 });
    const cream = new THREE.MeshStandardMaterial({ color: 0xf0dfb9, roughness: 0.82 });
    const freezer = new THREE.MeshStandardMaterial({ color: 0x47717b, roughness: 0.5, metalness: 0.16 });
    const fabric = new THREE.MeshStandardMaterial({ color: building.accent, roughness: 0.92 });
    const materials = { plaster, innerWall, floor, trim, wood, metal, rack, counter, accent, productA, productB, cream, freezer, fabric };

    const front = building.depth / 2;
    const leftWidth = (building.width - doorWidth) / 2;
    box(root, building.width, 0.18, building.depth, floor, 0, -0.09, 0);
    box(root, wallThickness, wallHeight, building.depth, plaster, -building.width / 2 + wallThickness / 2, wallHeight / 2, 0);
    box(root, wallThickness, wallHeight, building.depth, plaster, building.width / 2 - wallThickness / 2, wallHeight / 2, 0);
    box(root, building.width, wallHeight, wallThickness, plaster, 0, wallHeight / 2, -front + wallThickness / 2);
    box(root, leftWidth, wallHeight, wallThickness, plaster, -doorWidth / 2 - leftWidth / 2, wallHeight / 2, front - wallThickness / 2);
    box(root, leftWidth, wallHeight, wallThickness, plaster, doorWidth / 2 + leftWidth / 2, wallHeight / 2, front - wallThickness / 2);
    box(root, doorWidth, wallHeight - doorHeight, wallThickness, plaster, 0, doorHeight + (wallHeight - doorHeight) / 2, front - wallThickness / 2);

    const localColliders = [];
    const addLocalCollider = (target, localX, localZ, width, depth) => {
      const collider = makeCollider(target, localX, localZ, width, depth);
      localColliders.push(collider);
      return collider;
    };
    addLocalCollider(building, -building.width / 2 + wallThickness / 2, 0, wallThickness, building.depth);
    addLocalCollider(building, building.width / 2 - wallThickness / 2, 0, wallThickness, building.depth);
    addLocalCollider(building, 0, -front + wallThickness / 2, building.width, wallThickness);
    addLocalCollider(building, -doorWidth / 2 - leftWidth / 2, front - wallThickness / 2, leftWidth, wallThickness);
    addLocalCollider(building, doorWidth / 2 + leftWidth / 2, front - wallThickness / 2, leftWidth, wallThickness);

    const jamb = new THREE.MeshStandardMaterial({ color: ['police-station','fire-station','hospital','prison'].includes(building.kind) ? building.accent : 0x6f5138, roughness: 0.76 });
    for (const side of [-1, 1]) box(root, 0.13, doorHeight, 0.20, jamb, side * doorWidth / 2, doorHeight / 2, front + 0.02);
    box(root, doorWidth + 0.18, 0.16, 0.20, trim, 0, doorHeight + 0.02, front + 0.02);

    const leaf = new THREE.Group();
    leaf.position.set(-doorWidth / 2 + 0.08, 0, front + 0.08);
    root.add(leaf);
    box(leaf, doorWidth - 0.10, doorHeight - 0.08, 0.10, jamb, (doorWidth - 0.10) / 2, doorHeight / 2, 0);
    box(leaf, 0.08, 0.20, 0.09, materials.accent, doorWidth - 0.31, 1.1, 0.06);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), materials.trim);
    knob.position.set(doorWidth - 0.20, 1.1, 0.11);
    leaf.add(knob);
    building.door = leaf;
    building.collider = addLocalCollider(building, 0, front + 0.08, doorWidth - 0.04, 0.24);
    building.colliders = localColliders;

    for (const side of [-1, 1]) box(root, Math.max(1.15, leftWidth - 0.46), 1.18, 0.09, glass, side * (doorWidth / 2 + leftWidth / 2), 1.48, front + 0.13);
    if (building.kind === 'prison') {
      const barMaterial = new THREE.MeshStandardMaterial({color:0x303633,metalness:.45,roughness:.5});
      for(const side of [-1,1])for(let bar=-3;bar<=3;bar++)box(root,.055,1.18,.08,barMaterial,side*(doorWidth/2+leftWidth/2)+bar*.20,1.48,front+.19);
    }
    box(root, Math.min(building.width - 1.4, 4.2), 0.25, 0.92, awning, 0, 2.55, front + 0.49);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(building.width - 1.2, 5.8), 0.58), signMaterial(building.sign, building.accent));
    sign.position.set(0, 2.92, front + 0.22); root.add(sign);

    if (building.kind === 'hospital' || building.kind === 'clinic' || building.kind === 'veterinary-clinic') {
      const crossRed = new THREE.MeshStandardMaterial({ color: 0xc75048, emissive: 0x37110e, roughness: 0.55 });
      box(root, 0.24, 0.78, 0.12, crossRed, 0, 3.55, front + 0.18);
      box(root, 0.78, 0.24, 0.12, crossRed, 0, 3.55, front + 0.18);
      box(root,Math.min(building.width*.7,8),.22,1.15,materials.trim,-building.width*.14,.14,-front-1.3);
      for(let i=-2;i<=2;i++)box(root,.08,.16,.08,crossRed,i*.45,2.45,front+.55);
    }
    if (building.kind === 'police-station') {
      const badge=new THREE.Mesh(new THREE.CylinderGeometry(.63,.72,.15,6),new THREE.MeshStandardMaterial({color:0xd8bd75,metalness:.36,roughness:.45}));
      badge.position.set(0,3.70,front+.28);badge.rotation.y=Math.PI/6;root.add(badge);
      const badgeCore=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.17,8),new THREE.MeshStandardMaterial({color:0x27415b,roughness:.48}));badgeCore.position.set(0,3.70,front+.37);badgeCore.rotation.x=Math.PI/2;root.add(badgeCore);
      for(const side of [-1,1]){box(root,.38,.10,.32,materials.accent,side*.62,3.72,front+.33);}
    }
    if (building.kind === 'fire-station') {
      for(const side of [-1,1]){
        const x=side*(building.width*.27);
        box(root,Math.min(3.6,building.width*.23),2.55,.19,materials.trim,x,1.27,front+.05);
        box(root,Math.min(3.2,building.width*.21),2.18,.08,glass,x,1.21,front+.17);
        for(let y=.48;y<2.15;y+=.32)box(root,Math.min(3.15,building.width*.20),.055,.11,materials.trim,x,y,front+.22);
      }
      box(root,building.width*.76,.32,.12,materials.accent,0,4.05,front+.16);
      box(root,.15,.78,.15,materials.accent,building.width*.31,building.h+.42,-building.depth*.24);
      box(root,.62,.12,.48,materials.trim,building.width*.31,building.h+.82,-building.depth*.24);
    }
    if (building.kind === 'prison') {
      const wire=new THREE.MeshStandardMaterial({color:0x999b91,metalness:.48,roughness:.48});
      box(root,building.width*.88,.18,.22,materials.trim,0,4.10,front+.17);
      for(const side of [-1,1])for(let i=0;i<5;i++)box(root,.10,.20,.10,wire,side*(building.width*.25+i*.3),4.32,front+.18);
      const tower=new THREE.Group();tower.position.set(building.width*.31,0,-building.depth*.32);root.add(tower);
      box(tower,2.1,4.4,2.1,materials.trim,0,2.2,0);
      for(const side of [-1,1])box(tower,2.3,.18,.20,materials.accent,0,4.45,side*.98);
      const lookout=new THREE.Mesh(new THREE.ConeGeometry(1.5,1.2,4),materials.trim);lookout.position.y=5.05;tower.add(lookout);
      addLocalCollider(building,building.width*.31,-building.depth*.32,2.15,2.15);
    }

    for (const x of [-building.width / 2 + 0.16, building.width / 2 - 0.16]) box(root, 0.12, wallHeight, 0.32, trim, x, wallHeight / 2, front - 0.02);
    building.roof = box(root, building.width + 0.28, 0.20, building.depth + 0.28, trim, 0, wallHeight + 0.02, 0);

    const upperHeight = Math.max(0, building.h - wallHeight - 0.20);
    if (upperHeight > 0.5) {
      const y = wallHeight + 0.20 + upperHeight / 2;
      const upperDepth = 0.24;
      box(root, building.width + 0.06, upperHeight, upperDepth, plaster, 0, y, -front + upperDepth / 2);
      box(root, building.width + 0.06, upperHeight, upperDepth, plaster, 0, y, front - upperDepth / 2);
      box(root, upperDepth, upperHeight, building.depth, plaster, -building.width / 2 + upperDepth / 2, y, 0);
      box(root, upperDepth, upperHeight, building.depth, plaster, building.width / 2 - upperDepth / 2, y, 0);
      for (const winY of [wallHeight + 1.0, wallHeight + 3.9, wallHeight + 6.8]) {
        if (winY + 1.3 >= building.h) continue;
        for (const winX of [-2.25, 0, 2.25]) {
          const windowMat = new THREE.MeshStandardMaterial({ color: ['hospital','clinic'].includes(building.kind) ? 0x83b5c0 : 0x45616b, emissive: 0x1b2c2b, roughness: 0.35, metalness: 0.1 });
          box(root, 1.12, 1.35, 0.045, windowMat, winX, winY, front + 0.025);
        }
      }
      box(root, building.width + 0.32, 0.20, building.depth + 0.32, trim, 0, building.h + 0.03, 0);
    }
    if (['townhouse','courtyard-house','rowhouse','home','corner-shop','market','grocery','boutique','icecream-shop','cafe'].includes(arch)) {
      const roofMaterial = new THREE.MeshStandardMaterial({color:building.trim||0x665e52,roughness:.86});
      const roofShape=new THREE.Mesh(new THREE.ConeGeometry(1,1,4),roofMaterial);roofShape.rotation.y=Math.PI/4;roofShape.position.set(0,building.h+.55,0);roofShape.scale.set(Math.min(building.width,building.depth)*.60,1.1,Math.min(building.width,building.depth)*.60);roofShape.castShadow=true;root.add(roofShape);
    }
    if (building.kind === 'apartment' || arch === 'apartment') {
      const floors=Math.min(3,Math.max(1,Math.floor((building.h-1)/3.05)));
      for(let level=0;level<floors;level++){
        const y=3.1+level*3.05;if(y>building.h-1)continue;
        box(root,Math.min(2.55,building.width*.34),.15,.80,trim,0,y,front+.40);
        for(const side of [-1,1])box(root,.09,.6,.10,materials.metal,side*Math.min(1.18,building.width*.16),y+.34,front+.78);
      }
      const tank=new THREE.Mesh(new THREE.CylinderGeometry(.48,.52,1.2,10),materials.metal);tank.position.set(building.width*.26,building.h+.75,-building.depth*.18);root.add(tank);
    }
    if (building.kind === 'school' || building.kind === 'library' || building.kind === 'market-hall' || building.kind === 'train-station') {
      for(const x of [-building.width*.32,building.width*.32])box(root,.35,3.2,.48,materials.accent,x,1.6,front+.22);
    }

    addFurniture(root, building, materials, addLocalCollider);
    building.localPoint = (x, z) => localPoint(building, x, z);
    building.worldPoint = (x, z) => worldPoint(building, x, z);
    building.shopkeeperPoint = () => worldPoint(building, 0, -building.depth * 0.34);
    building.contains = (position) => {
      const local = localPoint(building, position.x, position.z);
      return Math.abs(local.x) < building.width / 2 - wallThickness - 0.42
        && local.z > -building.depth / 2 + wallThickness + 0.38
        && local.z < front - wallThickness - 0.38;
    };
    building.insidePoint = () => worldPoint(building, 0, front - 1.22);
    building.outsidePoint = () => worldPoint(building, 0, front + 1.12);
    building.doorDistance = (position) => {
      const doorPoint = worldPoint(building, 0, front + 0.10);
      return Math.hypot(position.x - doorPoint.x, position.z - doorPoint.z);
    };
  }

  function setDoorCollider(building, active) {
    const index = collisionRects.indexOf(building.collider);
    building.collider.active = !!active;
    if (active && index < 0) collisionRects.push(building.collider);
    if (!active && index >= 0) collisionRects.splice(index, 1);
  }
  function setDoorOpen(id, open) {
    const building = byId.get(id);
    if (!building) return false;
    building.open = !!open;
    setDoorCollider(building, !building.open);
    return true;
  }
  function getInside(position) { return buildings.find((building) => building.contains(position)) || null; }
  function getNearbyDoor(position) {
    const inside = getInside(position);
    if (inside && inside.doorDistance(position) <= 4.0) return inside;
    let nearest = null;
    let distance = 5.0;
    for (const building of buildings) {
      const next = building.doorDistance(position);
      if (next < distance) { distance = next; nearest = building; }
    }
    return nearest;
  }
  function update(dt, playerPosition) {
    for (const building of buildings) {
      const target = building.open ? 1 : 0;
      building.progress = clamp(building.progress + (target - building.progress) * Math.min(1, dt * 9), 0, 1);
      building.door.rotation.y = -building.progress * Math.PI / 2;
      building.colliderActive = !building.open;
      if (building.roof) {
        const inside = building.contains(playerPosition);
        const targetRoof = inside ? 0 : 1;
        building.roof.material.transparent = inside || building.progress > 0.02;
        building.roof.material.opacity = inside ? 0.12 : 1;
        building.roof.position.y = building.h + 0.02 + (inside ? 3.2 : 0);
      }
    }
  }
  function clampCamera(building, desired) {
    const local = localPoint(building, desired.x, desired.z);
    const x = clamp(local.x, -building.width / 2 + 0.35, building.width / 2 - 0.35);
    const z = clamp(local.z, -building.depth / 2 + 0.35, building.depth / 2 - 0.35);
    return worldPoint(building, x, z);
  }

  return { buildings, setDoorOpen, getInside, getNearbyDoor, clampCamera, update, byId };
}
