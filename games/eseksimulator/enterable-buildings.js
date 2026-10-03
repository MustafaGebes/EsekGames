export const ENTERABLE_BUILDING_CATALOG = Object.freeze([
  { slot: '1:2:0', id: 'icecream-shop', title: 'Dondurmacı', sign: 'DONDURMACI', kind: 'icecream', accent: 0x79b9c7, awning: 0xd87867 },
  { slot: '1:2:1', id: 'weapons-shop', title: 'Silahçı', sign: 'SİLAHÇI', kind: 'weapons', accent: 0x8c7657, awning: 0x5d574b },
  { slot: '1:2:2', id: 'cafe', title: 'Kafeci', sign: 'KAFE', kind: 'cafe', accent: 0xc99a62, awning: 0x647b68 },
  { slot: '1:2:3', id: 'market', title: 'Marketçi', sign: 'MARKET', kind: 'market', accent: 0x75a67a, awning: 0x6c9c72 },
  { slot: '2:1:0', id: 'grocery', title: 'Bakkal', sign: 'BAKKAL', kind: 'grocery', accent: 0xd3a75c, awning: 0x9d724d },
  { slot: '2:1:1', id: 'tool-shop', title: 'Aletçi', sign: 'ALETÇİ', kind: 'tools', accent: 0x8397a1, awning: 0x596872 },
  { slot: '2:3:2', id: 'clothing-shop', title: 'Zırh & Kıyafet', sign: 'ZIRH · KIYAFET', kind: 'clothing', accent: 0xa386b6, awning: 0x78618b },
  { slot: '1:1:3', id: 'home-one', title: 'Ev', sign: 'EV 01', kind: 'home', accent: 0xa87b5d, awning: 0x766354 },
  { slot: '3:3:0', id: 'home-two', title: 'Ev', sign: 'EV 02', kind: 'home', accent: 0x78909a, awning: 0x586e76 },
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
    const shelfDepth = Math.min(0.52, building.depth * 0.08);
    const shelfWidth = Math.min(3.6, building.depth - 2.5);
    const z = -0.15;
    box(root, 0.14, 1.8, shelfWidth, materials.wood, x, 1.05, z);
    for (const level of [0.55, 1.15, 1.75]) {
      box(root, 0.5, 0.10, shelfWidth, materials.trim, x - side * 0.16, level, z);
    }
    for (let i = 0; i < 5; i += 1) {
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

    if (kind === 'home') {
      const bedWidth = Math.min(2.15, width * 0.30);
      box(root, bedWidth, 0.34, 2.15, materials.wood, -1.45, 0.25, -1.25);
      box(root, bedWidth - 0.1, 0.16, 1.9, materials.fabric, -1.45, 0.49, -1.25);
      box(root, bedWidth - 0.25, 0.20, 0.45, materials.cream, -1.45, 0.65, -1.93);
      box(root, 2.2, 0.55, 0.86, materials.fabric, 1.45, 0.45, -1.4);
      box(root, 1.35, 0.78, 0.82, materials.wood, 0.75, 0.48, 1.05);
      box(root, 1.8, 0.08, 1.0, materials.trim, 0.75, 0.91, 1.05);
      box(root, 1.55, 0.8, 0.42, materials.wood, 2.75, 0.45, -2.15);
      addLocalCollider(building, -1.45, -1.25, bedWidth + 0.15, 2.3);
      addLocalCollider(building, 1.45, -1.4, 2.35, 1.0);
      addLocalCollider(building, 0.75, 1.05, 1.5, 1.0);
      addLocalCollider(building, 2.75, -2.15, 1.7, 0.55);
      return;
    }

    const displayWidth = kind === 'cafe' ? 1.0 : 0.62;
    box(root, counterWidth, 0.94, displayWidth, materials.counter, 0, 0.52, counterZ);
    box(root, counterWidth + 0.08, 0.12, displayWidth + 0.12, materials.trim, 0, 1.05, counterZ);
    addLocalCollider(building, 0, counterZ, counterWidth + 0.16, displayWidth + 0.18);

    if (kind === 'cafe') {
      for (const [x, z] of [[-2.25, -1.55], [2.25, -1.55], [-2.25, 1.45], [2.25, 1.45]]) {
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.12, 12), materials.trim);
        table.position.set(x, 0.9, z);
        table.castShadow = true;
        root.add(table);
        box(root, 0.12, 0.85, 0.12, materials.wood, x, 0.44, z);
        for (const side of [-1, 1]) {
          box(root, 0.45, 0.12, 0.45, materials.fabric, x + side * 0.86, 0.47, z);
          box(root, 0.12, 0.62, 0.12, materials.wood, x + side * 0.86, 0.78, z - 0.16);
        }
      }
      return;
    }

    if (kind === 'icecream') {
      const freezerX = -counterWidth * 0.28;
      box(root, 1.0, 0.68, 0.56, materials.freezer, freezerX, 1.42, counterZ - 0.04);
      for (let i = 0; i < 4; i += 1) {
        const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), [materials.productA, materials.productB, materials.cream, materials.accent][i]);
        scoop.position.set(-1.15 + i * 0.72, 1.24, -depth * 0.34);
        root.add(scoop);
      }
      box(root, 1.7, 1.45, 0.45, materials.wood, width * 0.31, 0.86, -depth * 0.34);
      addLocalCollider(building, width * 0.31, -depth * 0.34, 1.8, 0.55);
      return;
    }

    if (kind === 'weapons') {
      box(root, width - 2.2, 1.78, 0.25, materials.rack, 0, 1.20, -depth * 0.34);
      for (let i = 0; i < 5; i += 1) {
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
      for (let i = 0; i < 6; i += 1) {
        const x = -2.65 + i * 1.05;
        box(root, 0.12, 0.84, 0.13, materials.metal, x, 1.45, -depth * 0.31);
        box(root, 0.43, 0.12, 0.14, materials.accent, x + 0.1, 1.91, -depth * 0.31);
      }
      addLocalCollider(building, 0, -depth * 0.35, width - 2.2, 0.45);
      return;
    }

    if (kind === 'clothing') {
      box(root, width - 2.2, 0.12, 0.18, materials.metal, 0, 2.1, -depth * 0.35);
      for (let i = 0; i < 5; i += 1) {
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
      for (let i = 0; i < 3; i += 1) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 7), color);
        fruit.position.set(x - 0.35 + i * 0.35, 0.85, z);
        root.add(fruit);
      }
      addLocalCollider(building, x, z, 1.5, 1.05);
    }
  }

  for (const spec of specs) {
    const building = {
      ...spec,
      width: spec.w,
      depth: spec.d,
      open: false,
      progress: 0,
      collider: null,
      roof: null,
      door: null,
    };
    buildings.push(building);
    byId.set(building.id, building);

    const root = new THREE.Group();
    root.position.set(building.x, 0, building.z);
    root.rotation.y = building.face;
    scene.add(root);
    building.root = root;

    const plaster = new THREE.MeshStandardMaterial({ color: building.color, roughness: 0.9 });
    const innerWall = new THREE.MeshStandardMaterial({ color: 0xd8d0bf, roughness: 0.96 });
    const floor = new THREE.MeshStandardMaterial({ color: building.kind === 'home' ? 0x8e775e : 0x8f8b7b, roughness: 0.96 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x544a3d, roughness: 0.8 });
    const awning = new THREE.MeshStandardMaterial({ color: building.awning, roughness: 0.82 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x6b9da2, emissive: 0x12292a, metalness: 0.12, roughness: 0.24, transparent: true, opacity: 0.54, depthWrite: false });
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

    const jamb = new THREE.MeshStandardMaterial({ color: 0x6f5138, roughness: 0.76 });
    for (const side of [-1, 1]) {
      box(root, 0.13, doorHeight, 0.20, jamb, side * doorWidth / 2, doorHeight / 2, front + 0.02);
    }
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

    for (const side of [-1, 1]) {
      const display = box(root, Math.max(1.15, leftWidth - 0.46), 1.18, 0.09, glass, side * (doorWidth / 2 + leftWidth / 2), 1.48, front + 0.13);
      display.material = glass;
    }
    box(root, Math.min(building.width - 1.4, 4.2), 0.25, 0.92, awning, 0, 2.55, front + 0.49);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(building.width - 1.2, 4.5), 0.58), signMaterial(building.sign, building.accent));
    sign.position.set(0, 2.92, front + 0.22);
    root.add(sign);

    for (const x of [-building.width / 2 + 0.16, building.width / 2 - 0.16]) {
      box(root, 0.12, wallHeight, 0.32, trim, x, wallHeight / 2, front - 0.02);
    }
    building.roof = box(root, building.width + 0.28, 0.20, building.depth + 0.28, trim, 0, wallHeight + 0.02, 0);

    const upperHeight = Math.max(0, building.h - wallHeight - 0.20);
    if (upperHeight > 0.5) {
      const y = wallHeight + 0.20 + upperHeight / 2;
      const upperDepth = 0.24;
      box(root, building.width + 0.06, upperHeight, upperDepth, plaster, 0, y, front - upperDepth / 2);
      box(root, building.width + 0.06, upperHeight, upperDepth, plaster, 0, y, -front + upperDepth / 2);
      box(root, upperDepth, upperHeight, building.depth, plaster, -building.width / 2 + upperDepth / 2, y, 0);
      box(root, upperDepth, upperHeight, building.depth, plaster, building.width / 2 - upperDepth / 2, y, 0);
      for (const winY of [wallHeight + 1.0, wallHeight + 3.9, wallHeight + 6.8]) {
        if (winY + 1.3 >= building.h) continue;
        for (const winX of [-2.25, 0, 2.25]) {
          const windowMat = new THREE.MeshStandardMaterial({ color: 0x45616b, emissive: 0x1b2c2b, roughness: 0.35, metalness: 0.1 });
          box(root, 1.12, 1.35, 0.045, windowMat, winX, winY, front + 0.025);
        }
      }
      box(root, building.width + 0.32, 0.20, building.depth + 0.32, trim, 0, building.h + 0.03, 0);
    }

    if (building.kind === 'icecream') {
      for (let i = 0; i < 3; i += 1) {
        const stripe = box(root, 0.95, 0.16, 0.10, [materials.productA, materials.cream, materials.accent][i], -1.05 + i * 1.05, 2.36, front + 0.12);
        stripe.material.emissive = new THREE.Color(building.accent);
        stripe.material.emissiveIntensity = 0.12;
      }
    }

    addFurniture(root, building, materials, addLocalCollider);
    building.localPoint = (x, z) => localPoint(building, x, z);
    building.worldPoint = (x, z) => worldPoint(building, x, z);
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
    if (active && index < 0) collisionRects.push(building.collider);
    if (!active && index >= 0) collisionRects.splice(index, 1);
  }

  function setDoorOpen(id, open) {
    const building = byId.get(id);
    if (!building) return false;
    building.open = !!open;
    return true;
  }

  function getInside(position) {
    return buildings.find((building) => building.contains(position)) || null;
  }

  function getNearbyDoor(position) {
    const inside = getInside(position);
    if (inside && inside.doorDistance(position) <= 4.0) return inside;
    let nearest = null;
    let nearestDistance = 2.65;
    for (const building of buildings) {
      const distance = building.doorDistance(position);
      if (distance < nearestDistance) {
        nearest = building;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function update(dt, playerPosition) {
    const inside = getInside(playerPosition);
    for (const building of buildings) {
      const target = building.open ? 1 : 0;
      const amount = Math.min(1, Math.max(0, dt) * 4.5);
      building.progress += (target - building.progress) * amount;
      if (Math.abs(target - building.progress) < 0.003) building.progress = target;
      building.door.rotation.y = building.progress * 1.30;
      setDoorCollider(building, building.progress < 0.74);
      building.roof.visible = building !== inside;
    }
  }

  function clampCamera(building, cameraTarget) {
    if (!building) return cameraTarget;
    const local = localPoint(building, cameraTarget.x, cameraTarget.z);
    local.x = clamp(local.x, -building.width / 2 + 0.76, building.width / 2 - 0.76);
    local.z = clamp(local.z, -building.depth / 2 + 0.76, building.depth / 2 - 0.76);
    const world = worldPoint(building, local.x, local.z);
    return new THREE.Vector3(world.x, clamp(cameraTarget.y, 1.2, wallHeight - 0.34), world.z);
  }

  return {
    buildings,
    setDoorOpen,
    setDoorStates(states = []) {
      for (const building of buildings) setDoorOpen(building.id, false);
      for (const item of states) {
        if (item && typeof item.buildingId === 'string' && typeof item.open === 'boolean') setDoorOpen(item.buildingId, item.open);
      }
    },
    getDoor(id) { return byId.get(id) || null; },
    getInside,
    getNearbyDoor,
    update,
    clampCamera,
  };
}
