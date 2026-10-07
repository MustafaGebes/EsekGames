import * as THREE from 'three';

const ROOMS = [
  { name: 'YILDIZ KÖPRÜSÜ', x: 0, z: -7, w: 11, d: 4.2, color: 0x40536a },
  { name: 'POYRAZ HANGARI', x: -8, z: -5, w: 6.5, d: 5.5, color: 0x315564 },
  { name: 'KOZMİK AHIR', x: 8, z: -4, w: 6.5, d: 5.5, color: 0x674859 },
  { name: 'NEBULA SERASI', x: -8, z: 1.5, w: 6.5, d: 5.5, color: 0x315d51 },
  { name: 'AHENK REAKTÖRÜ', x: 0, z: 4.2, w: 7.5, d: 5.2, color: 0x65513d },
  { name: 'YÖRÜNGE DEPOSU', x: 8, z: 1, w: 6.5, d: 5.5, color: 0x4c4e70 },
  { name: 'YÖRÜNGE KUBBESİ', x: 8, z: 7.1, w: 6.5, d: 3.8, color: 0x355768 },
  { name: 'REVİR', x: -8, z: 7, w: 6.5, d: 3.8, color: 0x52614d }
];
const STATIONS = [
  { id: 'magnetic_lock', x: -8, z: -5 }, { id: 'hay_container', x: 8, z: -3 },
  { id: 'clover_filter', x: -8, z: 2 }, { id: 'relay_calibration', x: 0, z: 5 },
  { id: 'star_chart', x: 8, z: 8 }, { id: 'radar_tune', x: 8, z: 3 }
];
const colorMaterial = (color, roughness = 0.62, metalness = 0.22) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') { ctx.roundRect(x, y, width, height, radius); return; }
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y); ctx.lineTo(x + width - r, y); ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r); ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function labelSprite(text, color = '#d9e9e9', background = 'rgba(8,18,25,.78)') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = background; drawRoundedRect(ctx, 4, 4, 504, 88, 28); ctx.fill();
  ctx.font = '800 34px Manrope, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(text, 256, 50, 480);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(4.2, 0.79, 1); return sprite;
}

function makeDonkey(color, ghost = false) {
  const group = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color, roughness: 0.78, transparent: ghost, opacity: ghost ? 0.52 : 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x34272a, roughness: 0.8, transparent: ghost, opacity: ghost ? 0.52 : 1 });
  const muzzle = new THREE.MeshStandardMaterial({ color: 0xe7c5ad, roughness: 0.84, transparent: ghost, opacity: ghost ? 0.6 : 1 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.4 });
  const add = (geometry, material, position, scale = [1, 1, 1], parent = group) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.scale.set(...scale); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  add(new THREE.SphereGeometry(0.49, 22, 16), coat, [0, 0.78, 0], [1, 0.82, 1.42]);
  add(new THREE.SphereGeometry(0.34, 18, 14), coat, [0, 1.38, -0.64], [0.92, 1.05, 0.88]);
  add(new THREE.SphereGeometry(0.25, 18, 14), muzzle, [0, 1.12, -1.16], [0.86, 0.54, 0.55]);
  for (const side of [-1, 1]) {
    const ear = add(new THREE.CapsuleGeometry(0.105, 0.68, 5, 12), coat, [side * 0.21, 2.1, -0.61], [0.8, 1, 0.7]); ear.rotation.z = side * -0.12;
    add(new THREE.CapsuleGeometry(0.046, 0.48, 4, 8), dark, [side * 0.21, 2.1, -0.645], [0.85, 1, 0.65]);
    add(new THREE.SphereGeometry(0.052, 12, 10), eye, [side * 0.235, 1.48, -1.01], [1, 1, 0.65]);
    const leg = add(new THREE.CylinderGeometry(0.11, 0.13, 0.62, 10), coat, [side * 0.25, 0.34, side * 0.25], [1, 1, 1]);
    add(new THREE.BoxGeometry(0.27, 0.14, 0.32), dark, [side * 0.25, 0.065, side * 0.25 - 0.02], [1, 1, 1]);
    leg.userData.legSwing = side;
  }
  const tail = add(new THREE.CylinderGeometry(0.035, 0.055, 0.63, 8), coat, [0, 0.88, 0.78], [1, 1, 1]); tail.rotation.x = -0.75;
  add(new THREE.SphereGeometry(0.11, 10, 8), dark, [0, 0.6, 1.02], [0.7, 1.4, 0.7]);
  const saddle = add(new THREE.BoxGeometry(0.56, 0.16, 0.68), new THREE.MeshStandardMaterial({ color: 0x121d25, metalness: 0.6, roughness: 0.35 }), [0, 1.22, -0.03]);
  saddle.rotation.x = -0.08;
  return group;
}

export class ShipScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x070d13); this.scene.fog = new THREE.Fog(0x070d13, 27, 68);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100); this.camera.position.set(0, 28, 24); this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.22;
    this.renderer.setClearColor(0x071018);
    this.scene.add(new THREE.HemisphereLight(0x9fd2df, 0x17191c, 2.0));
    const key = new THREE.DirectionalLight(0xf9ead2, 3.2); key.position.set(-7, 18, 10); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); this.scene.add(key);
    const cool = new THREE.PointLight(0x56b8bd, 34, 36); cool.position.set(8, 8, -4); this.scene.add(cool);
    const warm = new THREE.PointLight(0xe9564e, 17, 30); warm.position.set(-8, 6, 2); this.scene.add(warm);
    this.players = new Map(); this.menuDonkeys = []; this.stationMeshes = new Map(); this.menuMode = true; this.elapsed = 0; this.lastRender = 0;
    this.buildEnvironment(); this.createStars(); this.createMenuDonkeys(); this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas.parentElement || canvas); this.resize(); this.animate = this.animate.bind(this); requestAnimationFrame(this.animate);
  }
  buildEnvironment() {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(26, 0.65, 20), colorMaterial(0x263039, 0.32, 0.7)); hull.position.y = -0.47; hull.receiveShadow = true; hull.castShadow = true; this.scene.add(hull);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(24.8, 0.25, 18.8), colorMaterial(0x17232b, 0.62, 0.45)); floor.position.y = -0.1; floor.receiveShadow = true; this.scene.add(floor);
    const grid = new THREE.GridHelper(24, 24, 0x527079, 0x26353b); grid.position.y = 0.04; grid.material.transparent = true; grid.material.opacity = 0.18; this.scene.add(grid);
    const corridor = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.12, 18.4), colorMaterial(0x27343a, 0.48, 0.48)); corridor.position.set(0, 0.05, 0); this.scene.add(corridor);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(24.3, 0.12, 3.2), colorMaterial(0x253239, 0.48, 0.48)); cross.position.set(0, 0.05, 0); this.scene.add(cross);
    const edgeMat = colorMaterial(0x587078, 0.32, 0.7);
    for (const room of ROOMS) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(room.w, 0.13, room.d), colorMaterial(room.color, 0.7, 0.22)); deck.position.set(room.x, 0.07, room.z); deck.receiveShadow = true; this.scene.add(deck);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(room.w + 0.2, 0.11, room.d + 0.2), edgeMat); trim.position.set(room.x, 0.0, room.z); this.scene.add(trim); this.scene.remove(deck); this.scene.add(deck);
      const label = labelSprite(room.name); label.position.set(room.x, 1.4, room.z - room.d / 2 + 0.46); this.scene.add(label);
      this.addRoomProps(room);
    }
    for (const station of STATIONS) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.75, 0.42, 16), colorMaterial(0x394b52, 0.35, 0.75)); base.position.set(station.x, 0.38, station.z); base.castShadow = true; this.scene.add(base);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.55, 0.32), new THREE.MeshStandardMaterial({ color: 0x327c78, emissive: 0x134b4c, emissiveIntensity: 1.5, metalness: 0.5, roughness: 0.3 })); panel.position.set(station.x, 0.84, station.z - 0.25); panel.rotation.x = -0.18; this.scene.add(panel);
      const light = new THREE.PointLight(0x4de1b0, 3, 2.8); light.position.set(station.x, 1.35, station.z); this.scene.add(light);
      const marker = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.035, 8, 30), new THREE.MeshBasicMaterial({ color: 0x61ddaf, transparent: true, opacity: 0.8 })); marker.rotation.x = Math.PI / 2; marker.position.set(station.x, 0.2, station.z); this.scene.add(marker);
      this.stationMeshes.set(station.id, { marker, panel });
    }
    const rail = colorMaterial(0x607680, 0.3, 0.8);
    for (let x = -11; x <= 11; x += 2) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), rail); post.position.set(x, 0.7, -9.3); this.scene.add(post); }
    for (const x of [-12.2, 12.2]) { const edge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 18.4), rail); edge.position.set(x, 0.22, 0); this.scene.add(edge); }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 10), new THREE.MeshBasicMaterial({ color: 0xf2504d })); beacon.position.set(0, 2.2, -7.25); this.scene.add(beacon);
    this.beacon = beacon;
  }
  addRoomProps(room) {
    const color = room.color;
    for (const side of [-1, 1]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, room.w * 0.56, 9), colorMaterial(0x607178, 0.38, 0.76)); pipe.rotation.z = Math.PI / 2; pipe.position.set(room.x, 0.5, room.z + side * room.d * 0.36); this.scene.add(pipe);
    }
    const crateMat = colorMaterial(color, 0.72, 0.2);
    const amount = room.name.includes('AHIR') ? 4 : room.name.includes('SERASI') ? 2 : 1;
    for (let i = 0; i < amount; i += 1) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.62, 0.62), crateMat); crate.position.set(room.x + (i - amount / 2) * 1.1, 0.45, room.z + room.d * 0.26); crate.castShadow = true; this.scene.add(crate);
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.66), colorMaterial(0xc7a858, 0.38, 0.64)); band.position.set(crate.position.x, 0.57, crate.position.z); this.scene.add(band);
    }
    const glow = new THREE.Mesh(new THREE.BoxGeometry(room.w * 0.78, 0.045, 0.045), new THREE.MeshBasicMaterial({ color: 0x94c6bc })); glow.position.set(room.x, 0.18, room.z + room.d / 2 - 0.14); this.scene.add(glow);
  }
  createStars() {
    const positions = new Float32Array(420 * 3); for (let i = 0; i < 420; i += 1) { positions[i * 3] = (Math.random() - 0.5) * 100; positions[i * 3 + 1] = Math.random() * 40 + 8; positions[i * 3 + 2] = (Math.random() - 0.5) * 100; }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc6dfdc, size: 0.08, transparent: true, opacity: 0.78 })); this.scene.add(stars);
  }
  createMenuDonkeys() {
    const shades = [0xa8d749, 0xec4b79, 0x36b9b3, 0x924ce1, 0xe75d39, 0xd8be48];
    shades.forEach((color, i) => { const donkey = makeDonkey(color); donkey.scale.setScalar(0.64 + (i % 2) * 0.12); donkey.position.set(-10 + i * 4, 3.2 + Math.sin(i) * 0.7, -1 + (i % 3) * 4); donkey.rotation.y = Math.PI + (i % 2 ? 0.35 : -0.25); this.scene.add(donkey); this.menuDonkeys.push({ group: donkey, baseX: donkey.position.x, phase: i * 1.3, baseY: donkey.position.y }); });
  }
  resize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect(); const width = Math.max(1, rect.width); const height = Math.max(1, rect.height);
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height; this.camera.fov = width < 700 ? 49 : 42; this.camera.updateProjectionMatrix();
  }
  setMode(mode) { this.menuMode = mode !== 'game'; for (const item of this.menuDonkeys) item.group.visible = this.menuMode; }
  updateRoom(room, playerId) {
    const liveIds = new Set();
    for (const player of room?.players || []) {
      liveIds.add(player.id); let actor = this.players.get(player.id);
      if (!actor) { const donkey = makeDonkey(player.color || 0x55bb92, !player.alive); const tag = labelSprite(player.name, player.redName ? '#ff8585' : '#e8f2ec', player.redName ? 'rgba(96,14,21,.94)' : 'rgba(6,16,22,.85)'); donkey.add(tag); tag.position.set(0, 3.05, 0); donkey.position.set(player.x, 0, player.z); this.scene.add(donkey); actor = { group: donkey, target: new THREE.Vector3(player.x, 0, player.z), tag, isSelf: player.id === playerId }; this.players.set(player.id, actor); }
      actor.target.set(player.x, 0, player.z); actor.isSelf = player.id === playerId; actor.group.visible = true;
      if (actor.group.userData.alive !== player.alive) { actor.group.userData.alive = player.alive; actor.group.traverse((node) => { if (node.isMesh && node.material && 'opacity' in node.material && node.geometry.type !== 'SphereGeometry') node.material.opacity = player.alive ? 1 : 0.44; }); }
      if (actor.tag.userData.text !== player.name || actor.tag.userData.red !== player.redName) {
        actor.tag.material.map.dispose(); const replacement = labelSprite(player.name, player.redName ? '#ff8585' : '#e8f2ec', player.redName ? 'rgba(96,14,21,.94)' : 'rgba(6,16,22,.85)'); actor.tag.material.map = replacement.material.map; actor.tag.userData.text = player.name; actor.tag.userData.red = player.redName;
      }
    }
    for (const [id, actor] of this.players) if (!liveIds.has(id)) { this.scene.remove(actor.group); actor.group.traverse((node) => { if (node.geometry) node.geometry.dispose(); }); this.players.delete(id); }
    const taskIds = new Set((room?.tasks || []).filter((task) => !task.done).map((task) => task.id));
    for (const [id, station] of this.stationMeshes) { const active = taskIds.has(id); station.marker.material.color.set(active ? 0x9cffa7 : 0x45635b); station.marker.material.opacity = active ? 1 : 0.28; }
    this.updateBodies(room?.bodies || []);
  }
  updateBodies(bodies) {
    if (this.bodyObjects) for (const body of this.bodyObjects) this.scene.remove(body);
    this.bodyObjects = bodies.map((body) => { const group = new THREE.Group(); const torso = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), colorMaterial(0x983f3a)); torso.scale.set(1, 0.55, 1.35); torso.position.y = 0.36; group.add(torso); const light = new THREE.PointLight(0xed5545, 1.8, 2.3); light.position.y = 0.7; group.add(light); group.position.set(body.x, 0, body.z); this.scene.add(group); return group; });
  }
  setLocalPosition(x, z) { const actor = [...this.players.values()].find((item) => item.isSelf); if (actor) actor.target.set(x, 0, z); }
  animate(time) {
    requestAnimationFrame(this.animate); const dt = Math.min(0.06, Math.max(0.001, (time - this.lastRender) / 1000)); this.lastRender = time; this.elapsed += dt;
    this.menuDonkeys.forEach((item, i) => { item.group.position.x = item.baseX + Math.sin(this.elapsed * 0.22 + item.phase) * 0.68; item.group.position.y = item.baseY + Math.sin(this.elapsed * 0.95 + item.phase) * 0.32; item.group.rotation.z = Math.sin(this.elapsed + item.phase) * 0.045; });
    for (const actor of this.players.values()) actor.group.position.lerp(actor.target, 1 - Math.exp(-dt * 11));
    if (this.beacon) this.beacon.scale.setScalar(0.78 + (Math.sin(this.elapsed * 4) + 1) * 0.16);
    for (const station of this.stationMeshes.values()) station.marker.rotation.z += dt * 0.28;
    this.renderer.render(this.scene, this.camera);
  }
}

export const TASK_STATIONS = STATIONS;
export const taskDistance = (x, z, task) => Math.hypot(x - task.x, z - task.z);
