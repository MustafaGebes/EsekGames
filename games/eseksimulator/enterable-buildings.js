export const ENTERABLE_BUILDING_CATALOG = Object.freeze([
  { slot: '5:4:0', id: 'icecream-shop', title: 'Dondurmacı', sign: 'DONDURMACI', kind: 'icecream', architecture: 'icecream-shop', accent: 0x5594a4, awning: 0xe2ae5d },
  { slot: '6:5:0', id: 'weapons-shop', title: 'Silahçı', sign: 'SİLAHÇI', kind: 'weapons', architecture: 'armory', accent: 0x5d6b78, awning: 0x9aa58b },
  { slot: '5:6:0', id: 'cafe', title: 'Kafeci', sign: 'KAFE', kind: 'cafe', architecture: 'cafe', accent: 0x9e6042, awning: 0x84a585 },
  { slot: '4:5:0', id: 'market', title: 'Marketçi', sign: 'MARKET', kind: 'market', architecture: 'market', accent: 0x4f7d60, awning: 0xd59a4f },
  { slot: '5:6:1', id: 'grocery', title: 'Bakkal', sign: 'BAKKAL', kind: 'grocery', architecture: 'grocery', accent: 0xb07740, awning: 0x8da582 },
  { slot: '6:5:1', id: 'tool-shop', title: 'Aletçi', sign: 'ALETÇİ', kind: 'tools', architecture: 'workshop', accent: 0x567e88, awning: 0xc6a86c },
  { slot: '4:5:1', id: 'clothing-shop', title: 'Zırh & Kıyafet', sign: 'ZIRH · KIYAFET', kind: 'clothing', architecture: 'boutique', accent: 0x6b557f, awning: 0x79a9b2 },
  { slot: '4:3:3', id: 'home-one', title: 'Ev', sign: 'EV 01', kind: 'home', architecture: 'townhouse', accent: 0xa87b5d, awning: 0x766354 },
  { slot: '6:6:3', id: 'home-two', title: 'Ev', sign: 'EV 02', kind: 'home', architecture: 'courtyard-house', accent: 0x78909a, awning: 0x586e76 },
  { slot: '4:4:4', id: 'city-hospital', title: 'Şehir Hastanesi', sign: 'HASTANE', kind: 'hospital', architecture: 'hospital', accent: 0xc75048, awning: 0xe2d9c8 },
  { slot: '6:4:4', id: 'city-police-station', title: 'Polis Merkezi', sign: 'POLİS MERKEZİ', kind: 'police-station', architecture: 'police-station', accent: 0x2f4b67, awning: 0x253c54 },
  { slot: '4:6:4', id: 'city-fire-station', title: 'İtfaiye', sign: 'İTFAİYE', kind: 'fire-station', architecture: 'fire-station', accent: 0xb94434, awning: 0xe1b16b },
  { slot: '7:4:4', id: 'city-prison', title: 'Şehir Hapishanesi', sign: 'HAPİSHANE', kind: 'prison', architecture: 'prison', accent: 0x77766e, awning: 0x4c514e },
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

  function addArchitecturalSilhouette(root, building, materials, arch, front) {
    const { width, depth, h, seed = 0 } = building;
    const post = (x, y, z, height, material) => box(root, .16, height, .16, material, x, y, z);
    if (arch === 'rowhouse') {
      box(root, width*.58,.16,.88,materials.trim,0,.12,front+.58);
      for(const side of [-1,1])box(root,.22,1.22,.10,materials.trim,side*(width*.31),1.55,front+.16);
      if(seed%2===0){box(root,.72,1.35,.72,materials.trim,width*.29,h+.40,-depth*.20);box(root,.86,.15,.86,materials.wood,width*.29,h+1.14,-depth*.20);}
    } else if (arch === 'townhouse') {
      for(const side of [-1,1])post(side*Math.min(1.65,width*.22),1.48,front+.78,2.85,materials.trim);
      box(root,Math.min(4.2,width*.64),.20,1.18,materials.awning||materials.accent,0,2.98,front+.72);
      box(root,Math.min(3.0,width*.48),.14,.12,materials.cream,0,3.12,front+.72);
    } else if (arch === 'courtyard-house') {
      box(root,width*.46,.18,.22,materials.trim,0,3.28,front+.18);
      for(const side of [-1,1]){post(side*width*.24,1.47,front+.20,2.80,materials.trim);box(root,.72,.44,.60,materials.wood,side*width*.34,.23,front+.55);}
    } else if (arch === 'apartment') {
      box(root,width*.72,.38,.35,materials.accent,0,h+.34,front+.12);
      for(const side of [-1,1])box(root,.20,h*.72,.22,materials.trim,side*(width/2-.34),h*.48,front+.18);
    } else if (arch === 'corner-shop') {
      const bandWidth=Math.min(width-1.0,6.2);
      box(root,bandWidth,.22,1.08,materials.accent,0,2.76,front+.55);
      for(let i=0;i<7;i++)if(i%2===0)box(root,bandWidth/8,.20,1.10,materials.cream,-bandWidth/2+bandWidth*(i+.5)/7,2.77,front+.55);
      for(const side of [-1,1])box(root,.16,1.7,.14,materials.trim,side*Math.min(3.0,width*.36),1.52,front+.22);
    } else if (arch === 'shop' || arch === 'market' || arch === 'grocery' || arch === 'boutique' || arch === 'icecream-shop' || arch === 'armory') {
      const bandWidth=Math.min(width-1.2,5.8);
      box(root,bandWidth,.20,.94,materials.accent,0,2.72,front+.48);
      box(root,bandWidth,.16,.08,materials.cream,0,2.58,front+.97);
      for(const side of [-1,1])box(root,.12,1.45,.12,materials.wood,side*bandWidth*.42,1.78,front+.80);
    } else if (arch === 'workshop') {
      const garageWidth=Math.min(width*.66,6.2);
      box(root,garageWidth,2.25,.18,materials.metal,0,1.18,front+.20);
      for(let y=.38;y<2.2;y+=.36)box(root,garageWidth-.12,.055,.22,materials.trim,0,y,front+.32);
      for(const side of [-1,1])box(root,.65,.55,.65,materials.metal,side*width*.31,h+.28,-depth*.20);
    } else if (arch === 'school') {
      const clock=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.16,16),materials.cream);
      clock.rotation.x=Math.PI/2;clock.position.set(0,4.42,front+.27);root.add(clock);
      box(root,.07,.42,.08,materials.accent,0,4.45,front+.38);
      box(root,.42,.07,.08,materials.accent,.16,4.48,front+.38);
      post(-width*.40,1.85,front+.28,3.7,materials.trim);post(width*.40,1.85,front+.28,3.7,materials.trim);
      box(root,width*.82,.16,.22,materials.accent,0,3.70,front+.32);
    } else if (arch === 'library') {
      const porticoWidth=Math.min(width*.72,7.2);
      box(root,porticoWidth,.26,1.18,materials.trim,0,3.18,front+.68);
      for(const side of [-1,1])post(side*porticoWidth*.42,1.5,front+.82,2.85,materials.cream);
      const book=new THREE.Mesh(new THREE.BoxGeometry(.66,.52,.12),materials.accent);book.position.set(0,3.82,front+.35);root.add(book);
      box(root,.08,.40,.16,materials.cream,0,3.82,front+.43);
    } else if (arch === 'community-center') {
      const widthCap=Math.min(width*.74,7.5);
      box(root,widthCap,.32,1.35,materials.accent,0,3.20,front+.72);
      for(const side of [-1,1])post(side*widthCap*.43,1.52,front+.86,2.9,materials.trim);
      box(root,widthCap*.72,.14,.10,materials.cream,0,3.46,front+.38);
    } else if (arch === 'community-hall') {
      box(root,width*.78,.26,.68,materials.trim,0,3.06,front+.48);
      for(const side of [-1,1])post(side*width*.34,1.50,front+.70,2.8,materials.wood);
      const bell=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),materials.accent);bell.position.set(0,h+.45,0);root.add(bell);
    } else if (arch === 'police-station') {
      box(root,width*.78,.22,.28,materials.accent,0,h+.25,0);
      for(const side of [-1,1])box(root,.24,.42,.24,materials.cream,side*width*.34,h+.55,0);
    } else if (arch === 'fire-station') {
      for(const side of [-1,1]){box(root,.34,.30,.26,materials.accent,side*width*.30,3.35,front+.18);box(root,.22,.12,.18,materials.cream,side*width*.30,3.36,front+.34);}
    } else if (arch === 'prison') {
      for(const side of [-1,1]){box(root,.55,3.2,.55,materials.trim,side*(width*.42),1.6,front+.08);box(root,.76,.24,.76,materials.accent,side*(width*.42),3.30,front+.08);}
    } else if (arch === 'hospital' || arch === 'clinic' || arch === 'veterinary-clinic') {
      const signColor=materials.accent;
      box(root,Math.min(width*.42,5.8),.26,.46,materials.cream,0,4.12,front+.20);
      box(root,.20,.76,.16,signColor,0,4.12,front+.48);
      box(root,.76,.20,.16,signColor,0,4.12,front+.48);
      if(arch==='veterinary-clinic')for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.10,6,5),signColor);ear.position.set(side*.24,3.86,front+.49);root.add(ear);}
    }
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
    const arch = building.architecture || building.architecturalStyle || kind;
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

      const wardrobeX=width*.36,wardrobeZ=-depth*.36;
      box(root,.92,1.82,.66,materials.wood,wardrobeX,.91,wardrobeZ);
      box(root,.74,1.46,.04,materials.trim,wardrobeX,.91,wardrobeZ+.35);
      box(root,.06,.22,.08,materials.metal,wardrobeX+.25,.92,wardrobeZ+.39);
      addLocalCollider(building,wardrobeX,wardrobeZ,.98,.72);
      if(arch==='courtyard-house'){
        const pot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.22,.48,8),materials.trim);pot.position.set(-width*.35,.24,depth*.32);root.add(pot);
        const plant=new THREE.Mesh(new THREE.ConeGeometry(.42,.92,7),materials.productB);plant.position.set(-width*.35,.88,depth*.32);plant.castShadow=true;root.add(plant);
        addLocalCollider(building,-width*.35,depth*.32,.72,.72);
      }else{
        const shelfX=-width*.36,shelfZ=.30;
        box(root,.58,1.92,2.05,materials.wood,shelfX,.96,shelfZ);
        for(const level of [.52,1.04,1.56])box(root,.72,.09,2.05,materials.trim,shelfX+.06,level,shelfZ);
        for(let i=0;i<4;i++)box(root,.22,.28,.24,i%2?materials.productA:materials.accent,shelfX+.08,.72+(i%2)*.48,shelfZ-.68+i*.44);
        addLocalCollider(building,shelfX,shelfZ,.72,2.1);
      }
      if(arch==='apartment'){
        const stairX=width*.34,stairZ=depth*.12;
        for(let step=0;step<5;step++)box(root,1.25,.20,.72,materials.wood,stairX,step*.22+.10,stairZ-step*.48);
        box(root,.12,1.25,2.6,materials.metal,stairX+.65,.66,stairZ-.90);
        addLocalCollider(building,stairX,stairZ-.80,1.45,2.75);
      }
      return;
    }

    if (kind === 'workshop') {
      const benchZ=-depth*.28;
      box(root,Math.min(width-2,5.8),.92,1.12,materials.wood,0,.50,benchZ);
      box(root,Math.min(width-1.8,5.9),.12,1.18,materials.metal,0,1.04,benchZ);
      box(root,Math.min(width-2.2,5.6),1.55,.20,materials.rack,0,1.62,-depth*.38);
      for(let i=0;i<5;i++){const x=-2.1+i*1.05;box(root,.16,.88,.12,materials.metal,x,1.58,-depth*.37);box(root,.48,.12,.14,materials.accent,x+.12,2.08,-depth*.37);}
      addLocalCollider(building,0,benchZ,Math.min(width-1.8,6),1.2);
      addLocalCollider(building,0,-depth*.38,Math.min(width-2,5.8),.28);
      return;
    }
    if(kind==='community-center'||kind==='community-hall'){
      const tableZ=-depth*.12;
      for(const x of [-2.3,2.3]){
        box(root,2.4,.14,1.25,materials.wood,x,.82,tableZ);
        for(const side of [-1,1])box(root,.48,.12,.48,materials.fabric,x+side*1.55,.45,tableZ);
        addLocalCollider(building,x,tableZ,2.6,1.4);
        for(const side of [-1,1])addLocalCollider(building,x+side*1.55,tableZ,.54,.54);
      }
      box(root,Math.min(width-2,5.5),.94,.72,materials.counter,0,.52,-depth*.36);
      addLocalCollider(building,0,-depth*.36,Math.min(width-1.8,5.7),.82);
      return;
    }
    if(kind==='corner-shop'||kind==='shop'){
      const checkoutZ=-depth*.12;
      box(root,Math.min(width-2,4.8),.96,.82,materials.counter,0,.52,checkoutZ);
      for(const side of [-1,1])addInteriorShelves(root,building,materials,addLocalCollider,side);
      for(const x of [-1.7,0,1.7]){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.20,8,6),x===0?materials.productB:materials.productA);fruit.position.set(x,1.18,checkoutZ-.08);root.add(fruit);}
      addLocalCollider(building,0,checkoutZ,Math.min(width-1.8,5),.92);
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

    if(kind==='clinic'){
      box(root,Math.min(width-2,4.2),.92,.82,materials.counter,0,.50,counterZ);
      addLocalCollider(building,0,counterZ,Math.min(width-1.8,4.5),.94);
      box(root,1.45,.22,2.05,materials.wood,-width*.22,.18,-depth*.24);
      box(root,1.38,.16,1.82,materials.cream,-width*.22,.38,-depth*.24);
      box(root,.88,1.45,.62,materials.wood,width*.28,.74,-depth*.28);
      box(root,.96,.12,.70,materials.accent,width*.28,1.50,-depth*.28);
      addLocalCollider(building,-width*.22,-depth*.24,1.55,2.18);
      addLocalCollider(building,width*.28,-depth*.28,1.05,.78);
      return;
    }
    if(kind==='veterinary-clinic'){
      box(root,Math.min(width-2,4.2),.92,.82,materials.counter,0,.50,counterZ);
      addLocalCollider(building,0,counterZ,Math.min(width-1.8,4.5),.94);
      for(const side of [-1,1]){
        box(root,1.25,.25,1.55,materials.wood,side*width*.25,.20,-depth*.22);
        box(root,1.15,.12,1.42,materials.fabric,side*width*.25,.38,-depth*.22);
        box(root,1.25,.62,.10,materials.metal,side*width*.25,.70,-depth*.95);
        addLocalCollider(building,side*width*.25,-depth*.22,1.35,1.70);
      }
      const paw=new THREE.Mesh(new THREE.SphereGeometry(.32,8,6),materials.accent);paw.position.set(0,2.20,-depth*.40);root.add(paw);
      for(const x of [-.42,-.14,.14,.42]){const toe=new THREE.Mesh(new THREE.SphereGeometry(.12,6,5),materials.accent);toe.position.set(x,2.49,-depth*.40);root.add(toe);}
      return;
    }
    if (kind === 'hospital') {
      box(root, Math.min(width - 2.0, 4.8), 0.94, 0.82, materials.counter, 0, 0.52, counterZ);
      box(root, Math.min(width - 1.9, 4.9), 0.12, 0.94, materials.trim, 0, 1.05, counterZ);
      addLocalCollider(building, 0, counterZ, Math.min(width - 1.8, 5.0), 1.0);
      for (const x of [-Math.min(2.15,width*.25), Math.min(2.15,width*.25)]) {
        box(root, 1.52, 0.24, 2.15, materials.wood, x, 0.18, -2.25);
        box(root, 1.44, 0.16, 1.92, materials.cream, x, 0.38, -2.25);
        box(root, 1.46, 0.22, 0.46, materials.fabric, x, 0.54, -3.04);
        box(root,.68,.42,.36,materials.metal,x,1.02,-2.70);
        box(root,.52,.26,.08,materials.accent,x,1.04,-2.49);
        addLocalCollider(building, x, -2.25, 1.62, 2.3);
      }
      box(root, 0.92, 1.55, 0.68, materials.wood, width * 0.34, 0.78, 1.42);
      box(root, 1.0, 0.12, 0.74, materials.trim, width * 0.34, 1.58, 1.42);
      addLocalCollider(building, width * 0.34, 1.42, 1.05, 0.8);

      const waitZ=depth*.30;
      for(const x of [-4,0,4]){
        box(root,1.25,.14,.52,materials.fabric,x,.48,waitZ);
        box(root,1.25,.62,.14,materials.wood,x,.82,waitZ-.19);
        addLocalCollider(building,x,waitZ,1.34,.62);
      }
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

    if (kind === 'library') {
      for(const side of [-1,1])addInteriorShelves(root,building,materials,addLocalCollider,side);
      for(const x of [-2.7,0,2.7]){
        box(root,1.35,.12,2.2,materials.wood,x,.92,0);
        for(const side of [-1,1])box(root,.42,.10,.42,materials.fabric,x+side*.92,.47,0);
        addLocalCollider(building,x,0,1.85,2.25);
      }
      box(root,Math.min(width*.42,4.8),.9,.85,materials.counter,0,.48,depth*.16);
      addLocalCollider(building,0,depth*.16,Math.min(width*.44,5),.92);
      return;
    }
    if (kind === 'market-hall' || kind === 'bus-depot' || kind === 'train-station' || kind === 'sports-center') {
      for(const side of [-1,1])addInteriorShelves(root,building,materials,addLocalCollider,side);
      box(root,Math.min(width*.42,4.8),.9,.85,materials.counter,0,.48,depth*.16);
      addLocalCollider(building,0,depth*.16,Math.min(width*.44,5),.92);
      if(kind==='market-hall')for(const x of [-2.7,0,2.7]){box(root,1.6,.70,1.1,materials.wood,x,.38,-.15);addLocalCollider(building,x,-.15,1.7,1.2);}
      if(kind==='bus-depot'||kind==='train-station')for(const x of [-2.8,2.8]){box(root,1.8,.16,.58,materials.fabric,x,.48,depth*.30);box(root,1.8,.62,.14,materials.wood,x,.82,depth*.30-.2);addLocalCollider(building,x,depth*.30,1.9,.7);}
      if(kind==='sports-center')for(const x of [-2.6,2.6]){box(root,.72,1.55,.72,materials.metal,x,.78,-depth*.22);box(root,1.15,.12,1.0,materials.accent,x,1.62,-depth*.22);addLocalCollider(building,x,-depth*.22,.9,.9);}
      return;
    }

    if(kind==='market'){
      box(root,Math.min(width-2,4.3),.90,.82,materials.counter,0,.50,depth*.24);
      addLocalCollider(building,0,depth*.24,Math.min(width-1.8,4.6),.94);
      for(const side of [-1,1])for(const z of [-depth*.20,depth*.10]){
        const x=side*Math.min(2.45,width*.30);
        box(root,1.15,.66,1.10,materials.wood,x,.36,z);
        for(let i=0;i<3;i++){const produce=new THREE.Mesh(new THREE.SphereGeometry(.15,7,5),i%2?materials.productB:materials.productA);produce.position.set(x-.28+i*.28,.79,z);root.add(produce);}
        addLocalCollider(building,x,z,1.2,1.14);
      }
      return;
    }
    if(kind==='grocery'){
      for(const side of [-1,1])addInteriorShelves(root,building,materials,addLocalCollider,side);
      box(root,Math.min(width-2,3.8),.90,.80,materials.counter,0,.50,-depth*.16);
      box(root,Math.min(width-1.8,3.9),.10,.90,materials.accent,0,1.02,-depth*.16);
      for(const x of [-1.3,0,1.3])box(root,.68,.58,.68,materials.wood,x,.34,depth*.25);
      addLocalCollider(building,0,-depth*.16,Math.min(width-1.7,4.1),.96);
      for(const x of [-1.3,0,1.3])addLocalCollider(building,x,depth*.25,.72,.72);
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
      const machineX=-counterWidth*.22,machineZ=counterZ-.08;
      box(root,1.18,.78,.58,materials.freezer,machineX,1.47,machineZ);
      box(root,1.22,.12,.62,materials.metal,machineX,1.91,machineZ);
      for(const x of [-.32,.32]){
        const cup=new THREE.Mesh(new THREE.CylinderGeometry(.10,.12,.18,8),materials.cream);cup.position.set(machineX+x,2.07,machineZ);root.add(cup);
      }
      const displayX=counterWidth*.25;
      box(root,1.45,.72,.65,materials.wood,displayX,1.40,machineZ);
      box(root,1.48,.08,.68,materials.glass,displayX,1.80,machineZ);
      for(let i=0;i<3;i++){
        const pastry=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),i===1?materials.productB:materials.productA);
        pastry.position.set(displayX-.42+i*.42,1.89,machineZ);root.add(pastry);
      }
      addLocalCollider(building,displayX,machineZ,1.52,.72);
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

    const plaster = new THREE.MeshStandardMaterial({ color: building.color, roughness: 0.9, side: THREE.DoubleSide });
    const innerWall = new THREE.MeshStandardMaterial({ color: 0xd8d0bf, roughness: 0.96 });
    const arch = building.architecture || building.architecturalStyle || building.kind;
    const floor = new THREE.MeshStandardMaterial({ color: ['home','rowhouse','townhouse','apartment','courtyard-house'].includes(building.kind) ? 0x8e775e : (['hospital','police-station','fire-station','prison'].includes(building.kind) ? 0xd5d1c5 : 0x8f8b7b), roughness: 0.96 });
    const trim = new THREE.MeshStandardMaterial({ color: building.trim || 0x544a3d, roughness: 0.8 });
    const awning = new THREE.MeshStandardMaterial({ color: building.awning, roughness: 0.82 });
    const glass = new THREE.MeshStandardMaterial({ color: ['hospital','clinic','veterinary-clinic'].includes(building.kind) ? 0x82b7c5 : 0x6b9da2, emissive: 0x12292a, metalness: 0.12, roughness: 0.24, transparent: true, opacity: 0.54, depthWrite: false, side: THREE.DoubleSide });
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

    const displayWindowWidth = Math.max(1.15, leftWidth - 0.46);
    if (building.alleyDetail) {
      building.sconceMaterials = [];
      const planter = new THREE.MeshStandardMaterial({ color: 0x785b45, roughness: 0.9 });
      const foliage = new THREE.MeshStandardMaterial({ color: 0x68845d, roughness: 0.96 });
      for (const side of [-1, 1]) {
        const windowX = side * (doorWidth / 2 + leftWidth / 2);
        box(root, displayWindowWidth + 0.20, 1.40, 0.11, trim, windowX, 1.48, front + 0.09);
        box(root, displayWindowWidth, 1.18, 0.10, glass, windowX, 1.48, front + 0.17);
        box(root, 0.075, 1.08, 0.08, jamb, windowX, 1.48, front + 0.24);
        box(root, displayWindowWidth + 0.24, 0.14, 0.28, trim, windowX, 0.80, front + 0.24);
        box(root, Math.min(1.7, displayWindowWidth * 0.7), 0.15, 0.30, planter, windowX, 0.88, front + 0.29);
        for (let i = -1; i <= 1; i += 1) {
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.25, 5), foliage);
          leaf.position.set(windowX + i * 0.34, 1.01, front + 0.30);
          root.add(leaf);
          const flower = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 4), i % 2 ? materials.productA : materials.cream);
          flower.position.set(windowX + i * 0.34 + 0.10, 1.06, front + 0.36);
          root.add(flower);
        }
      }
      for (const side of [-1, 1]) {
        const x = side * (doorWidth / 2 + 0.34);
        box(root, 0.25, 0.36, 0.16, trim, x, 2.24, front + 0.18);
        const lantern = new THREE.MeshStandardMaterial({ color: 0xffd69a, emissive: 0xffad45, emissiveIntensity: 0.04, roughness: 0.34 });
        box(root, 0.13, 0.22, 0.13, lantern, x, 2.24, front + 0.29);
        building.sconceMaterials.push(lantern);
      }
      box(root, building.width + 0.18, 0.16, 0.24, trim, 0, building.h - 0.25, front + 0.05);
    } else {
      for (const side of [-1, 1]) box(root, displayWindowWidth, 1.18, 0.09, glass, side * (doorWidth / 2 + leftWidth / 2), 1.48, front + 0.13);
    }
    if (building.kind === 'prison') {
      const barMaterial = new THREE.MeshStandardMaterial({color:0x303633,metalness:.45,roughness:.5});
      for(const side of [-1,1])for(let bar=-3;bar<=3;bar++)box(root,.055,1.18,.08,barMaterial,side*(doorWidth/2+leftWidth/2)+bar*.20,1.48,front+.19);
    }
    const awningWidth=Math.min(building.width-1.4,4.2);
    const hasShopAwning=['cafe','icecream','weapons','market','grocery','tools','clothing','shop'].includes(building.kind)
      || ['cafe','market','grocery','boutique','icecream-shop','armory','corner-shop','shop'].includes(arch);
    if(hasShopAwning){
      box(root, awningWidth, 0.25, 0.92, awning, 0, 2.55, front + 0.49);
      if(building.alleyDetail){
        const stripeCount=8,stripeWidth=awningWidth/stripeCount,valanceZ=front+.97;
        box(root,awningWidth,.16,.08,awning,0,2.39,valanceZ);
        for(let stripe=0;stripe<stripeCount;stripe+=2)box(root,stripeWidth*.62,.15,.035,materials.fabric,-awningWidth/2+stripeWidth*(stripe+.5),2.39,valanceZ+.05);
      }
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(building.width - 1.2, 5.8), 0.58), signMaterial(building.sign, building.accent));
    sign.position.set(0, 2.92, front + 0.22); root.add(sign);
    addArchitecturalSilhouette(root,building,materials,arch,front);

    if(arch==='cafe'){
      const stripeCount=8,stripeWidth=awningWidth/stripeCount;
      for(let i=0;i<stripeCount;i++)if(i%2===0)box(root,stripeWidth*.72,.23,.90,materials.cream,-awningWidth/2+stripeWidth*(i+.5),2.56,front+.50);
      box(root,awningWidth,.15,.09,awning,0,2.38,front+.96);
      for(let i=0;i<stripeCount;i+=2)box(root,stripeWidth*.62,.14,.04,materials.cream,-awningWidth/2+stripeWidth*(i+.5),2.38,front+1.01);
      for(const side of [-1,1])box(root,.10,1.02,.10,materials.wood,side*Math.min(1.9,awningWidth*.42),1.82,front+.84);
      const menu=new THREE.Mesh(new THREE.PlaneGeometry(1.42,.52),signMaterial('KAHVE & TATLI',building.accent));
      menu.position.set(building.width*.37,2.75,front+.24);root.add(menu);
    }
    if(building.kind==='home'){
      box(root,Math.min(3.8,building.width*.55),.18,1.32,trim,0,.12,front+.78);
      box(root,Math.min(3.35,building.width*.48),.18,.96,awning,0,2.72,front+.70);
      for(const side of [-1,1])box(root,.12,2.35,.12,materials.wood,side*Math.min(1.45,building.width*.20),1.18,front+1.02);
      if(arch==='courtyard-house'){
        const pot=new THREE.Mesh(new THREE.CylinderGeometry(.25,.20,.40,8),trim);pot.position.set(-building.width*.34,.20,front+.48);root.add(pot);
        const foliage=new THREE.Mesh(new THREE.ConeGeometry(.38,.88,7),new THREE.MeshStandardMaterial({color:0x6b8b62,roughness:.94}));foliage.position.set(-building.width*.34,.78,front+.48);foliage.castShadow=true;root.add(foliage);
      }else{
        const chimney=new THREE.Group();chimney.position.set(building.width*.28,building.h+.25,-building.depth*.18);root.add(chimney);
        box(chimney,.72,1.55,.72,materials.trim,0,.42,0);
        box(chimney,.88,.16,.88,materials.wood,0,1.22,0);
      }
    }
    if(building.kind==='hospital'){
      box(root,Math.min(8,building.width-2),.28,1.16,materials.cream,0,3.42,front+.62);
      box(root,Math.min(7.5,building.width-2.4),.14,1.22,materials.accent,0,3.62,front+.62);
      for(const side of [-1,1])box(root,.24,2.7,.24,materials.trim,side*Math.min(3.3,building.width*.22),1.35,front+.96);
    }

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

    const upperStart = wallHeight - 0.035;
    const upperHeight = Math.max(0, building.h - upperStart);
    if (upperHeight > 0.5) {
      const y = upperStart + upperHeight / 2;
      const upperDepth = 0.24;
      box(root, building.width + 0.06, upperHeight, upperDepth, plaster, 0, y, -front + upperDepth / 2);
      box(root, building.width + 0.06, upperHeight, upperDepth, plaster, 0, y, front - upperDepth / 2);
      box(root, upperDepth, upperHeight, building.depth, plaster, -building.width / 2 + upperDepth / 2, y, 0);
      box(root, upperDepth, upperHeight, building.depth, plaster, building.width / 2 - upperDepth / 2, y, 0);
      for (const winY of [wallHeight + 1.0, wallHeight + 3.9, wallHeight + 6.8]) {
        if (winY + 1.3 >= building.h) continue;
        for (const winX of [-2.25, 0, 2.25]) {
          const windowMat = new THREE.MeshStandardMaterial({ color: ['hospital','clinic'].includes(building.kind) ? 0x83b5c0 : 0x45616b, emissive: 0x1b2c2b, roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide });
          box(root, 1.12, 1.35, 0.045, windowMat, winX, winY, front + 0.025);
        }
      }
      box(root, building.width + 0.32, 0.20, building.depth + 0.32, trim, 0, building.h + 0.03, 0);
    }
    const roofMaterial = new THREE.MeshStandardMaterial({ color: building.trim || 0x665e52, roughness: .86 });
    const retailKinds = ['cafe','icecream','weapons','market','grocery','clothing','shop'];
    if (['rowhouse','townhouse','home','courtyard-house'].includes(arch) || ['home','rowhouse','townhouse','courtyard-house'].includes(building.kind)) {
      building.roofProfile = arch === 'courtyard-house' ? 'courtyard-hip' : arch + '-gable';
      const span = Math.min(building.width * .64, building.depth * 1.14);
      for (const side of [-1,1]) { const plane=box(root,span,.34,building.depth+.62,roofMaterial,side*span*.23,building.h+.58,0); plane.rotation.z=side*-.46; }
      if(arch==='courtyard-house') box(root,building.width*.42,.30,building.depth*.34,materials.accent,0,building.h+.38,0);
    } else if (arch === 'apartment' || building.kind === 'apartment') {
      building.roofProfile='apartment-setback';
      box(root,building.width*.58,1.25,building.depth*.56,plaster,0,building.h+.58,-building.depth*.06);
      box(root,building.width*.64,.18,building.depth*.62,roofMaterial,0,building.h+1.30,-building.depth*.06);
      const tank=new THREE.Mesh(new THREE.CylinderGeometry(.62,.68,1.4,10),materials.metal);tank.position.set(building.width*.23,building.h+2.05,-building.depth*.20);root.add(tank);
    } else if (retailKinds.includes(building.kind) || ['cafe','market','grocery','boutique','icecream-shop','armory','corner-shop','shop'].includes(arch)) {
      building.roofProfile=arch+'-commercial-parapet';
      box(root,building.width+.24,.55,.32,materials.accent,0,building.h+.20,building.depth*.30);
      box(root,building.width+.18,.20,building.depth+.22,roofMaterial,0,building.h+.54,0);
      for(const side of [-1,1])box(root,.18,.72,building.depth+.16,materials.accent,side*(building.width/2),building.h+.28,0);
    } else if (['hospital','clinic','veterinary-clinic'].includes(arch) || ['hospital','clinic','veterinary-clinic'].includes(building.kind)) {
      building.roofProfile=arch==='veterinary-clinic'?'veterinary-clinic-pavilion':arch==='clinic'?'clinic-stepped':'hospital-stepped';
      for(const side of [-1,1]){box(root,building.width*.26,1.15,building.depth*.68,plaster,side*building.width*.31,building.h+.52,-building.depth*.04);box(root,building.width*.29,.18,building.depth*.72,roofMaterial,side*building.width*.31,building.h+1.18,-building.depth*.04);}
      box(root,building.width*.34,2.0,building.depth*.38,materials.cream,0,building.h+1.0,-building.depth*.08);
      box(root,.34,1.1,.20,materials.accent,0,building.h+1.15,building.depth*.12);box(root,1.1,.34,.20,materials.accent,0,building.h+1.15,building.depth*.12);
    } else if (arch==='school') {
      building.roofProfile='school-clock-tower';
      box(root,building.width*.68,.52,building.depth*.75,roofMaterial,0,building.h+.24,0);
      box(root,building.width*.20,1.65,building.depth*.22,materials.accent,0,building.h+1.10,-building.depth*.16);
      const clock=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.16,16),materials.cream);clock.rotation.x=Math.PI/2;clock.position.set(0,building.h+1.26,building.depth*.02);root.add(clock);
      const peak=new THREE.Mesh(new THREE.ConeGeometry(1,1.1,4),roofMaterial);peak.position.set(0,building.h+2.05,-building.depth*.16);peak.scale.set(building.width*.13,1,building.depth*.13);root.add(peak);
    } else if (arch==='library') {
      building.roofProfile='library-gable';
      box(root,building.width*.82,.25,building.depth*.82,roofMaterial,0,building.h+.16,0);
      for(const side of [-1,1]){const plane=box(root,building.width*.46,.30,building.depth*.88,roofMaterial,side*building.width*.22,building.h+.64,0);plane.rotation.z=side*-.42;}
      box(root,building.width*.68,.24,.34,materials.accent,0,building.h+.30,building.depth*.34);
    } else if (arch==='workshop'||building.kind==='tools') {
      building.roofProfile='workshop-sawtooth';
      for(let i=-1;i<=1;i++){box(root,building.width*.28,.42,building.depth*.94,roofMaterial,i*building.width*.30,building.h+.32,0);box(root,building.width*.10,.75,building.depth*.94,materials.metal,i*building.width*.30+building.width*.14,building.h+.48,0);}
    } else if (arch==='fire-station') {
      building.roofProfile='fire-station-bays';box(root,building.width*.74,.30,building.depth*.78,roofMaterial,0,building.h+.16,0);
      for(const side of [-1,1])box(root,building.width*.22,1.35,building.depth*.76,materials.accent,side*building.width*.28,building.h+.68,building.depth*.02);
    } else if (arch==='police-station') {
      building.roofProfile='police-station-tower';box(root,building.width*.72,.34,building.depth*.76,roofMaterial,0,building.h+.18,0);
      box(root,building.width*.18,2.25,building.depth*.20,materials.accent,building.width*.30,building.h+1.30,-building.depth*.28);
      box(root,building.width*.23,.22,building.depth*.25,materials.cream,building.width*.30,building.h+2.48,-building.depth*.28);
    } else if (arch==='prison') {
      building.roofProfile='prison-watchtowers';box(root,building.width*.82,.40,building.depth*.84,roofMaterial,0,building.h+.20,0);
      for(const side of [-1,1]){box(root,building.width*.14,2,building.depth*.16,materials.trim,side*building.width*.34,building.h+1.08,building.depth*.28);const cap=new THREE.Mesh(new THREE.ConeGeometry(1,1,4),materials.accent);cap.position.set(side*building.width*.34,building.h+2.58,building.depth*.28);cap.scale.set(building.width*.10,1,building.depth*.10);root.add(cap);}
    } else if (arch==='community-center'||arch==='community-hall') {
      building.roofProfile=arch==='community-center'?'community-center-pavilion':'community-hall-bell';
      box(root,building.width*.82,.38,building.depth*.80,roofMaterial,0,building.h+.20,0);
      box(root,building.width*.34,1.45,building.depth*.25,materials.accent,0,building.h+.86,-building.depth*.28);
      if(arch==='community-hall'){const bell=new THREE.Mesh(new THREE.SphereGeometry(.38,8,6),materials.cream);bell.position.set(0,building.h+1.80,-building.depth*.28);root.add(bell);}
    } else {
      building.roofProfile=arch+'-flat-roof';box(root,building.width+.18,.24,building.depth+.18,roofMaterial,0,building.h+.08,0);
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
    building.insidePoint = () => worldPoint(building, 0, 0);
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
        building.roof.position.y = wallHeight + 0.02 + (inside ? 3.25 : 0);
      }
    }
  }
  function clampCamera(building, desired) {
    const local = localPoint(building, desired.x, desired.z);
    const padding = Math.min(0.75, Math.max(0.35, Math.min(building.width, building.depth) * 0.08));
    const x = clamp(local.x, -building.width / 2 + padding, building.width / 2 - padding);
    const z = clamp(local.z, -building.depth / 2 + padding, building.depth / 2 - padding);
    return { ...worldPoint(building, x, z), y: clamp(desired.y, 0.82, wallHeight - 0.38) };
  }

  return { buildings, setDoorOpen, getInside, getNearbyDoor, clampCamera, update, byId };
}
