/**
 * Minecraft Web - 3D Engine, Player Physics, Interaction, Day/Night & Entities
 */
import * as THREE from 'three';
import {
  SX,
  SY,
  SZ,
  BlockType,
  ItemType,
  AnyItemId,
  ItemStack,
  WorldMeta,
  FurnaceData,
  ChestData,
  MobType,
  MobEntity,
  KeyBindings,
  DEFAULT_KEY_BINDINGS,
} from './types';
import {
  BLOCK_DEFS,
  ITEM_DEFS,
  TILE_SIZE,
  TILES_PER_ROW,
  ATLAS_SIZE,
  atlasTexture,
  crackTextures,
  getItemName,
} from './textures';
import { VoxelWorld, inBounds, IDX } from './world';
import { Sound, SoundMaterial } from './audio';
import { findSmeltRecipe } from './recipes';

export interface DropItemEntity {
  id: AnyItemId;
  count: number;
  mesh: THREE.Object3D;
  vel: { x: number; y: number; z: number };
  age: number;
  baseY: number | null;
}

export interface ParticleEntity {
  mesh: THREE.Mesh;
  vel: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
}

export class MinecraftEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public world: VoxelWorld;

  // Day/Night and Sky
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public starsGroup: THREE.Group;
  public timeOfDay = 0.25; // 0 = noon, 0.25 = afternoon, 0.5 = sunset/night, etc.
  public dayLength = 480; // 8 minutes per full day/night cycle

  // Materials
  public worldMaterial: THREE.MeshLambertMaterial;
  public highlightBox: THREE.LineSegments;
  public crackMesh: THREE.Mesh;

  // World border (Minecraft-style blue forcefield barrier)
  public worldBorderGroup: THREE.Group;
  public worldBorderMaterial: THREE.MeshBasicMaterial;
  public worldBorderTime = 0;

  // Player & Models
  public donkey3P: THREE.Group;
  public handGroup: THREE.Group;
  public heldItemMesh: THREE.Mesh | null = null;
  public isThirdPerson = false;
  public fov = 75;
  public mouseSensitivity = 1.0;
  public renderDistance = 24;
  public fps = 0;
  private fpsFrames = 0;
  private fpsClock = 0;
  private visibleMeshCenter = { x: -999, z: -999 };

  // Player State
  public pos = { x: 40.5, y: 30, z: 40.5 };
  public vel = { x: 0, y: 0, z: 0 };
  public yaw = 0;
  public pitch = 0;
  public onGround = false;
  public isSneaking = false;
  public isSprinting = false;
  public hp = 20;
  public maxHp = 20;
  public hunger = 20;
  public maxHunger = 20;
  public xp = 0;
  public level = 0;
  public selectedSlot = 0;
  public inventory: (ItemStack | null)[] = new Array(36).fill(null);
  public armor: (ItemStack | null)[] = new Array(4).fill(null);
  public offhand: ItemStack | null = null;

  // Game Mode & Settings
  public gameMode: 'survival' | 'creative' = 'survival';
  public isFlying = false;
  public flyCooldown = 0;

  // Physics params
  public readonly PW = 0.3;
  public readonly PH = 1.8;
  public readonly EYE_HEIGHT = 1.62;
  public readonly SNEAK_EYE = 1.4;

  // Interaction State
  public breakingBlock: { x: number; y: number; z: number } | null = null;
  public breakProgress = 0;
  public swingTimer = -1;
  public placeCooldown = 0;
  public fallStartY = 0;
  public walkPhase = 0;
  public stepDistance = 0;
  public hungerExhaustion = 0;
  public regenTimer = 0;
  public starveTimer = 0;
  public damageFlashTimer = 0;
  private damageFlashHudClock = 0;

  // Active Tile Entity Open
  public currentFurnacePos: { x: number; y: number; z: number } | null = null;
  public currentChestPos: { x: number; y: number; z: number } | null = null;

  // Entities & Particles
  public drops: DropItemEntity[] = [];
  public particles: ParticleEntity[] = [];
  public mobs: MobEntity[] = [];
  private remotePlayers = new Map<string, { mesh: THREE.Group; target: THREE.Vector3; yaw: number; isMoving: boolean; isCrouching: boolean; isDead: boolean }>();
  public attackCooldown = 0;

  // Keys & Input
  public keys: Record<string, boolean> = {};
  public keyBindings: KeyBindings = { ...DEFAULT_KEY_BINDINGS };
  public mouseLeft = false;
  public mouseRight = false;
  public isPointerLocked = false;
  public isPaused = false;
  public isDead = false;
  public isGUIOpen = false;
  public onlineMode = false;

  // Callbacks to React UI
  public onUIStateChange?: (state: string) => void;
  public onHUDUpdate?: () => void;
  public onToast?: (msg: string) => void;
  public onBlockChanged?: (change: { x: number; y: number; z: number; blockId: number }) => void;
  public onAttackPlayer?: (payload: { targetId: string; weaponType: string }) => void;
  public onTileEntityChanged?: () => void;

  private lastTime = 0;
  private animFrameId = 0;
  private torchGroup = new THREE.Group();
  private torchLights: THREE.PointLight[] = [];
  private torchTime = 0;

  constructor(canvasContainer: HTMLElement, meta?: WorldMeta) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 45, 120);

    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      0.05,
      350
    );
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    canvasContainer.appendChild(this.renderer.domElement);
    this.scene.add(this.torchGroup);

    // World Material
    this.worldMaterial = new THREE.MeshLambertMaterial({
      map: atlasTexture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1,
    });

    // Lights
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x667788, 0.85);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.65);
    this.sunLight.position.set(60, 100, 30);
    this.scene.add(this.sunLight);

    // Celestial Sun, Moon, Stars
    const sunGeo = new THREE.BoxGeometry(10, 10, 2);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff6a3 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    const moonGeo = new THREE.BoxGeometry(8, 8, 2);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xecf0f1 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // Stars
    this.starsGroup = new THREE.Group();
    const starGeo = new THREE.BufferGeometry();
    const starCoords: number[] = [];
    for (let i = 0; i < 300; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 180;
      starCoords.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
    this.starsGroup.add(new THREE.Points(starGeo, starMat));
    this.scene.add(this.starsGroup);

    // Highlight bounding box
    this.highlightBox = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.6 })
    );
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);

    // Crack breaking mesh with heavy offset and high opacity
    this.crackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.015, 1.015, 1.015),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.98,
        depthTest: true,
        depthWrite: false,
        map: crackTextures[0],
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      })
    );
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);

    // ================= WORLD BORDER (Minecraft forcefield) =================
    // Procedural forcefield texture: animated diagonal stripes that match
    // Minecraft's "blue barrier" world border. Single texture shared across
    // all four walls; UV scrolling animates the stripes.
    const forcefieldCanvas = document.createElement('canvas');
    forcefieldCanvas.width = 64;
    forcefieldCanvas.height = 64;
    const ffCtx = forcefieldCanvas.getContext('2d')!;
    ffCtx.imageSmoothingEnabled = false;
    // Background: dark translucent aqua
    ffCtx.fillStyle = 'rgba(20, 90, 130, 0.30)';
    ffCtx.fillRect(0, 0, 64, 64);
    // Diagonal stripes (parallel narrow bars)
    for (let i = -64; i < 128; i += 6) {
      const grad = ffCtx.createLinearGradient(i, 0, i + 64, 64);
      grad.addColorStop(0.0, 'rgba(120, 240, 255, 0.0)');
      grad.addColorStop(0.4, 'rgba(140, 250, 255, 0.55)');
      grad.addColorStop(0.5, 'rgba(220, 255, 255, 0.85)');
      grad.addColorStop(0.6, 'rgba(140, 250, 255, 0.55)');
      grad.addColorStop(1.0, 'rgba(120, 240, 255, 0.0)');
      ffCtx.fillStyle = grad;
      ffCtx.fillRect(i, 0, 64, 64);
    }
    const forcefieldTexture = new THREE.CanvasTexture(forcefieldCanvas);
    forcefieldTexture.wrapS = THREE.RepeatWrapping;
    forcefieldTexture.wrapT = THREE.RepeatWrapping;
    forcefieldTexture.magFilter = THREE.NearestFilter;
    forcefieldTexture.minFilter = THREE.NearestFilter;
    forcefieldTexture.generateMipmaps = false;

    this.worldBorderMaterial = new THREE.MeshBasicMaterial({
      map: forcefieldTexture,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
      color: 0x88f0ff, // aqua tint matching border color
    });

    // Build 4 vertical walls around the world perimeter
    this.worldBorderGroup = new THREE.Group();
    const wallHeight = SY; // 48 blocks tall
    const wallThickness = 0.4;
    const wallCenterY = SY / 2;
    const wallRepeatY = 6;
    const wallRepeatLong = 32; // for X/Z axis walls

    // North wall (+Z)
    const northWall = new THREE.Mesh(
      new THREE.PlaneGeometry(SX, wallHeight),
      this.worldBorderMaterial
    );
    northWall.position.set(SX / 2, wallCenterY, SZ);
    northWall.rotation.y = Math.PI;
    northWall.userData = { repeatX: wallRepeatLong, repeatY: wallRepeatY };
    this.worldBorderGroup.add(northWall);

    // South wall (-Z)
    const southWall = new THREE.Mesh(
      new THREE.PlaneGeometry(SX, wallHeight),
      this.worldBorderMaterial
    );
    southWall.position.set(SX / 2, wallCenterY, 0);
    southWall.userData = { repeatX: wallRepeatLong, repeatY: wallRepeatY };
    this.worldBorderGroup.add(southWall);

    // East wall (+X)
    const eastWall = new THREE.Mesh(
      new THREE.PlaneGeometry(SZ, wallHeight),
      this.worldBorderMaterial
    );
    eastWall.position.set(SX, wallCenterY, SZ / 2);
    eastWall.rotation.y = -Math.PI / 2;
    eastWall.userData = { repeatX: wallRepeatLong, repeatY: wallRepeatY };
    this.worldBorderGroup.add(eastWall);

    // West wall (-X)
    const westWall = new THREE.Mesh(
      new THREE.PlaneGeometry(SZ, wallHeight),
      this.worldBorderMaterial
    );
    westWall.position.set(0, wallCenterY, SZ / 2);
    westWall.rotation.y = Math.PI / 2;
    westWall.userData = { repeatX: wallRepeatLong, repeatY: wallRepeatY };
    this.worldBorderGroup.add(westWall);

    this.scene.add(this.worldBorderGroup);

    // Create World
    this.world = new VoxelWorld(meta ? meta.seed : 'minecraft');
    if (meta && meta.mods) {
      this.world.mods = { ...meta.mods };
    }
    if (meta && meta.furnaces) {
      this.world.furnaces = { ...meta.furnaces };
    }
    if (meta && meta.chests) {
      this.world.chests = { ...meta.chests };
    }

    // Player Models (3D Donkey Character & Donkey Hoof Hand)
    this.donkey3P = this.createDonkeyModel();
    this.donkey3P.visible = false;
    this.scene.add(this.donkey3P);

    this.handGroup = this.createFirstPersonHand();
    this.camera.add(this.handGroup);
    this.scene.add(this.camera);

    // Load Keybindings from localStorage if available
    try {
      const savedBinds = localStorage.getItem('esekcraft_keybinds');
      if (savedBinds) {
        this.keyBindings = { ...DEFAULT_KEY_BINDINGS, ...JSON.parse(savedBinds) };
      }
    } catch {}

    // Load or Initialize Player State
    this.initPlayerState(meta);

    // Event Listeners
    this.setupListeners();
  }

  private initPlayerState(meta?: WorldMeta) {
    if (meta) {
      this.gameMode = meta.gameMode || 'survival';
      if (meta.player) {
        this.pos = { x: meta.player.x, y: meta.player.y, z: meta.player.z };
        this.yaw = meta.player.yaw || 0;
        this.pitch = meta.player.pitch || 0;
        this.hp = meta.player.hp ?? 20;
        this.hunger = meta.player.hunger ?? 20;
        this.xp = meta.player.xp || 0;
        this.level = meta.player.level || 0;
        this.selectedSlot = meta.player.sel || 0;
        this.inventory = meta.player.inv || new Array(36).fill(null);
        this.armor = meta.player.armor || new Array(4).fill(null);
        this.offhand = meta.player.offhand || null;
      } else {
        this.spawnDefaultPlayer();
      }
    } else {
      this.spawnDefaultPlayer();
    }
    this.fallStartY = this.pos.y;
  }

  private spawnDefaultPlayer() {
    const sx = SX / 2 + 0.5;
    const sz = SZ / 2 + 0.5;
    const topY = this.world.getTopSolid(Math.floor(sx), Math.floor(sz));
    this.pos = { x: sx, y: Math.max(16, topY + 1.2), z: sz };
    this.hp = 20;
    this.hunger = 20;
    this.xp = 0;
    this.level = 0;
    this.selectedSlot = 0;
    this.inventory = new Array(36).fill(null);
    this.armor = new Array(4).fill(null);
    this.offhand = null;

    // Starter items (classic adventure style)
    this.inventory[0] = { id: BlockType.OAK_LOG, count: 8 };
    this.inventory[1] = { id: ItemType.APPLE, count: 6 };
    this.inventory[2] = { id: BlockType.TORCH, count: 16 };
  }

  public setRemotePlayers(players: Record<string, any>, selfId?: string) {
    const active = new Set<string>();
    for (const [id, data] of Object.entries(players || {})) {
      if (id === selfId) continue;
      const x = Number(data?.x), y = Number(data?.y), z = Number(data?.z);
      if (![x, y, z].every(Number.isFinite)) continue;
      active.add(id);
      let remote = this.remotePlayers.get(id);
      if (!remote) {
        const mesh = this.createDonkeyModel();
        this.scene.add(mesh);
        remote = { mesh, target: new THREE.Vector3(x, y, z), yaw: 0, isMoving: false, isCrouching: false, isDead: false };
        this.remotePlayers.set(id, remote);
        mesh.position.set(x, y, z);
      }
      remote.target.set(x, y, z);
      remote.yaw = Number(data?.yaw) || 0;
      remote.isMoving = !!data?.isMoving;
      remote.isCrouching = !!data?.isCrouching;
      remote.isDead = data?.alive === false;
    }
    for (const [id, remote] of this.remotePlayers) {
      if (active.has(id)) continue;
      this.scene.remove(remote.mesh);
      this.disposeDropObject(remote.mesh);
      this.remotePlayers.delete(id);
    }
  }
  public clearRemotePlayers() {
    for (const remote of this.remotePlayers.values()) {
      this.scene.remove(remote.mesh);
      this.disposeDropObject(remote.mesh);
    }
    this.remotePlayers.clear();
  }
  private updateRemotePlayers(dt: number) {
    for (const remote of this.remotePlayers.values()) {
      remote.mesh.position.lerp(remote.target, Math.min(1, dt * 12));
      if (remote.isDead) {
        remote.mesh.position.y = remote.target.y + 0.22;
        remote.mesh.rotation.z += (-Math.PI / 2 - remote.mesh.rotation.z) * Math.min(1, dt * 10);
        remote.mesh.userData.hitUntil = 0;
        continue;
      }
      remote.mesh.position.y = remote.target.y;
      remote.mesh.rotation.z += (0 - remote.mesh.rotation.z) * Math.min(1, dt * 10);
      const targetYaw = remote.yaw + Math.PI;
      let yawDelta = targetYaw - remote.mesh.rotation.y;
      while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
      while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
      remote.mesh.rotation.y += yawDelta * Math.min(1, dt * 14);
      remote.mesh.scale.y = remote.mesh.scale.x * (remote.isCrouching ? 0.72 : 1);
      const ud = remote.mesh.userData;
      const now = performance.now() / 1000;
      const attackAge = now - (ud.attackUntil || 0) + 0.42;
      const attack = attackAge > 0 && attackAge < 0.42 ? Math.sin((attackAge / 0.42) * Math.PI) : 0;
      const swing = remote.isMoving ? Math.sin(performance.now() * 0.012) * 0.48 : 0;
      if (ud.legs?.length === 4) {
        ud.legs[0].rotation.x = swing + (ud.attackSide > 0 ? -1.25 : 0.1) * attack;
        ud.legs[1].rotation.x = -swing + (ud.attackSide < 0 ? -1.25 : 0.1) * attack;
        ud.legs[2].rotation.x = -swing;
        ud.legs[3].rotation.x = swing;
      }
      const flashing = (ud.hitUntil || 0) > now;
      if (flashing && !ud.hitTinted) {
        for (const entry of ud.hitMaterials || []) entry.material.color.setHex(0xff302b);
        ud.hitTinted = true;
      } else if (!flashing && ud.hitTinted) {
        for (const entry of ud.hitMaterials || []) entry.material.color.copy(entry.base);
        ud.hitTinted = false;
      }
    }
  }
  public flashRemotePlayer(id: string) {
    const remote = this.remotePlayers.get(id);
    if (remote) remote.mesh.userData.hitUntil = performance.now() / 1000 + 0.28;
  }
  public playRemoteAttack(id: string) {
    const remote = this.remotePlayers.get(id);
    if (remote) {
      remote.mesh.userData.attackUntil = performance.now() / 1000;
      remote.mesh.userData.attackSide = -(remote.mesh.userData.attackSide || 1);
    }
  }
  public applyNetworkHealth(health: number) {
    if (!Number.isFinite(health)) return;
    this.hp = Math.max(0, Math.min(this.maxHp, health));
    this.damageFlashTimer = 0.4;
    this.onHUDUpdate?.();
  }
  private getRemoteTargetId(): string | null {
    const eye = this.getEyePos();
    const dir = this.getLookDir();
    let best: { id: string; distance: number } | null = null;
    for (const [id, remote] of this.remotePlayers) {
      if (remote.isDead) continue;
      const dx = remote.target.x - eye.x;
      const dy = (remote.target.y + 0.95) - eye.y;
      const dz = remote.target.z - eye.z;
      const distance = Math.hypot(dx, dy, dz);
      if (distance > 4.0 || distance < 0.01) continue;
      const dot = (dx * dir.x + dy * dir.y + dz * dir.z) / distance;
      if (dot < 0.08) continue;
      const perpendicular = Math.sqrt(Math.max(0, distance * distance - (distance * dot) ** 2));
      if (perpendicular > 1.15) continue;
      if (!best || distance < best.distance) best = { id, distance };
    }
    return best?.id || null;
  }
  public applyRemoteBlockChange(x: number, y: number, z: number, blockId: number) {
    if (![x, y, z, blockId].every(Number.isFinite)) return;
    if (!inBounds(Math.floor(x), Math.floor(y), Math.floor(z))) return;
    this.world.setBlock(Math.floor(x), Math.floor(y), Math.floor(z), blockId as BlockType);
    this.rebuildVisibleWorld();
    this.rebuildTorchVisuals();
    this.recoverFromBlockCollision();
  }
  public setRenderDistance(distance: number) {
    const next = Math.max(16, Math.min(Math.max(SX, SZ), Math.round(distance)));
    if (next === this.renderDistance) return;
    this.renderDistance = next;
    this.visibleMeshCenter = { x: -999, z: -999 };
    this.rebuildVisibleWorld();
    this.onHUDUpdate?.();
  }
  private rebuildVisibleWorld() {
    const cx = this.pos.x; const cz = this.pos.z;
    this.world.buildMesh(this.scene, this.worldMaterial, this.renderDistance, cx, cz);
    this.visibleMeshCenter = { x: cx, z: cz };
  }

  public start(
    onReady?: () => void,
    onLoadingProgress?: (pct: number, stage: string, fps: number) => void
  ) {
    const loadingStartedAt = performance.now();
    const initialize = async () => {
      try {
        await this.world.generate((pct, stage, fps) => {
          onLoadingProgress?.(pct, stage, fps);
        });
        this.recoverFromBlockCollision();

        const centerX = this.pos.x;
        const centerZ = this.pos.z;
        await this.world.buildMeshAdaptive(
          this.scene,
          this.worldMaterial,
          this.renderDistance,
          centerX,
          centerZ,
          (pct, stage, fps) => onLoadingProgress?.(74 + pct * 0.24, stage, fps)
        );
        this.visibleMeshCenter = { x: centerX, z: centerZ };
        this.rebuildTorchVisuals();
        this.spawnMobs(30);
        this.lastTime = performance.now();
        this.animate(this.lastTime);

        // Keep the loading screen visible briefly after the first complete world frame.
        const minimumLoadingMs = 1500;
        const remaining = Math.max(0, minimumLoadingMs - (performance.now() - loadingStartedAt));
        window.setTimeout(() => {
          onLoadingProgress?.(100, 'Dünya hazır!', this.fps || 60);
          onReady?.();
        }, remaining);
      } catch (error) {
        console.error('EsekCraft world loading failed:', error);
        onLoadingProgress?.(0, 'Dünya yüklenemedi. Yeniden deneyebilirsin.', 0);
      }
    };

    // Give React two frames to paint the loading screen before CPU-heavy work begins.
    requestAnimationFrame(() => requestAnimationFrame(() => void initialize()));
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
    this.mobs.forEach((m) => {
      this.scene.remove(m.mesh);
    });
    this.mobs = [];
    this.clearRemotePlayers();
    this.renderer.dispose();
  }

  // ================= 3D MODELS (Donkey Character & Donkey Hoof Hand) =================
  private createDonkeyModel(): THREE.Group {
    // EsekSimulator'deki okunaklı model oranları: gövde, eğimli boyun, burun ve uzun kulaklar.
    // Modelin yüzü +Z eksenine bakar; EsekCraft ileri yönü -Z olduğu için model
    // kullanım noktasında Math.PI ile çevrilir.
    const g = new THREE.Group();
    const greyMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const muzzleMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const part = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      return mesh;
    };
    const bodyPivot = new THREE.Group();
    bodyPivot.position.set(0, 1.12, 0);
    bodyPivot.add(part(0.92, 0.76, 1.52, greyMat, 0, 0, 0));
    g.add(bodyPivot);
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.35, 0.53);
    const neck = part(0.46, 0.68, 0.46, greyMat, 0, 0.30, 0);
    neck.rotation.x = 0.3;
    headGroup.add(neck);
    headGroup.add(part(0.46, 0.46, 0.68, greyMat, 0, 0.68, 0.23));
    headGroup.add(part(0.44, 0.30, 0.30, muzzleMat, 0, 0.60, 0.56));
    headGroup.add(part(0.075, 0.075, 0.075, blackMat, 0.235, 0.76, 0.23));
    headGroup.add(part(0.075, 0.075, 0.075, blackMat, -0.235, 0.76, 0.23));
    const earLeft = part(0.12, 0.60, 0.15, greyMat, 0.19, 1.12, 0);
    earLeft.rotation.set(-0.2, 0, -0.2);
    const earRight = part(0.12, 0.60, 0.15, greyMat, -0.19, 1.12, 0);
    earRight.rotation.set(-0.2, 0, 0.2);
    headGroup.add(earLeft, earRight);
    g.add(headGroup);
    const legs: THREE.Group[] = [];
    for (const [x, y, z] of [[0.30, 0.76, 0.53], [-0.30, 0.76, 0.53], [0.30, 0.76, -0.53], [-0.30, 0.76, -0.53]]) {
      const leg = new THREE.Group();
      leg.position.set(x, y, z);
      leg.add(part(0.23, 0.61, 0.23, greyMat, 0, -0.30, 0));
      leg.add(part(0.25, 0.15, 0.25, blackMat, 0, -0.67, 0));
      g.add(leg);
      legs.push(leg);
    }
    g.scale.setScalar(0.76);
    const hitMaterials: { material: THREE.Material & { color: THREE.Color }; base: THREE.Color }[] = [];
    g.traverse((node) => {
      if (!(node as THREE.Mesh).isMesh) return;
      const mesh = node as THREE.Mesh;
      const material = (mesh.material as THREE.Material).clone() as THREE.Material & { color: THREE.Color };
      mesh.material = material;
      if (material.color) hitMaterials.push({ material, base: material.color.clone() });
    });
    g.userData = { legs, headGroup, bodyPivot, hitMaterials, hitUntil: 0, hitTinted: false, attackUntil: 0, attackSide: 1 };
    return g;
  }
  // First Person Donkey Hoof Hand on the right side - authentically angled upward & inward like Minecraft
  private createFirstPersonHand(): THREE.Group {
    const group = new THREE.Group();
    const furMat = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });

    // Donkey front leg arm originating from the bottom right and extending upwards
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.16), furMat);
    leg.position.set(0, -0.12, 0);
    group.add(leg);

    // Dark hoof at top/front of arm
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), hoofMat);
    hoof.position.set(0, 0.13, 0);
    group.add(hoof);

    // Positioned in bottom-right corner, tilted up and slightly inward toward screen center
    group.position.set(0.36, -0.28, -0.48);
    group.rotation.set(0.12, -0.28, 0.08);
    return group;
  }

  public updateHeldItemModel() {
    if (this.heldItemMesh) {
      this.handGroup.remove(this.heldItemMesh);
      this.disposeDropObject(this.heldItemMesh);
      this.heldItemMesh = null;
    }

    const currentStack = this.inventory[this.selectedSlot];
    if (!currentStack) return;

    const id = currentStack.id;

    // Torches are items with a stick/flame model, not miniature cubes.
    if (id === BlockType.TORCH) {
      const torch = this.createTorchDrop();
      torch.scale.setScalar(0.85);
      torch.position.set(-0.02, 0.15, -0.06);
      torch.rotation.set(-0.16, 0.32, -0.22);
      this.heldItemMesh = torch as unknown as THREE.Mesh;
      this.handGroup.add(this.heldItemMesh);
    // A door is a thin, framed item rather than a solid miniature cube.
    } else if (id === BlockType.OAK_DOOR) {
      const door = new THREE.Group();
      const wood = new THREE.MeshLambertMaterial({ color: 0x9b6a35 });
      const darkWood = new THREE.MeshLambertMaterial({ color: 0x68421f });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.43, 0.055), wood);
      door.add(panel);
      for (const x of [-0.105, 0.105]) {
        const stile = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.44, 0.07), darkWood);
        stile.position.x = x;
        door.add(stile);
      }
      for (const y of [-0.19, 0.19]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.075), darkWood);
        rail.position.y = y;
        door.add(rail);
      }
      const knob = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 0.035), new THREE.MeshLambertMaterial({ color: 0xd0ad53 }));
      knob.position.set(0.085, 0, 0.045);
      door.add(knob);
      door.scale.setScalar(0.85);
      door.position.set(-0.02, 0.15, -0.06);
      door.rotation.set(-0.16, 0.32, -0.22);
      this.heldItemMesh = door as unknown as THREE.Mesh;
      this.handGroup.add(door);
    // Sheared wool is placeable as a full block, so show the full block model in hand too.
    } else if (id === ItemType.WHITE_WOOL) {
      const blockModel = this.createHeldBlockModel(BlockType.WHITE_WOOL_BLOCK);
      this.heldItemMesh = blockModel as unknown as THREE.Mesh;
      this.heldItemMesh.position.set(-0.02, 0.15, -0.06);
      this.heldItemMesh.rotation.set(0.2, -0.45, 0.15);
      this.handGroup.add(blockModel);
    // All block items get a larger hand model with their own per-face atlas texture.
    } else if (BLOCK_DEFS[id] && Number(id) < 100 && !ITEM_DEFS[id]?.tool && id !== ItemType.STICK) {
      const blockModel = this.createHeldBlockModel(id);
      this.heldItemMesh = blockModel as unknown as THREE.Mesh;
      this.heldItemMesh.position.set(-0.02, 0.15, -0.06);
      this.heldItemMesh.rotation.set(0.2, -0.45, 0.15);
      this.handGroup.add(blockModel);
    } else {
      // It's a tool or item: authentic Minecraft voxel design
      const def = ITEM_DEFS[id];
      const toolGroup = new THREE.Group();

      let headColor = 0x8a6d3b; // wood
      if (def?.tool) {
        if (def.tool.material === 'wood') headColor = 0x9a6b32;
        else if (def.tool.material === 'iron') headColor = 0xe0e0e0;
        else if (def.tool.material === 'diamond') headColor = 0x38ebf5;
        else if (def.tool.material === 'stone') headColor = 0x808080;
      } else if (id === ItemType.GOLD_INGOT) {
        headColor = 0xffd700;
      } else if (id === ItemType.DIAMOND) {
        headColor = 0x38ebf5;
      } else if (id === ItemType.APPLE) {
        headColor = 0xd42222;
      } else if (id === ItemType.COOKED_STEAK || id === ItemType.RAW_BEEF) {
        headColor = 0xba3c3c;
      } else if (id === ItemType.RAW_PORKCHOP || id === ItemType.COOKED_PORKCHOP) {
        headColor = 0xf09090;
      } else if (id === ItemType.RAW_MUTTON || id === ItemType.COOKED_MUTTON) {
        headColor = 0xcc6060;
      } else if (id === ItemType.RAW_CHICKEN || id === ItemType.COOKED_CHICKEN) {
        headColor = 0xdeaa88;
      } else if (id === ItemType.COAL || id === ItemType.CHARCOAL) {
        headColor = 0x222222;
      }

      const woodHandleMat = new THREE.MeshLambertMaterial({ color: 0x6e4e20 });
      const toolMat = new THREE.MeshLambertMaterial({ color: headColor });
      const addBoxPart = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => {
        const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        part.position.set(x, y, z);
        toolGroup.add(part);
        return part;
      };

      // Wooden handle rod
      const handleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.52, 0.045), woodHandleMat);
      handleMesh.position.set(0, 0, 0);
      toolGroup.add(handleMesh);

      // Authentic Minecraft Tool Head Modeling
      if (def?.tool?.type === 'pickaxe') {
        // Minecraft Iconic Curved Pickaxe Head with arched wings and pointed down-teeth!
        const center = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.07), toolMat);
        center.position.set(0, 0.24, 0);
        toolGroup.add(center);

        // Left curved arm
        const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.07), toolMat);
        leftArm.position.set(-0.08, 0.23, 0);
        toolGroup.add(leftArm);

        // Left down-curving spike
        const leftSpike = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.07), toolMat);
        leftSpike.position.set(-0.14, 0.17, 0);
        toolGroup.add(leftSpike);

        // Left sharp point
        const leftPoint = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.06), toolMat);
        leftPoint.position.set(-0.16, 0.09, 0);
        toolGroup.add(leftPoint);

        // Right curved arm
        const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.07), toolMat);
        rightArm.position.set(0.08, 0.23, 0);
        toolGroup.add(rightArm);

        // Right down-curving spike
        const rightSpike = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.07), toolMat);
        rightSpike.position.set(0.14, 0.17, 0);
        toolGroup.add(rightSpike);

        // Right sharp point
        const rightPoint = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.06), toolMat);
        rightPoint.position.set(0.16, 0.09, 0);
        toolGroup.add(rightPoint);
      } else if (def?.tool?.type === 'sword') {
        // Minecraft Sword: Pommel, grip, crossguard with wings, and tapered blade
        const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.07), woodHandleMat);
        pommel.position.set(0, -0.22, 0);
        toolGroup.add(pommel);

        const guardMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.07), guardMat);
        crossguard.position.set(0, 0.06, 0);
        toolGroup.add(crossguard);

        const guardLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.07), guardMat);
        guardLeft.position.set(-0.13, 0.09, 0);
        toolGroup.add(guardLeft);

        const guardRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.07), guardMat);
        guardRight.position.set(0.13, 0.09, 0);
        toolGroup.add(guardRight);

        // Sword blade
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 0.04), toolMat);
        blade.position.set(0, 0.32, 0);
        toolGroup.add(blade);

        // Sword tip
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), toolMat);
        tip.position.set(0, 0.58, 0);
        toolGroup.add(tip);
      } else if (def?.tool?.type === 'axe') {
        // Minecraft Axe: Counterweight poll behind, wide flared blade in front
        const backPoll = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.07), toolMat);
        backPoll.position.set(0.06, 0.22, 0);
        toolGroup.add(backPoll);

        const mainBlade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.07), toolMat);
        mainBlade.position.set(-0.08, 0.22, 0);
        toolGroup.add(mainBlade);

        const upperBeard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.07), toolMat);
        upperBeard.position.set(-0.16, 0.26, 0);
        toolGroup.add(upperBeard);

        const lowerBeard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.07), toolMat);
        lowerBeard.position.set(-0.16, 0.14, 0);
        toolGroup.add(lowerBeard);
      } else if (def?.tool?.type === 'shovel') {
        // Minecraft Shovel: Socket neck and scooped spade head
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.07), toolMat);
        neck.position.set(0, 0.24, 0);
        toolGroup.add(neck);

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.05), toolMat);
        blade.position.set(0, 0.34, 0);
        toolGroup.add(blade);

        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.05), toolMat);
        tip.position.set(0, 0.44, 0);
        toolGroup.add(tip);
      } else {
        // General items, food, materials (apple, ingot, diamond, wool, meat)
        if (id === ItemType.STICK) {
          const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.045, 0.58, 8),
            woodHandleMat
          );
          stick.rotation.z = -0.35;
          stick.position.set(0, 0.12, 0);
          toolGroup.add(stick);
        } else if (id === ItemType.COAL || id === ItemType.CHARCOAL) {
          const lumpMat = new THREE.MeshLambertMaterial({ color: id === ItemType.COAL ? 0x242326 : 0x39302a });
          const lump = new THREE.Mesh(
            id === ItemType.COAL ? new THREE.DodecahedronGeometry(0.13, 0) : new THREE.OctahedronGeometry(0.13),
            lumpMat
          );
          lump.scale.set(id === ItemType.COAL ? 1 : 0.78, id === ItemType.COAL ? 0.82 : 1.08, 0.72);
          lump.position.set(0, 0.14, 0);
          lump.rotation.set(0.3, 0.4, -0.2);
          toolGroup.add(lump);
          if (id === ItemType.CHARCOAL) addBoxPart(0.035, 0.035, 0.035, new THREE.MeshLambertMaterial({ color: 0x786b5c }), 0.05, 0.21, 0.035);
        } else if (id === ItemType.IRON_INGOT || id === ItemType.GOLD_INGOT) {
          const shape = new THREE.Shape();
          shape.moveTo(-0.13, -0.055);
          shape.lineTo(-0.09, 0.055);
          shape.lineTo(0.09, 0.055);
          shape.lineTo(0.13, -0.055);
          shape.closePath();
          const ingot = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.012, bevelThickness: 0.012 }), toolMat);
          ingot.position.set(0, 0.14, -0.02);
          ingot.rotation.z = -0.08;
          toolGroup.add(ingot);
          addBoxPart(0.12, 0.018, 0.012, new THREE.MeshLambertMaterial({ color: id === ItemType.GOLD_INGOT ? 0xffed75 : 0xf7f7f7 }), 0, 0.18, 0.045);
        } else if (id === ItemType.RAW_IRON || id === ItemType.RAW_GOLD) {
          const oreMat = new THREE.MeshLambertMaterial({ color: id === ItemType.RAW_IRON ? 0x9b8671 : 0xb78a36 });
          const raw = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), oreMat);
          raw.scale.set(1.05, 0.82, 0.76);
          raw.position.set(0, 0.14, 0);
          toolGroup.add(raw);
          addBoxPart(0.065, 0.035, 0.025, new THREE.MeshLambertMaterial({ color: id === ItemType.RAW_IRON ? 0xd0b9a1 : 0xffd76a }), -0.015, 0.19, 0.075);
        } else if (id === ItemType.FLINT) {
          const flint = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshLambertMaterial({ color: 0x343b40 }));
          flint.scale.set(1.15, 0.75, 0.68);
          flint.rotation.set(0.25, 0.4, -0.28);
          flint.position.set(0, 0.14, 0);
          toolGroup.add(flint);
          addBoxPart(0.045, 0.018, 0.025, new THREE.MeshLambertMaterial({ color: 0x81888a }), -0.035, 0.2, 0.065);
        } else if (id === ItemType.DIAMOND) {
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), toolMat);
          gem.position.set(0, 0.16, 0);
          toolGroup.add(gem);
        } else if (id === ItemType.APPLE) {
          const apple = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshLambertMaterial({ color: 0xd62929 }));
          apple.scale.y = 0.85; apple.position.set(0, 0.14, 0); toolGroup.add(apple);
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 6), woodHandleMat);
          stem.position.set(0, 0.28, 0); toolGroup.add(stem);
        } else if (id === ItemType.SHEARS) {
          const bladeMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });
          const ringMat = new THREE.MeshLambertMaterial({ color: 0x6b3f20 });
          for (const x of [-0.07, 0.07]) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 12), ringMat);
            ring.position.set(x, 0.03, 0); toolGroup.add(ring);
          }
          const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.025), bladeMat);
          bladeA.position.set(-0.045, 0.2, 0); bladeA.rotation.z = -0.22; toolGroup.add(bladeA);
          const bladeB = bladeA.clone(); bladeB.position.x = 0.045; bladeB.rotation.z = 0.22; toolGroup.add(bladeB);
        } else if (id === ItemType.BREAD) {
          const crust = new THREE.MeshLambertMaterial({ color: 0xc38a42 });
          const crumb = new THREE.MeshLambertMaterial({ color: 0xf2d28a });
          const loaf = addBoxPart(0.25, 0.12, 0.13, crust, 0, 0.14, 0);
          loaf.scale.set(1, 0.9, 1);
          addBoxPart(0.18, 0.055, 0.105, crumb, 0, 0.205, 0);
          for (const x of [-0.055, 0, 0.055]) addBoxPart(0.012, 0.018, 0.11, crust, x, 0.234, 0);
        } else if ([ItemType.RAW_BEEF, ItemType.COOKED_STEAK, ItemType.RAW_PORKCHOP, ItemType.COOKED_PORKCHOP, ItemType.RAW_MUTTON, ItemType.COOKED_MUTTON, ItemType.RAW_CHICKEN, ItemType.COOKED_CHICKEN].includes(id as ItemType)) {
          const meatShapes: Record<number, { color: number; size: [number, number, number]; bone: boolean; char: boolean }> = {
            [ItemType.RAW_BEEF]: { color: 0xb74747, size: [0.25, 0.13, 0.13], bone: false, char: false },
            [ItemType.COOKED_STEAK]: { color: 0x713b24, size: [0.24, 0.14, 0.16], bone: false, char: true },
            [ItemType.RAW_PORKCHOP]: { color: 0xe59a9d, size: [0.21, 0.13, 0.15], bone: true, char: false },
            [ItemType.COOKED_PORKCHOP]: { color: 0xb96755, size: [0.22, 0.14, 0.14], bone: true, char: true },
            [ItemType.RAW_MUTTON]: { color: 0x9f4242, size: [0.18, 0.17, 0.17], bone: true, char: false },
            [ItemType.COOKED_MUTTON]: { color: 0x80513a, size: [0.19, 0.16, 0.16], bone: true, char: true },
            [ItemType.RAW_CHICKEN]: { color: 0xe3b99b, size: [0.15, 0.2, 0.14], bone: true, char: false },
            [ItemType.COOKED_CHICKEN]: { color: 0xc58a53, size: [0.16, 0.19, 0.15], bone: true, char: true },
          };
          const meat = meatShapes[id];
          const flesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshLambertMaterial({ color: meat.color }));
          flesh.scale.set(meat.size[0] / 0.24, meat.size[1] / 0.24, meat.size[2] / 0.24);
          flesh.position.set(0, 0.14, 0);
          toolGroup.add(flesh);
          if (meat.bone) {
            const bone = new THREE.MeshLambertMaterial({ color: 0xf1e6cf });
            addBoxPart(0.13, 0.035, 0.035, bone, 0.12, 0.12, 0);
            const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), bone);
            knob.position.set(0.185, 0.12, 0);
            toolGroup.add(knob);
          }
          if (meat.char) {
            const grill = new THREE.MeshLambertMaterial({ color: 0x34251e });
            addBoxPart(0.16, 0.018, 0.018, grill, -0.02, 0.19, 0.045);
            addBoxPart(0.16, 0.018, 0.018, grill, 0.035, 0.16, -0.04);
          }
        } else if (id === ItemType.LEATHER) {
          const hide = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.25), new THREE.MeshLambertMaterial({ color: 0x8b5a2b, side: THREE.DoubleSide }));
          hide.position.set(0, 0.16, 0); hide.rotation.z = -0.18; toolGroup.add(hide);
          const edge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.035), new THREE.MeshLambertMaterial({ color: 0x5b3519 }));
          edge.position.set(0, 0.03, 0); toolGroup.add(edge);
        } else if (id === ItemType.FEATHER) {
          const feather = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.38), new THREE.MeshLambertMaterial({ color: 0xf1f1e8, side: THREE.DoubleSide }));
          feather.position.set(0, 0.17, 0); feather.rotation.z = -0.25; toolGroup.add(feather);
          const quill = addBoxPart(0.012, 0.35, 0.012, new THREE.MeshLambertMaterial({ color: 0xcfc8b8 }), 0, 0.17, 0.012);
          quill.rotation.z = -0.25;
        } else if ([ItemType.IRON_HELMET, ItemType.IRON_CHESTPLATE, ItemType.IRON_LEGGINGS, ItemType.IRON_BOOTS, ItemType.DIAMOND_CHESTPLATE].includes(id as ItemType)) {
          const armorMat = new THREE.MeshLambertMaterial({ color: id === ItemType.DIAMOND_CHESTPLATE ? 0x40dce7 : 0xc4cbd0 });
          const trimMat = new THREE.MeshLambertMaterial({ color: id === ItemType.DIAMOND_CHESTPLATE ? 0x178e9d : 0x737b80 });
          if (id === ItemType.IRON_HELMET) {
            addBoxPart(0.24, 0.14, 0.2, armorMat, 0, 0.18, 0);
            addBoxPart(0.28, 0.045, 0.23, trimMat, 0, 0.11, 0.015);
            addBoxPart(0.18, 0.055, 0.035, armorMat, 0, 0.255, -0.015);
          } else if (id === ItemType.IRON_CHESTPLATE || id === ItemType.DIAMOND_CHESTPLATE) {
            addBoxPart(0.24, 0.24, 0.13, armorMat, 0, 0.14, 0);
            addBoxPart(0.36, 0.09, 0.14, armorMat, 0, 0.28, 0);
            addBoxPart(0.12, 0.055, 0.145, trimMat, 0, 0.29, 0.005);
          } else if (id === ItemType.IRON_LEGGINGS) {
            addBoxPart(0.28, 0.08, 0.14, trimMat, 0, 0.28, 0);
            addBoxPart(0.12, 0.23, 0.14, armorMat, -0.075, 0.13, 0);
            addBoxPart(0.12, 0.23, 0.14, armorMat, 0.075, 0.13, 0);
          } else {
            addBoxPart(0.13, 0.13, 0.22, armorMat, -0.075, 0.12, 0.015);
            addBoxPart(0.13, 0.13, 0.22, armorMat, 0.075, 0.12, 0.015);
            addBoxPart(0.15, 0.045, 0.24, trimMat, -0.075, 0.055, 0.025);
            addBoxPart(0.15, 0.045, 0.24, trimMat, 0.075, 0.055, 0.025);
          }
        } else {
          const itemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.16), toolMat);
          itemMesh.position.set(0, 0.14, 0); toolGroup.add(itemMesh);
        }
      }

      // Make the tool silhouette readable in first person.
      toolGroup.scale.setScalar(1.18);
      // Attaches right at the hoof, pointed UPWARD & forward towards crosshair
      toolGroup.position.set(-0.02, 0.15, -0.06);
      toolGroup.rotation.set(-0.16, 0.32, -0.22);
      this.heldItemMesh = toolGroup as unknown as THREE.Mesh;
      this.handGroup.add(this.heldItemMesh);
    }
  }

  private createHeldBlockModel(blockId: AnyItemId): THREE.Group {
    const model = new THREE.Group();

    // The bed has a recognizable mattress/pillow/headboard silhouette instead of a cube.
    if (blockId === BlockType.BED) {
      const wood = new THREE.MeshLambertMaterial({ color: 0x80512f });
      const blanket = new THREE.MeshLambertMaterial({ color: 0xb93a45 });
      const pillow = new THREE.MeshLambertMaterial({ color: 0xf1e8d7 });
      const addPart = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => {
        const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        part.position.set(x, y, z);
        model.add(part);
      };
      addPart(0.30, 0.055, 0.24, wood, 0, 0.015, 0);
      addPart(0.30, 0.115, 0.24, blanket, 0, 0.10, 0);
      addPart(0.095, 0.065, 0.225, pillow, -0.095, 0.19, 0);
      addPart(0.035, 0.27, 0.27, wood, -0.145, 0.11, 0);
      addPart(0.035, 0.15, 0.27, wood, 0.145, 0.065, 0);
      for (const x of [-0.12, 0.12]) {
        for (const z of [-0.09, 0.09]) addPart(0.035, 0.10, 0.035, wood, x, -0.045, z);
      }
      return model;
    }

    // Grass, dirt, stone, logs, ores and utility blocks all use their own face tiles.
    // This keeps grass-top/dirt-side and log-endgrain orientation recognizable in hand.
    const size = blockId === BlockType.OAK_LOG || blockId === BlockType.OAK_PLANKS ? 0.33 : 0.30;
    const geometry = new THREE.BoxGeometry(size, size, size);
    // A dedicated atlas material keeps bark and plank grain visible on hand-held blocks.
    const blockMaterial = new THREE.MeshLambertMaterial({ map: atlasTexture, transparent: true, alphaTest: 0.1 });
    const cube = new THREE.Mesh(geometry, blockMaterial);
    this.setupMeshUVs(geometry, blockId);
    model.add(cube);
    return model;
  }

  private setupMeshUVs(geo: THREE.BoxGeometry, blockId: AnyItemId) {
    const def = BLOCK_DEFS[blockId];
    if (!def) return;
    const uvAttr = geo.attributes.uv;
    const tileUvSize = TILE_SIZE / ATLAS_SIZE;
    const tiles = [def.side, def.side, def.top, def.bottom, def.front || def.side, def.side];

    for (let f = 0; f < 6; f++) {
      const t = tiles[f];
      const tx = t % TILES_PER_ROW;
      const ty = Math.floor(t / TILES_PER_ROW);
      const u0 = tx * tileUvSize;
      const u1 = u0 + tileUvSize;
      const v0 = 1 - (ty + 1) * tileUvSize;
      const v1 = 1 - ty * tileUvSize;

      uvAttr.setXY(f * 4 + 0, u0, v1);
      uvAttr.setXY(f * 4 + 1, u1, v1);
      uvAttr.setXY(f * 4 + 2, u0, v0);
      uvAttr.setXY(f * 4 + 3, u1, v0);
    }
    uvAttr.needsUpdate = true;
  }

  // ================= KEY BINDINGS HELPERS =================
  public setKeyBindings(binds: KeyBindings) {
    this.keyBindings = { ...binds };
    try {
      localStorage.setItem('esekcraft_keybinds', JSON.stringify(binds));
    } catch {}
  }

  public isActionActive(action: keyof KeyBindings): boolean {
    const code = this.keyBindings[action];
    if (!code) return false;
    if (this.keys[code]) return true;
    if (code === 'ShiftLeft' && this.keys['ShiftRight']) return true;
    if (code === 'ShiftRight' && this.keys['ShiftLeft']) return true;
    if (code === 'ControlLeft' && this.keys['ControlRight']) return true;
    if (code === 'ControlRight' && this.keys['ControlLeft']) return true;
    return false;
  }

  // ================= 3D MOB MODELS (Cow, Sheep, Pig, Chicken) =================
  private createCowModel(): THREE.Group {
    const g = new THREE.Group();
    const cowBrown = new THREE.MeshLambertMaterial({ color: 0x543825 });
    const cowWhite = new THREE.MeshLambertMaterial({ color: 0xe0ded8 });
    const cowSnout = new THREE.MeshLambertMaterial({ color: 0xbaa293 });
    const cowHorn = new THREE.MeshLambertMaterial({ color: 0xeae6dc });
    const cowHoof = new THREE.MeshLambertMaterial({ color: 0x242424 });
    const cowUdder = new THREE.MeshLambertMaterial({ color: 0xf29f9f });
    const black = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const materials = [cowBrown, cowWhite, cowSnout, cowHorn, cowHoof, cowUdder, black];

    // Body (0.86 w, 0.76 h, 1.35 len)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.76, 1.35), cowBrown);
    body.position.set(0, 0.98, 0);
    g.add(body);

    // White cow spots
    const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.42, 0.52), cowWhite);
    spot1.position.set(0, 1.05, -0.2);
    g.add(spot1);

    const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.35, 0.42), cowWhite);
    spot2.position.set(0, 0.92, 0.32);
    g.add(spot2);

    // Pink Udder underneath rear
    const udder = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), cowUdder);
    udder.position.set(0, 0.55, 0.36);
    g.add(udder);

    // Head Group (face toward +z so rotation.y = yaw matches movement)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.35, 0.75);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.44), cowBrown);
    headGroup.add(head);

    // White spot on forehead
    const forehead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.46), cowWhite);
    forehead.position.set(0, 0.1, 0);
    headGroup.add(forehead);

    // Snout / Muzzle
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.2), cowSnout);
    snout.position.set(0, -0.11, -0.24);
    headGroup.add(snout);

    // Nostrils
    const nostril1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), black);
    nostril1.position.set(-0.1, -0.12, -0.34);
    headGroup.add(nostril1);
    const nostril2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), black);
    nostril2.position.set(0.1, -0.12, -0.34);
    headGroup.add(nostril2);

    // Horns
    const horn1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), cowHorn);
    horn1.position.set(-0.25, 0.28, 0.02);
    headGroup.add(horn1);
    const horn2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), cowHorn);
    horn2.position.set(0.25, 0.28, 0.02);
    headGroup.add(horn2);

    // Eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), black);
    eye1.position.set(-0.21, 0.06, -0.12);
    headGroup.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), black);
    eye2.position.set(0.21, 0.06, -0.12);
    headGroup.add(eye2);

    g.add(headGroup);

    // 4 Legs
    const legs: THREE.Group[] = [];
    const legCoords = [
      [-0.28, -0.42], // front-left
      [0.28, -0.42],  // front-right
      [-0.28, 0.42],  // back-left
      [0.28, 0.42],   // back-right
    ];

    for (const [lx, lz] of legCoords) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.62, lz);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 0.22), cowBrown);
      leg.position.set(0, -0.31, 0);
      legGroup.add(leg);

      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.24), cowHoof);
      hoof.position.set(0, -0.56, 0);
      legGroup.add(hoof);

      g.add(legGroup);
      legs.push(legGroup);
    }

    g.userData = { headGroup, legs, materials, origColors: materials.map((m) => m.color.getHex()) };
    return g;
  }

  private createSheepModel(): THREE.Group {
    const g = new THREE.Group();
    const woolMat = new THREE.MeshLambertMaterial({ color: 0xf4f4ee });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd9b29a });
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x242424 });
    const black = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const materials = [woolMat, skinMat, hoofMat, black];

    // Big fluffy wool body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.84, 1.34), woolMat);
    body.position.set(0, 0.96, 0);
    g.add(body);

    // Head Group (face toward +z so rotation.y = yaw matches movement)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.28, 0.74);

    // Pink / Skin sheep face
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.42), skinMat);
    headGroup.add(face);

    // Wool cap on head top/back
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.38), woolMat);
    cap.position.set(0, 0.16, 0.04);
    headGroup.add(cap);

    // Ears
    const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.16), skinMat);
    ear1.position.set(-0.21, 0.06, 0.06);
    headGroup.add(ear1);
    const ear2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.16), skinMat);
    ear2.position.set(0.21, 0.06, 0.06);
    headGroup.add(ear2);

    // Eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    eye1.position.set(-0.16, 0.04, -0.15);
    headGroup.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    eye2.position.set(0.16, 0.04, -0.15);
    headGroup.add(eye2);

    g.add(headGroup);

    // 4 Legs with wool shoulders
    const legs: THREE.Group[] = [];
    const legCoords = [
      [-0.28, -0.42],
      [0.28, -0.42],
      [-0.28, 0.42],
      [0.28, 0.42],
    ];

    for (const [lx, lz] of legCoords) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.62, lz);

      const woolUpper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), woolMat);
      woolUpper.position.set(0, -0.12, 0);
      legGroup.add(woolUpper);

      const skinLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.18), skinMat);
      skinLeg.position.set(0, -0.38, 0);
      legGroup.add(skinLeg);

      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.08, 0.19), hoofMat);
      hoof.position.set(0, -0.58, 0);
      legGroup.add(hoof);

      g.add(legGroup);
      legs.push(legGroup);
    }

    g.userData = { headGroup, legs, materials, origColors: materials.map((m) => m.color.getHex()) };
    return g;
  }

  private createPigModel(): THREE.Group {
    const g = new THREE.Group();
    const pigPink = new THREE.MeshLambertMaterial({ color: 0xf29090 });
    const snoutPink = new THREE.MeshLambertMaterial({ color: 0xd96f72 });
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x3d2729 });
    const black = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const materials = [pigPink, snoutPink, hoofMat, black];

    // Pig body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.72, 1.25), pigPink);
    body.position.set(0, 0.78, 0);
    g.add(body);

    // Head Group (face toward +z so rotation.y = yaw matches movement)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.98, 0.72);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.44), pigPink);
    headGroup.add(head);

    // Distinct Protruding Pig Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.15), snoutPink);
    snout.position.set(0, -0.07, -0.27);
    headGroup.add(snout);

    // Nostrils
    const nostril1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), black);
    nostril1.position.set(-0.07, -0.07, -0.35);
    headGroup.add(nostril1);
    const nostril2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), black);
    nostril2.position.set(0.07, -0.07, -0.35);
    headGroup.add(nostril2);

    // Eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    eye1.position.set(-0.21, 0.06, -0.12);
    headGroup.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), black);
    eye2.position.set(0.21, 0.06, -0.12);
    headGroup.add(eye2);

    g.add(headGroup);

    // 4 Short Pink Legs
    const legs: THREE.Group[] = [];
    const legCoords = [
      [-0.26, -0.38],
      [0.26, -0.38],
      [-0.26, 0.38],
      [0.26, 0.38],
    ];

    for (const [lx, lz] of legCoords) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.48, lz);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.48, 0.2), pigPink);
      leg.position.set(0, -0.24, 0);
      legGroup.add(leg);

      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.08, 0.21), hoofMat);
      hoof.position.set(0, -0.46, 0);
      legGroup.add(hoof);

      g.add(legGroup);
      legs.push(legGroup);
    }

    g.userData = { headGroup, legs, materials, origColors: materials.map((m) => m.color.getHex()) };
    return g;
  }

  private createChickenModel(): THREE.Group {
    const g = new THREE.Group();
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 });
    const wattleMat = new THREE.MeshLambertMaterial({ color: 0xd02525 });
    const footMat = new THREE.MeshLambertMaterial({ color: 0xcca020 });
    const black = new THREE.MeshLambertMaterial({ color: 0x111111 });

    const materials = [whiteMat, beakMat, wattleMat, footMat, black];

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.48), whiteMat);
    body.position.set(0, 0.48, 0);
    g.add(body);

    // Wings
    const wing1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.32), whiteMat);
    wing1.position.set(-0.21, 0.48, 0);
    g.add(wing1);
    const wing2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.32), whiteMat);
    wing2.position.set(0.21, 0.48, 0);
    g.add(wing2);

    // Head Group (face toward +z so rotation.y = yaw matches movement)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.72, 0.26);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.2), whiteMat);
    headGroup.add(head);

    // Face details point toward +z, matching the mob yaw and movement direction.
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.14), beakMat);
    beak.position.set(0, -0.04, 0.15);
    headGroup.add(beak);

    // Red wattle
    const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), wattleMat);
    wattle.position.set(0, -0.12, 0.1);
    headGroup.add(wattle);

    // Eyes
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), black);
    eye1.position.set(-0.1, 0.06, 0.07);
    headGroup.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), black);
    eye2.position.set(0.1, 0.06, 0.07);
    headGroup.add(eye2);

    g.add(headGroup);

    // 2 Yellow Legs
    const legs: THREE.Group[] = [];
    for (const lx of [-0.09, 0.09]) {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.31, 0);

      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.05), footMat);
      leg.position.set(0, -0.14, 0);
      legGroup.add(leg);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.14), footMat);
      foot.position.set(0, -0.27, 0.03);
      legGroup.add(foot);

      g.add(legGroup);
      legs.push(legGroup);
    }

    g.userData = { headGroup, legs, wings: [wing1, wing2], materials, origColors: materials.map((m) => m.color.getHex()) };
    return g;
  }

  // ================= MOB SPAWNING, AI & COMBAT =================
  public spawnMobs(targetCount = 14) {
    const mobTypes = [MobType.COW, MobType.SHEEP, MobType.PIG, MobType.CHICKEN];

    for (let i = 0; i < targetCount; i++) {
      const x = Math.floor(8 + Math.random() * (SX - 16));
      const z = Math.floor(8 + Math.random() * (SZ - 16));
      const topY = this.world.getTopSolid(x, z);

      if (topY <= 0 || topY >= SY - 2) continue;
      const b = this.world.getBlock(x, topY, z);
      if (b !== BlockType.GRASS) continue;

      const type = mobTypes[Math.floor(Math.random() * mobTypes.length)];
      let mesh: THREE.Group;
      let hp = 10;

      if (type === MobType.COW) {
        mesh = this.createCowModel();
        hp = 10;
      } else if (type === MobType.SHEEP) {
        mesh = this.createSheepModel();
        hp = 8;
      } else if (type === MobType.PIG) {
        mesh = this.createPigModel();
        hp = 10;
      } else {
        mesh = this.createChickenModel();
        hp = 4;
      }

      const posX = x + 0.5;
      const posY = topY + 1.0;
      const posZ = z + 0.5;
      mesh.position.set(posX, posY, posZ);
      this.scene.add(mesh);

      const mob: MobEntity = {
        id: `mob_${Date.now()}_${i}`,
        type,
        mesh,
        pos: { x: posX, y: posY, z: posZ },
        vel: { x: 0, y: 0, z: 0 },
        yaw: Math.random() * Math.PI * 2,
        hp,
        maxHp: hp,
        hurtTimer: 0,
        wanderTimer: 2 + Math.random() * 4,
        soundTimer: 6 + Math.random() * 16,
        walkPhase: Math.random() * 10,
        isPanicking: false,
        panicTimer: 0,
        woolAvailable: type === MobType.SHEEP,
        woolRegrowTimer: 0,
      };

      this.mobs.push(mob);
    }
  }

  private updateMobs(dt: number) {
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];

      if (mob.type === MobType.SHEEP && mob.woolAvailable === false) {
        mob.woolRegrowTimer = Math.max(0, (mob.woolRegrowTimer || 0) - dt);
        if (mob.woolRegrowTimer <= 0) { mob.woolAvailable = true; mob.mesh.userData.woolParts?.forEach((m: THREE.Object3D) => { m.visible = true; }); }
      }
      // Hurt timer & red damage flash
      if (mob.hurtTimer > 0) {
        mob.hurtTimer -= dt;
        const flash = mob.hurtTimer > 0;
        const ud = mob.mesh.userData;
        if (ud?.materials && ud?.origColors) {
          for (let m = 0; m < ud.materials.length; m++) {
            ud.materials[m].color.setHex(flash ? 0xff4444 : ud.origColors[m]);
          }
        }
      }

      // Panic timer
      if (mob.isPanicking) {
        mob.panicTimer -= dt;
        if (mob.panicTimer <= 0) {
          mob.isPanicking = false;
        }
      }

      // Ambient sounds
      mob.soundTimer -= dt;
      if (mob.soundTimer <= 0) {
        mob.soundTimer = 12 + Math.random() * 22;
        const dist = Math.hypot(mob.pos.x - this.pos.x, mob.pos.y - this.pos.y, mob.pos.z - this.pos.z);
        if (dist < 20) {
          if (mob.type === MobType.COW) Sound.cowMoo();
          else if (mob.type === MobType.SHEEP) Sound.sheepBaa();
          else if (mob.type === MobType.PIG) Sound.pigOink();
          else if (mob.type === MobType.CHICKEN) Sound.chickenCluck();
        }
      }

      // Wander / Movement AI
      mob.wanderTimer -= dt;
      if (mob.wanderTimer <= 0 && !mob.isPanicking) {
        mob.wanderTimer = 2.5 + Math.random() * 4.5;
        if (Math.random() < 0.45) {
          mob.vel.x = 0;
          mob.vel.z = 0;
        } else {
          mob.yaw = Math.random() * Math.PI * 2;
        }
      }

      let speed = mob.type === MobType.CHICKEN ? 1.4 : 1.6;
      if (mob.isPanicking) speed *= 2.6;

      const isMoving =
        mob.isPanicking ||
        (mob.wanderTimer > 1.2 && (Math.abs(mob.vel.x) > 0.05 || Math.abs(mob.vel.z) > 0.05 || Math.random() < 0.7));

      // Mob head/face is positioned on the +z side of the mesh group now
      // (see headGroup.position.set(0, y, +z) in each create*Model()).
      // Three.js: rotation.y = 0 means mesh faces +z (local +z = world +z).
      // So at yaw=0 the mob moves toward +z and looks toward +z. Good.
      if (isMoving) {
        mob.vel.x = Math.sin(mob.yaw) * speed;
        mob.vel.z = Math.cos(mob.yaw) * speed;
        mob.walkPhase += dt * (mob.isPanicking ? 18 : 8);
      } else {
        mob.vel.x = 0;
        mob.vel.z = 0;
      }

      // Gravity
      if (mob.type === MobType.CHICKEN) {
        mob.vel.y = Math.max(-2.5, mob.vel.y - 12 * dt); // Flapping slow fall
      } else {
        mob.vel.y = Math.max(-26, mob.vel.y - 24 * dt);
      }

      // Terrain collision & jump over 1-block steps
      const nextX = mob.pos.x + mob.vel.x * dt;
      const nextZ = mob.pos.z + mob.vel.z * dt;
      const curY = Math.floor(mob.pos.y);

      if (inBounds(Math.floor(nextX), curY, Math.floor(mob.pos.z))) {
        const blk = this.world.getBlock(Math.floor(nextX), curY, Math.floor(mob.pos.z));
        if (blk !== BlockType.AIR && blk !== BlockType.TORCH) {
          const above = this.world.getBlock(Math.floor(nextX), curY + 1, Math.floor(mob.pos.z));
          if (above === BlockType.AIR || above === BlockType.TORCH) {
            mob.vel.y = 5.2; // hop up 1 block!
          } else {
            mob.yaw += Math.PI * 0.75;
          }
        } else {
          mob.pos.x = nextX;
        }
      }

      if (inBounds(Math.floor(mob.pos.x), curY, Math.floor(nextZ))) {
        const blk = this.world.getBlock(Math.floor(mob.pos.x), curY, Math.floor(nextZ));
        if (blk !== BlockType.AIR && blk !== BlockType.TORCH) {
          const above = this.world.getBlock(Math.floor(mob.pos.x), curY + 1, Math.floor(nextZ));
          if (above === BlockType.AIR || above === BlockType.TORCH) {
            mob.vel.y = 5.2;
          } else {
            mob.yaw += Math.PI * 0.75;
          }
        } else {
          mob.pos.z = nextZ;
        }
      }

      // Y Movement & ground landing
      mob.pos.y += mob.vel.y * dt;
      const groundY = this.world.getTopSolid(Math.floor(mob.pos.x), Math.floor(mob.pos.z));
      if (mob.pos.y < groundY + 1.0) {
        mob.pos.y = groundY + 1.0;
        mob.vel.y = 0;
      }

      // Update mesh position and rotation
      mob.mesh.position.set(mob.pos.x, mob.pos.y, mob.pos.z);
      mob.mesh.rotation.y = mob.yaw;

      // Limb swing animation
      const ud = mob.mesh.userData;
      if (ud?.legs && ud.legs.length >= 2) {
        const swing = Math.sin(mob.walkPhase) * 0.55;
        if (ud.legs.length === 4) {
          ud.legs[0].rotation.x = swing;
          ud.legs[1].rotation.x = -swing;
          ud.legs[2].rotation.x = -swing;
          ud.legs[3].rotation.x = swing;
        } else if (ud.legs.length === 2) {
          ud.legs[0].rotation.x = swing;
          ud.legs[1].rotation.x = -swing;
        }
      }

      // Chicken wing flapping
      if (mob.type === MobType.CHICKEN && ud?.wings) {
        const flap = isMoving || mob.vel.y < -0.1 ? Math.sin(performance.now() * 0.03) * 0.6 : 0;
        ud.wings[0].rotation.z = -flap;
        ud.wings[1].rotation.z = flap;
      }
    }
  }

  private raycastMob(
    eye: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    maxDist: number
  ): MobEntity | null {
    let closestMob: MobEntity | null = null;
    let closestDist = maxDist;

    for (const mob of this.mobs) {
      const dx = mob.pos.x - eye.x;
      const dy = mob.pos.y + 0.6 - eye.y;
      const dz = mob.pos.z - eye.z;

      const proj = dx * dir.x + dy * dir.y + dz * dir.z;
      if (proj <= 0.2 || proj > closestDist) continue;

      const perpX = dx - proj * dir.x;
      const perpY = dy - proj * dir.y;
      const perpZ = dz - proj * dir.z;
      const perpDistSq = perpX * perpX + perpY * perpY + perpZ * perpZ;

      const radius = mob.type === MobType.CHICKEN ? 0.45 : 0.85;
      if (perpDistSq < radius * radius) {
        closestDist = proj;
        closestMob = mob;
      }
    }
    return closestMob;
  }

  private attackMob(mob: MobEntity, dir: { x: number; y: number; z: number }) {
    const currentItem = this.inventory[this.selectedSlot];
    const def = currentItem ? ITEM_DEFS[currentItem.id] : null;

    let damage = 2; // Bare hand
    if (this.gameMode === 'creative') {
      damage = 25;
    } else if (def?.tool?.damage) {
      damage = def.tool.damage;
    }

    mob.hp -= damage;
    mob.hurtTimer = 0.28;
    Sound.mobHurt();

    // Knockback - yaw points the mob AWAY from the player (face them fleeing).
    // Velocity is in the same direction the mob will walk next frame.
    mob.isPanicking = true;
    mob.panicTimer = 3.2;
    mob.yaw = Math.atan2(mob.pos.x - this.pos.x, mob.pos.z - this.pos.z);
    mob.vel.x = Math.sin(mob.yaw) * 6;
    mob.vel.y = 4.0;
    mob.vel.z = Math.cos(mob.yaw) * 6;

    // Check Mob Death
    if (mob.hp <= 0) {
      // White smoke death puff
      for (let p = 0; p < 12; p++) {
        const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(mob.pos.x, mob.pos.y + 0.5, mob.pos.z);
        this.scene.add(mesh);
        this.particles.push({
          mesh,
          vel: {
            x: (Math.random() - 0.5) * 3,
            y: 1.5 + Math.random() * 2,
            z: (Math.random() - 0.5) * 3,
          },
          life: 0,
          maxLife: 0.4 + Math.random() * 0.3,
        });
      }

      // Authentic Minecraft mob drops & XP
      if (mob.type === MobType.COW) {
        const beefCount = Math.floor(1 + Math.random() * 3); // 1-3
        const leatherCount = Math.floor(Math.random() * 3); // 0-2
        this.spawnDrop(mob.pos.x, mob.pos.y + 0.5, mob.pos.z, ItemType.RAW_BEEF, beefCount);
        if (leatherCount > 0) {
          this.spawnDrop(mob.pos.x, mob.pos.y + 0.5, mob.pos.z, ItemType.LEATHER, leatherCount);
        }
        this.addXP(Math.floor(1 + Math.random() * 3));
        this.onToast?.(`İnek kesildi! +${beefCount} Çiğ Sığır Eti`);
      } else if (mob.type === MobType.SHEEP) {
        const muttonCount = Math.floor(1 + Math.random() * 2); // 1-2
        this.spawnDrop(mob.pos.x, mob.pos.y + 0.5, mob.pos.z, ItemType.WHITE_WOOL, 1);
        this.spawnDrop(mob.pos.x, mob.pos.y + 0.5, mob.pos.z, ItemType.RAW_MUTTON, muttonCount);
        this.addXP(Math.floor(1 + Math.random() * 3));
        this.onToast?.(`Koyun kesildi! +1 Beyaz Yün, +${muttonCount} Çiğ Koyun Eti`);
      } else if (mob.type === MobType.PIG) {
        const porkCount = Math.floor(1 + Math.random() * 3); // 1-3
        this.spawnDrop(mob.pos.x, mob.pos.y + 0.5, mob.pos.z, ItemType.RAW_PORKCHOP, porkCount);
        this.addXP(Math.floor(1 + Math.random() * 3));
        this.onToast?.(`Domuz kesildi! +${porkCount} Çiğ Domuz Eti`);
      } else if (mob.type === MobType.CHICKEN) {
        const featherCount = Math.floor(Math.random() * 3); // 0-2
        this.spawnDrop(mob.pos.x, mob.pos.y + 0.5, mob.pos.z, ItemType.RAW_CHICKEN, 1);
        if (featherCount > 0) {
          this.spawnDrop(mob.pos.x, mob.pos.y + 0.5, mob.pos.z, ItemType.FEATHER, featherCount);
        }
        this.addXP(Math.floor(1 + Math.random() * 3));
        this.onToast?.(`Tavuk kesildi! +1 Çiğ Tavuk`);
      }

      this.scene.remove(mob.mesh);
      this.mobs = this.mobs.filter((m) => m.id !== mob.id);
    }
  }

  // ================= DAY / NIGHT CYCLE =================
  private updateDayNight(dt: number) {
    this.timeOfDay = (this.timeOfDay + dt / this.dayLength) % 1.0;

    // Angle: 0 = noon, 0.25 = sunset, 0.5 = midnight, 0.75 = sunrise
    const angle = this.timeOfDay * Math.PI * 2;
    const sunDist = 140;

    const sunX = Math.sin(angle) * sunDist;
    const sunY = Math.cos(angle) * sunDist;
    const sunZ = -Math.cos(angle) * 80;

    this.sunMesh.position.set(this.pos.x + sunX, this.pos.y + sunY, this.pos.z + sunZ);
    this.moonMesh.position.set(this.pos.x - sunX, this.pos.y - sunY, this.pos.z - sunZ);
    this.starsGroup.position.set(this.pos.x, this.pos.y, this.pos.z);

    this.sunLight.position.set(this.pos.x + sunX, this.pos.y + sunY, this.pos.z + sunZ);

    // Sky colors based on sun elevation
    const sunElev = Math.cos(angle); // 1 = noon, -1 = midnight
    let skyR = 0.53,
      skyG = 0.81,
      skyB = 0.92;
    let lightIntensity = 0.7;

    if (sunElev > 0.2) {
      // Day
      skyR = 0.53;
      skyG = 0.81;
      skyB = 0.92;
      lightIntensity = 0.75;
      this.starsGroup.visible = false;
    } else if (sunElev > -0.2) {
      // Sunset / Sunrise
      const t = (sunElev + 0.2) / 0.4;
      skyR = THREE.MathUtils.lerp(0.12, 0.85, t);
      skyG = THREE.MathUtils.lerp(0.12, 0.55, t);
      skyB = THREE.MathUtils.lerp(0.22, 0.35, t);
      lightIntensity = THREE.MathUtils.lerp(0.2, 0.6, t);
      this.starsGroup.visible = true;
    } else {
      // Night
      skyR = 0.04;
      skyG = 0.05;
      skyB = 0.1;
      lightIntensity = 0.15;
      this.starsGroup.visible = true;
    }

    const skyColor = new THREE.Color(skyR, skyG, skyB);
    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color = skyColor;
    }
    this.hemiLight.color.setRGB(skyR + 0.3, skyG + 0.3, skyB + 0.3);
    this.hemiLight.intensity = Math.max(0.25, lightIntensity * 0.9);
    this.sunLight.intensity = Math.max(0.05, Math.max(0, sunElev) * 0.7);
  }

  // ================= PHYSICS & PLAYER MOVEMENT =================
  private recoverFromBlockCollision() {
    if (!this.checkCollision(this.pos.x, this.pos.y, this.pos.z)) return;
    const origin = { ...this.pos };
    const directions = [[0, 0], [0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42], [0.72, 0.72], [-0.72, 0.72], [0.72, -0.72], [-0.72, -0.72]];
    for (const yOffset of [0, 0.25, 0.55, 0.9, 1.3]) {
      for (const [dx, dz] of directions) {
        const candidate = { x: origin.x + dx, y: origin.y + yOffset, z: origin.z + dz };
        if (candidate.x < this.PW + 0.1 || candidate.x > SX - this.PW - 0.1 || candidate.z < this.PW + 0.1 || candidate.z > SZ - this.PW - 0.1) continue;
        if (!this.checkCollision(candidate.x, candidate.y, candidate.z)) {
          this.pos = candidate;
          this.vel.y = 0;
          this.onGround = yOffset === 0;
          return;
        }
      }
    }
    // Son çare: bulunduğu sütunun güvenli üstüne çıkar.
    const top = this.world.getTopSolid(Math.floor(origin.x), Math.floor(origin.z));
    this.pos = { x: origin.x, y: Math.max(origin.y, top + 1.05), z: origin.z };
  }
  private checkCollision(px: number, py: number, pz: number): boolean {
    const x0 = Math.floor(px - this.PW);
    const x1 = Math.floor(px + this.PW);
    const y0 = Math.floor(py);
    const y1 = Math.floor(py + this.PH - 0.001);
    const z0 = Math.floor(pz - this.PW);
    const z1 = Math.floor(pz + this.PW);

    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          const b = this.world.getBlockPhys(x, y, z);
          if (b !== BlockType.AIR && b !== BlockType.TORCH) return true;
        }
      }
    }
    return false;
  }

  private updatePlayer(dt: number) {
    if (this.isDead) return;

    this.isSneaking = this.isActionActive('sneak') && this.onGround && !this.isFlying;
    this.isSprinting =
      (this.isActionActive('sprint') || !!(this.keys['ControlLeft'] || this.keys['ControlRight'])) &&
      !this.isSneaking &&
      this.hunger > 6;

    // Movement Input
    let mx = 0,
      mz = 0;
    if (this.isActionActive('forward')) mz -= 1;
    if (this.isActionActive('backward')) mz += 1;
    if (this.isActionActive('left')) mx -= 1;
    if (this.isActionActive('right')) mx += 1;

    const len = Math.hypot(mx, mz);
    if (len > 0) {
      mx /= len;
      mz /= len;
    }

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const wishX = mx * cos + mz * sin;
    const wishZ = -mx * sin + mz * cos;

    // Creative Flying Mode
    if (this.isFlying) {
      let speed = 10;
      if (this.isActionActive('jump')) this.pos.y += speed * dt;
      if (this.isActionActive('sneak')) this.pos.y -= speed * dt;
      this.pos.x += wishX * speed * dt;
      this.pos.z += wishZ * speed * dt;
      this.vel = { x: 0, y: 0, z: 0 };
      return;
    }

    let speed = 4.35;
    if (this.isSneaking) speed = 1.35;
    else if (this.isSprinting) speed = 5.75;

    const wishLen = Math.hypot(wishX, wishZ);
    const targetVx = wishLen > 0 ? (wishX / wishLen) * speed : 0;
    const targetVz = wishLen > 0 ? (wishZ / wishLen) * speed : 0;

    if (this.onGround) {
      this.vel.x = targetVx;
      this.vel.z = targetVz;
    } else {
      this.vel.x += (targetVx - this.vel.x) * Math.min(1, dt * 2.5);
      this.vel.z += (targetVz - this.vel.z) * Math.min(1, dt * 2.5);
    }

    // Jump
    if (this.isActionActive('jump') && this.onGround) {
      this.vel.y = 8.4;
      this.onGround = false;
      Sound.step(this.getCurrentSurfaceMaterial());
      this.hungerExhaustion += 0.2;
    }

    // Gravity
    this.vel.y -= 26 * dt;
    if (this.vel.y < -48) this.vel.y = -48;

    // Y Axis Collision
    const oldY = this.pos.y;
    this.pos.y += this.vel.y * dt;
    if (this.checkCollision(this.pos.x, this.pos.y, this.pos.z)) {
      if (this.vel.y < 0) {
        this.pos.y = Math.floor(this.pos.y) + 1;
        while (this.checkCollision(this.pos.x, this.pos.y, this.pos.z)) this.pos.y += 0.01;

        // Fall damage calculation
        const fallDistance = this.fallStartY - this.pos.y;
        if (fallDistance > 3.5 && this.gameMode === 'survival') {
          const dmg = Math.floor(fallDistance - 3);
          this.applyDamage(dmg, 'Düşerek öldün');
        }
        this.onGround = true;
        this.fallStartY = this.pos.y;
        if (fallDistance > 0.8) Sound.step(this.getCurrentSurfaceMaterial());
      } else {
        this.pos.y = oldY;
        while (this.checkCollision(this.pos.x, this.pos.y, this.pos.z)) this.pos.y -= 0.01;
      }
      this.vel.y = 0;
    } else {
      if (this.onGround) this.fallStartY = this.pos.y;
      this.onGround = false;
      if (this.vel.y > 0) this.fallStartY = this.pos.y;
    }

    // Sneaking edge protection (bridging without falling off!)
    let nextX = this.pos.x + this.vel.x * dt;
    let nextZ = this.pos.z + this.vel.z * dt;
    if (this.isSneaking && this.onGround) {
      if (!this.checkCollision(nextX, this.pos.y - 0.5, this.pos.z)) {
        nextX = this.pos.x;
        this.vel.x = 0;
      }
      if (!this.checkCollision(this.pos.x, this.pos.y - 0.5, nextZ)) {
        nextZ = this.pos.z;
        this.vel.z = 0;
      }
    }

    // X Axis Collision
    this.pos.x = nextX;
    if (this.checkCollision(this.pos.x, this.pos.y, this.pos.z)) {
      this.pos.x -= this.vel.x * dt;
      this.vel.x = 0;
    }

    // Z Axis Collision
    this.pos.z = nextZ;
    if (this.checkCollision(this.pos.x, this.pos.y, this.pos.z)) {
      this.pos.z -= this.vel.z * dt;
      this.vel.z = 0;
    }

    // World Bounding box limits
    this.pos.x = Math.max(this.PW + 0.1, Math.min(SX - this.PW - 0.1, this.pos.x));
    this.pos.z = Math.max(this.PW + 0.1, Math.min(SZ - this.PW - 0.1, this.pos.z));

    // Void death
    if (this.pos.y < -10) {
      this.applyDamage(50, 'Boşluğa düştün');
      this.pos.y = SY + 5;
    }

    // Footsteps
    const horizontalSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && horizontalSpeed > 0.4) {
      this.stepDistance += horizontalSpeed * dt;
      this.walkPhase += horizontalSpeed * dt * 2.4;
      if (this.stepDistance > (this.isSprinting ? 1.7 : 2.1)) {
        this.stepDistance = 0;
        Sound.step(this.getCurrentSurfaceMaterial());
      }
    }

    // Survival Hunger & Health Regen
    if (this.gameMode === 'survival') {
      const exhaustionRate = horizontalSpeed > 0.5 ? (this.isSprinting ? 0.16 : 0.08) : 0.003;
      this.hungerExhaustion += exhaustionRate * dt;
      if (this.hungerExhaustion >= 4.0) {
        this.hungerExhaustion -= 4.0;
        if (this.hunger > 0) {
          this.hunger--;
          this.onHUDUpdate?.();
        }
      }

      // Health regeneration when well fed
      if (this.hunger >= 18 && this.hp < this.maxHp) {
        this.regenTimer += dt;
        if (this.regenTimer >= 4.0) {
          this.regenTimer = 0;
          this.hp = Math.min(this.maxHp, this.hp + 1);
          this.hungerExhaustion += 1.5;
          this.onHUDUpdate?.();
        }
      } else {
        this.regenTimer = 0;
      }
      // Starvation damage when hunger is empty
      if (this.hunger <= 0) {
        this.starveTimer += dt;
        if (this.starveTimer >= 4.0) {
          this.starveTimer = 0;
          if (this.hp > 1) {
            this.applyDamage(1, 'Açlıktan öldün');
          }
        }
      }
    }
  }

  public applyDamage(amount: number, cause = 'Öldün') {
    if (this.gameMode === 'creative' || this.isDead) return;

    // Armor defense reduction
    let defensePoints = 0;
    this.armor.forEach((a) => {
      if (a) {
        const def = ITEM_DEFS[a.id]?.armor;
        if (def) defensePoints += def.defense;
      }
    });

    const damageMultiplier = Math.max(0.2, 1 - defensePoints * 0.04);
    const finalDamage = Math.max(1, Math.round(amount * damageMultiplier));

    this.hp -= finalDamage;
    Sound.hit();
    this.damageFlashTimer = 0.4;
    this.damageFlashHudClock = 0;
    this.onHUDUpdate?.();

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.onUIStateChange?.('dead');
      if (this.onToast) this.onToast(cause);
    }
  }

  public handleNetworkDeath(reason = 'Öldün!') {
    this.hp = 0;
    this.isDead = true;
    this.donkey3P.rotation.z = -Math.PI / 2;
    this.damageFlashTimer = 0;
    this.exitPointerLock();
    this.onToast?.(reason);
    this.onUIStateChange?.('dead');
    this.onHUDUpdate?.();
  }
  public respawnAt(spawn?: { x: number; y: number; z: number }) {
    this.isDead = false;
    this.hp = this.maxHp;
    this.hunger = this.maxHunger;
    this.donkey3P.rotation.z = 0;
    this.vel = { x: 0, y: 0, z: 0 };
    if (spawn && Number.isFinite(spawn.x) && Number.isFinite(spawn.y) && Number.isFinite(spawn.z)) {
      this.pos = { x: spawn.x, y: spawn.y, z: spawn.z };
    } else {
      this.spawnDefaultPlayer();
    }
    this.onHUDUpdate?.();
  }
  public respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.hunger = this.maxHunger;
    this.spawnDefaultPlayer();
    this.onHUDUpdate?.();
  }

  private getCurrentSurfaceMaterial(): SoundMaterial {
    const b = this.world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y - 0.2), Math.floor(this.pos.z));
    if (b === BlockType.GRASS || b === BlockType.OAK_LEAVES) return 'grass';
    if (b === BlockType.OAK_LOG || b === BlockType.OAK_PLANKS || b === BlockType.CRAFTING_TABLE || b === BlockType.CHEST)
      return 'wood';
    if (b === BlockType.SAND) return 'sand';
    if (b === BlockType.GLASS) return 'glass';
    return 'stone';
  }

  // ================= RAYCASTING, MINING & PLACING =================
  public getEyePos(): { x: number; y: number; z: number } {
    return {
      x: this.pos.x,
      y: this.pos.y + (this.isSneaking ? this.SNEAK_EYE : this.EYE_HEIGHT),
      z: this.pos.z,
    };
  }

  public getLookDir(): { x: number; y: number; z: number } {
    const cp = Math.cos(this.pitch);
    return {
      x: -Math.sin(this.yaw) * cp,
      y: Math.sin(this.pitch),
      z: -Math.cos(this.yaw) * cp,
    };
  }

  private updateInteraction(dt: number) {
    if (this.isDead || this.isPaused) return;

    const eye = this.getEyePos();
    const dir = this.getLookDir();
    const hit = this.world.raycast(eye, dir, 5.2);

    // Update Highlight wireframe
    if (hit) {
      this.highlightBox.visible = true;
      this.highlightBox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    } else {
      this.highlightBox.visible = false;
    }

    // Place cooldown
    if (this.placeCooldown > 0) this.placeCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Online player melee: client selects a visible candidate, server validates the capsule hitbox.
    if (this.mouseLeft && this.attackCooldown <= 0 && this.onAttackPlayer) {
      const targetId = this.getRemoteTargetId();
      if (targetId) {
        const currentItem = this.inventory[this.selectedSlot];
        const itemDef = currentItem ? ITEM_DEFS[currentItem.id] : null;
        const weaponType = itemDef?.tool?.type || 'fist';
        this.onAttackPlayer({ targetId, weaponType });
        this.attackCooldown = 0.5;
        this.swingTimer = 0;
        this.breakingBlock = null;
        this.breakProgress = 0;
        this.crackMesh.visible = false;
        return;
      }
    }
    // Sheep shearing uses the same reliable capsule raycast as melee.
    if (this.mouseLeft && this.attackCooldown <= 0) {
      const hitMob = this.raycastMob(eye, dir, 4.4);
      const heldShears = this.inventory[this.selectedSlot]?.id === ItemType.SHEARS;
      if (hitMob && hitMob.type === MobType.SHEEP && heldShears && hitMob.woolAvailable !== false) {
        hitMob.woolAvailable = false;
        hitMob.woolRegrowTimer = 60;
        hitMob.hurtTimer = 0.22;
        this.spawnDrop(hitMob.pos.x, hitMob.pos.y + 0.45, hitMob.pos.z, ItemType.WHITE_WOOL, 1 + Math.floor(Math.random() * 3));
        const shears = this.inventory[this.selectedSlot];
        if (shears?.durability !== undefined) { shears.durability--; if (shears.durability <= 0) this.inventory[this.selectedSlot] = null; }
        hitMob.mesh.userData.woolParts?.forEach((m: THREE.Object3D) => { m.visible = false; });
        this.onHUDUpdate?.(); this.onToast?.('Koyun kırkıldı: yün düştü.');
        this.attackCooldown = 0.45; this.swingTimer = 0; return;
      }
      if (hitMob) {
        this.attackMob(hitMob, dir);
        this.attackCooldown = 0.35;
        this.swingTimer = 0;
        this.breakingBlock = null;
        this.breakProgress = 0;
        this.crackMesh.visible = false;
        return;
      }
    }

    // Mining / Breaking
    if (this.mouseLeft && hit) {
      const bDef = BLOCK_DEFS[hit.id];
      if (bDef && bDef.hardness !== Infinity) {
        if (!this.breakingBlock || this.breakingBlock.x !== hit.x || this.breakingBlock.y !== hit.y || this.breakingBlock.z !== hit.z) {
          this.breakingBlock = { x: hit.x, y: hit.y, z: hit.z };
          this.breakProgress = 0;
        }

        // Minecraft-style break timing:
        // correct tool/hand: hardness * 30 ticks; wrong tool: hardness * 100 ticks.
        // With 20 ticks per second this becomes hardness*1.5s or hardness*5s.
        let toolSpeed = 1.0;
        let canHarvest = false;
        const currentItem = this.inventory[this.selectedSlot];
        const itemDef = currentItem ? ITEM_DEFS[currentItem.id] : null;

        const handBreakable = [
          BlockType.GRASS, BlockType.DIRT, BlockType.SAND, BlockType.OAK_LEAVES,
          BlockType.WHITE_WOOL_BLOCK, BlockType.OAK_LOG, BlockType.OAK_PLANKS,
          BlockType.BED, BlockType.CRAFTING_TABLE, BlockType.CHEST,
        ].includes(hit.id);
        if (this.gameMode === 'creative') {
          toolSpeed = 100; // instant break
          canHarvest = true;
        } else if (itemDef?.tool && itemDef.tool.type === bDef.requiredTool) {
          toolSpeed = itemDef.tool.speed;
          canHarvest = true;
        } else if (handBreakable || bDef.requiredTool === 'none') {
          // Dirt, wood, wool and other naturally hand-breakable blocks keep their drops.
          toolSpeed = 1.0;
          canHarvest = true;
        }

        const timingFactor = canHarvest ? 1.5 : 5.0;
        this.breakProgress += (dt * toolSpeed) / (bDef.hardness * timingFactor);
        if (this.swingTimer < 0) this.swingTimer = 0;

        const stage = Math.min(9, Math.floor(this.breakProgress * 10));
        this.crackMesh.visible = true;
        this.crackMesh.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
        if (this.crackMesh.material instanceof THREE.MeshBasicMaterial) {
          this.crackMesh.material.map = crackTextures[stage];
          this.crackMesh.material.needsUpdate = true;
        }

        // Continual mining debris particles and crack sound for vivid feedback
        if (Math.random() < 0.35) {
          Sound.crumble();
          this.spawnBlockDebris(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, hit.id);
        }

        // Break completed!
        if (this.breakProgress >= 1.0) {
          this.breakBlock(hit);
          this.breakingBlock = null;
          this.breakProgress = 0;
          this.crackMesh.visible = false;
        }
      }
    } else {
      if (this.breakingBlock) {
        this.breakingBlock = null;
        this.breakProgress = 0;
        this.crackMesh.visible = false;
      }
    }

    // Food can be eaten in open air too; Minecraft does not require a block target.
    if (this.mouseRight && this.placeCooldown <= 0 && !hit) {
      const held = this.inventory[this.selectedSlot];
      const food = held ? ITEM_DEFS[held.id]?.food : null;
      if (held && food && (this.hunger < this.maxHunger || this.hp < this.maxHp)) {
        this.placeCooldown = 0.35;
        this.hunger = Math.min(this.maxHunger, this.hunger + food.foodPoints);
        this.hp = Math.min(this.maxHp, this.hp + food.healHp);
        held.count--; if (held.count <= 0) this.inventory[this.selectedSlot] = null;
        Sound.eat(); this.updateHeldItemModel(); this.onHUDUpdate?.();
        return;
      }
    }

    // Right Click (Place block or interact with Crafting Table / Furnace / Chest)
    if (this.mouseRight && this.placeCooldown <= 0 && hit) {
      this.placeCooldown = 0.25;

      // Check right click on interactive block
      if (!this.isSneaking) {
        if (hit.id === BlockType.CRAFTING_TABLE) {
          this.isGUIOpen = true;
          this.exitPointerLock();
          this.onUIStateChange?.('crafting_table');
          return;
        }
        if (hit.id === BlockType.FURNACE || hit.id === BlockType.FURNACE_LIT) {
          this.currentFurnacePos = { x: hit.x, y: hit.y, z: hit.z };
          this.isGUIOpen = true;
          this.exitPointerLock();
          this.onUIStateChange?.('furnace');
          return;
        }
        if (hit.id === BlockType.CHEST) {
          this.currentChestPos = { x: hit.x, y: hit.y, z: hit.z };
          this.isGUIOpen = true;
          this.exitPointerLock();
          Sound.chest();
          this.onUIStateChange?.('chest');
          return;
        }
      }

      // Bed interaction: sleep only at night, then advance to sunrise.
      if (hit.id === BlockType.BED) {
        if (this.timeOfDay >= 0.25 && this.timeOfDay <= 0.75) {
          this.timeOfDay = 0.76;
          this.onToast?.('Uyudun. Sabah oldu!');
          Sound.click();
        } else {
          this.onToast?.('Sadece gece uyuyabilirsin.');
        }
        return;
      }
      // Check food consumption
      const held = this.inventory[this.selectedSlot];
      if (held) {
        const itemDef = ITEM_DEFS[held.id];
        if (itemDef?.food && (this.hunger < this.maxHunger || this.hp < this.maxHp)) {
          this.hunger = Math.min(this.maxHunger, this.hunger + itemDef.food.foodPoints);
          this.hp = Math.min(this.maxHp, this.hp + itemDef.food.healHp);
          held.count--;
          if (held.count <= 0) this.inventory[this.selectedSlot] = null;
          Sound.eat();
          this.onHUDUpdate?.();
          return;
        }
      }

      // Place Block
      this.tryPlaceBlock(hit);
    }

    // Swing arm timer
    if (this.swingTimer >= 0) {
      this.swingTimer += dt;
      if (this.swingTimer > 0.3) this.swingTimer = -1;
    }
  }

  private breakBlock(hit: { x: number; y: number; z: number; nx: number; ny: number; nz: number; id: BlockType }) {
    const bDef = BLOCK_DEFS[hit.id];
    let mat: SoundMaterial = 'stone';
    if (hit.id === BlockType.GRASS || hit.id === BlockType.OAK_LEAVES) mat = 'grass';
    else if (hit.id === BlockType.OAK_LOG || hit.id === BlockType.OAK_PLANKS || hit.id === BlockType.CRAFTING_TABLE || hit.id === BlockType.CHEST)
      mat = 'wood';
    else if (hit.id === BlockType.SAND) mat = 'sand';
    else if (hit.id === BlockType.GLASS) mat = 'glass';

    Sound.breakBlock(mat);
    this.spawnBlockDebris(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, hit.id);

    // Determine drop item
    if (this.gameMode === 'survival') {
      const currentItem = this.inventory[this.selectedSlot];
      const itemDef = currentItem ? ITEM_DEFS[currentItem.id] : null;

      // Tool harvest requirement check
      let canHarvest = true;
      const handBreakable = [
        BlockType.GRASS, BlockType.DIRT, BlockType.SAND, BlockType.OAK_LEAVES,
        BlockType.WHITE_WOOL_BLOCK, BlockType.OAK_LOG, BlockType.OAK_PLANKS,
        BlockType.BED, BlockType.CRAFTING_TABLE, BlockType.CHEST,
      ].includes(hit.id);
      if (bDef.requiredTool !== 'none' && !handBreakable) {
        canHarvest = itemDef?.tool?.type === bDef.requiredTool && (itemDef.tool.harvestLevel ?? 0) >= bDef.minHarvestLevel;
      }

      if (bDef.drop && canHarvest) {
        const dropCount = bDef.dropCount || 1;
        const dropPos = this.findDropPosition(hit);
        this.spawnDrop(dropPos.x, dropPos.y, dropPos.z, bDef.drop, dropCount);
      }

      // Tool Durability reduction
      if (currentItem && itemDef?.tool) {
        if (currentItem.durability !== undefined) {
          currentItem.durability--;
          if (currentItem.durability <= 0) {
            this.inventory[this.selectedSlot] = null;
            Sound.breakBlock('wood');
          }
          this.onHUDUpdate?.();
        }
      }

      // Award XP for ores
      if (hit.id === BlockType.COAL_ORE) this.addXP(1);
      else if (hit.id === BlockType.DIAMOND_ORE) this.addXP(5);
    }

    this.world.setBlock(hit.x, hit.y, hit.z, BlockType.AIR);
    this.onBlockChanged?.({ x: hit.x, y: hit.y, z: hit.z, blockId: BlockType.AIR });
    this.rebuildVisibleWorld();
    this.rebuildTorchVisuals();
  }

  private tryPlaceBlock(hit: { x: number; y: number; z: number; nx: number; ny: number; nz: number }) {
    const held = this.inventory[this.selectedSlot];
    if (!held) return;

    // White wool is an inventory item but places as the real wool block.
    const placeId = held.id === ItemType.WHITE_WOOL ? BlockType.WHITE_WOOL_BLOCK : held.id;
    // Materials such as leather and feathers are not placeable blocks.
    if (!BLOCK_DEFS[placeId] || Number(placeId) >= 100) return;

    const px = hit.x + hit.nx;
    const py = hit.y + hit.ny;
    const pz = hit.z + hit.nz;

    if (!inBounds(px, py, pz)) return;
    if (this.world.getBlock(px, py, pz) !== BlockType.AIR) return;

    // Check collision with player
    const intersectsPlayer =
      px + 1 > this.pos.x - this.PW &&
      px < this.pos.x + this.PW &&
      py + 1 > this.pos.y &&
      py < this.pos.y + this.PH &&
      pz + 1 > this.pos.z - this.PW &&
      pz < this.pos.z + this.PW;

    if (intersectsPlayer && held.id !== BlockType.TORCH) return;

    // Place block in world
    this.world.setBlock(px, py, pz, placeId as BlockType);
    this.onBlockChanged?.({ x: px, y: py, z: pz, blockId: placeId as BlockType });
    this.rebuildVisibleWorld();
    this.rebuildTorchVisuals();

    let mat: SoundMaterial = 'stone';
    if (placeId === BlockType.OAK_LOG || placeId === BlockType.OAK_PLANKS || placeId === BlockType.CRAFTING_TABLE || placeId === BlockType.CHEST)
      mat = 'wood';
    Sound.placeBlock(mat);
    this.swingTimer = 0;

    if (this.gameMode === 'survival') {
      held.count--;
      if (held.count <= 0) this.inventory[this.selectedSlot] = null;
      this.onHUDUpdate?.();
    }
  }

  public addXP(amount: number) {
    this.xp += amount;
    const needed = (this.level + 1) * 7;
    if (this.xp >= needed) {
      this.xp -= needed;
      this.level++;
      Sound.levelUp();
      this.onToast?.(`Seviye Atladın: ${this.level}!`);
    }
    this.onHUDUpdate?.();
  }

  // ================= DROPS & PARTICLES =================
  private findDropPosition(hit: { x: number; y: number; z: number; nx: number; ny: number; nz: number }) {
    // Prefer the empty cell below the broken block so blocks broken under the player
    // do not launch their drops upward into the player's feet. Then try the hit face,
    // the four sides, and finally the cell above.
    const candidates = [
      { dx: 0, dy: -1, dz: 0 },
      { dx: hit.nx, dy: hit.ny, dz: hit.nz },
      { dx: 1, dy: 0, dz: 0 },
      { dx: -1, dy: 0, dz: 0 },
      { dx: 0, dy: 0, dz: 1 },
      { dx: 0, dy: 0, dz: -1 },
      { dx: 0, dy: 1, dz: 0 },
    ];
    const seen = new Set<string>();
    for (const c of candidates) {
      const key = `${c.dx},${c.dy},${c.dz}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const x = hit.x + c.dx;
      const y = hit.y + c.dy;
      const z = hit.z + c.dz;
      if (inBounds(x, y, z) && this.world.getBlockPhys(x, y, z) === BlockType.AIR) {
        return { x: x + 0.5, y: y + 0.22, z: z + 0.5 };
      }
    }
    // Fully enclosed fallback; the block has just become air, so this remains collectible.
    return { x: hit.x + 0.5, y: hit.y + 0.22, z: hit.z + 0.5 };
  }
  private createToolDrop(id: AnyItemId): THREE.Group | null {
    const def = ITEM_DEFS[id as number];
    if (!def?.tool) return null;
    const group = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.42, 0.045),
      new THREE.MeshLambertMaterial({ color: 0x704b24 })
    );
    group.add(handle);
    let headColor = 0x8a8a8a;
    if (def.tool.material === 'wood') headColor = 0x9a6b32;
    if (def.tool.material === 'iron') headColor = 0xd9d9d9;
    if (def.tool.material === 'diamond') headColor = 0x38ebf5;
    const headMat = new THREE.MeshLambertMaterial({ color: headColor });
    if (def.tool.type === 'pickaxe') {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.07), headMat);
      head.position.y = 0.21;
      group.add(head);
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.07), headMat);
      left.position.set(-0.13, 0.16, 0);
      left.rotation.z = -0.35;
      group.add(left);
      const right = left.clone();
      right.position.x = 0.13;
      right.rotation.z = 0.35;
      group.add(right);
    } else if (def.tool.type === 'axe') {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.07), headMat);
      head.position.set(-0.09, 0.2, 0);
      group.add(head);
    } else if (def.tool.type === 'shovel') {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.17, 0.06), headMat);
      head.position.y = 0.27;
      group.add(head);
    } else {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.05), headMat);
      blade.position.y = 0.25;
      group.add(blade);
    }
    group.rotation.set(0.25, 0.55, -0.25);
    return group;
  }
  private createTorchDrop(): THREE.Group {
    const group = new THREE.Group();
    const wood = new THREE.MeshLambertMaterial({ color: 0x70451f });
    const flame = new THREE.MeshLambertMaterial({ color: 0xff9b1a, emissive: 0xff5a00, emissiveIntensity: 0.7 });
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.3, 0.055), wood);
    stick.position.y = -0.05;
    group.add(stick);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.18, 5), flame);
    fire.position.y = 0.18;
    group.add(fire);
    return group;
  }
  private disposeDropObject(object: THREE.Object3D) {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material && mesh.material !== this.worldMaterial) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material.dispose());
      }
    });
  }
  private rebuildTorchVisuals() {
    this.torchGroup.clear();
    this.torchLights = [];
    for (let y = 0; y < SY; y++) {
      for (let z = 0; z < SZ; z++) {
        for (let x = 0; x < SX; x++) {
          if (this.world.getBlock(x, y, z) !== BlockType.TORCH) continue;
          const model = this.createTorchDrop();
          model.position.set(x + 0.5, y + 0.42, z + 0.5);
          this.torchGroup.add(model);
          const light = new THREE.PointLight(0xffa33a, 1.25, 7, 2);
          light.position.set(x + 0.5, y + 0.72, z + 0.5);
          this.torchGroup.add(light);
          this.torchLights.push(light);
        }
      }
    }
  }
  private updateTorchLights(dt: number) {
    this.torchTime += dt;
    const flicker = Math.sin(this.torchTime * 11.0) * 0.08 + Math.sin(this.torchTime * 23.0) * 0.04;
    for (const light of this.torchLights) { const dx = light.position.x - this.pos.x; const dz = light.position.z - this.pos.z; light.visible = dx * dx + dz * dz < this.renderDistance * this.renderDistance; if (light.visible) light.intensity = 1.25 + flicker; }
  }
  public spawnDrop(x: number, y: number, z: number, id: AnyItemId, count: number) {
    if (id === BlockType.TORCH) {
      const mesh = this.createTorchDrop();
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.drops.push({ id, count, mesh, vel: { x: (Math.random() - 0.5) * 0.45, y: 0.05, z: (Math.random() - 0.5) * 0.45 }, age: 0, baseY: null });
      return;
    }
    const toolMesh = this.createToolDrop(id);
    if (toolMesh) {
      toolMesh.position.set(x, y, z);
      this.scene.add(toolMesh);
      this.drops.push({ id, count, mesh: toolMesh, vel: { x: (Math.random() - 0.5) * 0.45, y: 0.05, z: (Math.random() - 0.5) * 0.45 }, age: 0, baseY: null });
      return;
    }
    const foodColors: Record<number, number> = {
      [ItemType.APPLE]: 0xd62929, [ItemType.BREAD]: 0xd8a14b, [ItemType.RAW_BEEF]: 0xa94b43,
      [ItemType.COOKED_STEAK]: 0x7b351f, [ItemType.RAW_PORKCHOP]: 0xe58b82, [ItemType.COOKED_PORKCHOP]: 0x9b4b31,
      [ItemType.RAW_MUTTON]: 0xd77b72, [ItemType.COOKED_MUTTON]: 0x8b4329, [ItemType.RAW_CHICKEN]: 0xe9b5a1,
      [ItemType.COOKED_CHICKEN]: 0xc98d5b, [ItemType.LEATHER]: 0x7b4a2d, [ItemType.FEATHER]: 0xf1f1e8,
      [ItemType.WHITE_WOOL]: 0xf4f4ee,
    };
    if (foodColors[id as number]) {
      const geo = id === ItemType.FEATHER ? new THREE.PlaneGeometry(0.32, 0.42) : new THREE.SphereGeometry(0.18, 8, 6);
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: foodColors[id as number] }));
      mesh.position.set(x, y, z); this.scene.add(mesh);
      this.drops.push({ id, count, mesh, vel: { x: (Math.random()-0.5)*1.8, y: 1.8, z: (Math.random()-0.5)*1.8 }, age: 0, baseY: null });
      return;
    }
    const mineralColors: Record<number, number> = {
      [ItemType.COAL]: 0x171717,
      [ItemType.RAW_IRON]: 0xb97852,
      [ItemType.RAW_GOLD]: 0xf2bd28,
      [ItemType.DIAMOND]: 0x36dbe5,
      [ItemType.IRON_INGOT]: 0xd7b2a0,
      [ItemType.GOLD_INGOT]: 0xffd33d,
    };
    const mineralColor = mineralColors[id as number];
    const geo = mineralColor
      ? new THREE.IcosahedronGeometry(0.22, 0)
      : new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const material = mineralColor
      ? new THREE.MeshLambertMaterial({ color: mineralColor, emissive: mineralColor, emissiveIntensity: id === ItemType.DIAMOND ? 0.16 : 0.03 })
      : this.worldMaterial;
    const mesh = new THREE.Mesh(geo, material);
    if (!mineralColor) this.setupMeshUVs(geo as THREE.BoxGeometry, id);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.drops.push({
      id,
      count,
      mesh,
      vel: {
        x: (Math.random() - 0.5) * 2.8,
        y: 0.05,
        z: (Math.random() - 0.5) * 2.8,
      },
      age: 0,
      baseY: null,
    });
  }

  private updateDrops(dt: number) {
    // Falling sand/gravity blocks: settle unsupported sand downward and hurt buried player.
    if (Math.random() < dt * 3) {
      const bx = Math.floor(this.pos.x), bz = Math.floor(this.pos.z), by = Math.floor(this.pos.y + 1.2);
      if (this.world.getBlock(bx, by, bz) === BlockType.SAND && this.gameMode === 'survival') this.applyDamage(1, 'Kum altında boğuldun');
      for (let z = 1; z < SZ - 1; z++) for (let x = 1; x < SX - 1; x++) for (let y = 1; y < SY - 1; y++) {
        if (this.world.getBlock(x, y, z) === BlockType.SAND && this.world.getBlockPhys(x, y - 1, z) === BlockType.AIR) {
          this.world.setBlock(x, y, z, BlockType.AIR); this.world.setBlock(x, y - 1, z, BlockType.SAND); this.rebuildVisibleWorld(); break;
        }
      }
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.age += dt;

      // Magnetize toward player if close
      const dx = this.pos.x - drop.mesh.position.x;
      const dy = this.pos.y + 0.8 - drop.mesh.position.y;
      const dz = this.pos.z - drop.mesh.position.z;
      const dist = Math.hypot(dx, dy, dz);

      if (drop.age > 0.6 && dist < 3.2) {
        const pullSpeed = Math.min(1, dt * (7 + (3.2 - dist) * 7));
        drop.mesh.position.x += dx * pullSpeed;
        drop.mesh.position.y += dy * pullSpeed;
        drop.mesh.position.z += dz * pullSpeed;

        if (dist < 0.9) {
          const remaining = this.addToInventory(drop.id, drop.count);
          if (remaining <= 0) {
            this.scene.remove(drop.mesh);
            this.disposeDropObject(drop.mesh);
            this.drops.splice(i, 1);
            Sound.pickup();
            this.onHUDUpdate?.();
            continue;
          }
          drop.count = remaining;
        }
      } else {
        // Physics for dropped item
        drop.vel.y -= 18 * dt;
        let nx = drop.mesh.position.x + drop.vel.x * dt;
        let ny = drop.mesh.position.y + drop.vel.y * dt;
        let nz = drop.mesh.position.z + drop.vel.z * dt;

        const by = Math.floor(ny - 0.15);
        if (drop.vel.y < 0 && this.world.getBlockPhys(Math.floor(nx), by, Math.floor(nz)) !== BlockType.AIR) {
          ny = by + 1 + 0.15;
          drop.vel.y = 0;
          drop.baseY = ny;
          drop.vel.x *= 0.5;
          drop.vel.z *= 0.5;
        }

        drop.mesh.position.set(nx, ny, nz);
        if (drop.baseY !== null && drop.vel.y === 0) {
          drop.mesh.position.y = drop.baseY + Math.sin(drop.age * 2.8) * 0.05;
        }
      }

      drop.mesh.rotation.y += dt * 2.2;
    }
  }

  private spawnBlockDebris(x: number, y: number, z: number, blockId: BlockType) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const mesh = new THREE.Mesh(geo, this.worldMaterial);
      this.setupMeshUVs(geo, blockId);
      mesh.position.set(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.5, z + (Math.random() - 0.5) * 0.5);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: {
          x: (Math.random() - 0.5) * 3,
          y: 2 + Math.random() * 2,
          z: (Math.random() - 0.5) * 3,
        },
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 16 * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.mesh.scale.multiplyScalar(0.96);
    }
  }

  // ================= INVENTORY HELPERS =================
  public giveCreativeItem(id: AnyItemId) {
    if (this.gameMode !== 'creative') return;
    const selected = this.inventory[this.selectedSlot];
    if (selected && selected.id === id) {
      selected.count = 64;
    } else {
      const left = this.addToInventory(id, 64);
      if (left === 64) this.inventory[this.selectedSlot] = { id, count: 64 };
    }
    this.hp = this.maxHp;
    this.hunger = this.maxHunger;
    this.onHUDUpdate?.();
  }
  public addToInventory(id: AnyItemId, count: number): number {
    // 1. Try stacking into existing matching slots
    for (let i = 0; i < 36 && count > 0; i++) {
      const stack = this.inventory[i];
      if (stack && stack.id === id && stack.count < 64) {
        const canAdd = Math.min(64 - stack.count, count);
        stack.count += canAdd;
        count -= canAdd;
      }
    }
    // 2. Try empty slots
    for (let i = 0; i < 36 && count > 0; i++) {
      if (!this.inventory[i]) {
        const canAdd = Math.min(64, count);
        this.inventory[i] = { id, count: canAdd };
        count -= canAdd;
      }
    }
    return count;
  }

  public applyRemoteTileState(furnaces: Record<number, FurnaceData>, chests: Record<number, ChestData>) {
    this.world.furnaces = furnaces || {};
    this.world.chests = chests || {};
    this.onHUDUpdate?.();
  }
  // ================= FURNACE TICKING =================
  private tickFurnaces(dt: number) {
    for (const key in this.world.furnaces) {
      const idx = Number(key);
      const f = this.world.furnaces[idx];
      if (!f) continue;

      let isLit = f.burnTimeRemaining > 0;
      if (f.burnTimeRemaining > 0) {
        f.burnTimeRemaining = Math.max(0, f.burnTimeRemaining - dt);
      }

      // Check if we can start burning fuel
      const smelt = f.input ? findSmeltRecipe(f.input.id) : null;
      const canSmelt =
        smelt && (!f.output || (f.output.id === smelt.output.id && f.output.count + smelt.output.count <= 64));

      if (f.burnTimeRemaining <= 0 && canSmelt && f.fuel && f.fuel.count > 0) {
        const fuelVal = ITEM_DEFS[f.fuel.id]?.fuelValue || (f.fuel.id === BlockType.OAK_LOG ? 15 : 0);
        if (fuelVal > 0) {
          f.fuel.count--;
          if (f.fuel.count <= 0) f.fuel = null;
          f.burnTimeRemaining = fuelVal;
          f.maxBurnTime = fuelVal;
          isLit = true;
        }
      }

      // Keep the placed block visually lit while fuel remains.
      const fx = idx % SX; const fz = Math.floor(idx / SX) % SZ; const fy = Math.floor(idx / (SX * SZ));
      const placed = this.world.getBlock(fx, fy, fz);
      if (isLit && placed === BlockType.FURNACE) this.world.setBlock(fx, fy, fz, BlockType.FURNACE_LIT, false);
      if (!isLit && placed === BlockType.FURNACE_LIT) this.world.setBlock(fx, fy, fz, BlockType.FURNACE, false);

      // Progress cooking
      if (isLit && canSmelt) {
        f.cookProgress += dt;
        f.maxCookTime = smelt!.cookTime;
        if (f.cookProgress >= f.maxCookTime) {
          f.cookProgress = 0;
          f.input!.count--;
          if (f.input!.count <= 0) f.input = null;
          if (!f.output) {
            f.output = { ...smelt!.output };
          } else {
            f.output.count += smelt!.output.count;
          }
        }
      } else if (!canSmelt) {
        f.cookProgress = Math.max(0, f.cookProgress - dt * 2);
      }
    }
  }

  // ================= ANIMATION & CAMERA UPDATE =================
  private animate = (now: number) => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0.016);
    this.lastTime = now;

    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
      this.damageFlashHudClock += dt;
      if (this.damageFlashHudClock >= 0.05 || this.damageFlashTimer === 0) {
        this.damageFlashHudClock = 0;
        this.onHUDUpdate?.();
      }
    }

    if (!this.isPaused && !this.isDead) {
      this.updatePlayer(dt);
      this.updateInteraction(dt);
      this.updateMobs(dt);
      this.updateRemotePlayers(dt);
      this.updateDrops(dt);
      this.updateParticles(dt);
      this.updateDayNight(dt);
      this.updateTorchLights(dt);
      this.tickFurnaces(dt);
    }

    this.updateWorldBorder(dt);
    this.updateCameraAndModels(dt);
    // Recenter the visible chunk ring before the player reaches its edge.
    // This makes nearby chunks appear while walking instead of waiting for a hard chunk boundary.
    if (Math.hypot(this.pos.x - this.visibleMeshCenter.x, this.pos.z - this.visibleMeshCenter.z) > 8) this.rebuildVisibleWorld();
    this.fpsFrames++;
    this.fpsClock += dt;
    if (this.fpsClock >= 0.5) { this.fps = Math.round(this.fpsFrames / this.fpsClock); this.fpsFrames = 0; this.fpsClock = 0; this.onHUDUpdate?.(); }
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Update Minecraft-style world border: animate diagonal stripes and
   * increase opacity the closer the player is to the world edge.
   */
  private updateWorldBorder(dt: number) {
    if (!this.worldBorderGroup || !this.worldBorderMaterial) return;
    this.worldBorderTime += dt;

    // Scroll the diagonal stripes along U (left to right)
    const tex = this.worldBorderMaterial.map as THREE.CanvasTexture | null;
    if (tex) {
      tex.offset.x = (this.worldBorderTime * 0.18) % 1;
      tex.offset.y = 0;
      tex.needsUpdate = false;
    }

    // Opacity: dim when far, opaque when within 4 blocks of the edge.
    const distToEdge = Math.min(
      this.pos.x,
      this.pos.z,
      SX - this.pos.x,
      SZ - this.pos.z
    );
    const maxRange = 32;
    const minRange = 4;
    let alpha = 0.18 + (Math.max(0, maxRange - distToEdge) / maxRange) * 0.42;
    if (distToEdge < minRange) {
      alpha = 0.85;
    }
    // Pulse the opacity slightly so it feels alive
    alpha += Math.sin(this.worldBorderTime * 3.4) * 0.04;
    this.worldBorderMaterial.opacity = Math.max(0.12, Math.min(0.9, alpha));
  }

  private updateCameraAndModels(dt: number) {
    const eye = this.getEyePos();

    if (!this.isThirdPerson) {
      // 1st Person
      this.camera.position.set(eye.x, eye.y, eye.z);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.donkey3P.visible = false;
      this.handGroup.visible = true;

      // First-person donkey hoof bobbing and authentic Minecraft swing
      const baseRx = 0.12;
      const baseRy = -0.28;
      const baseRz = 0.08;
      let rx = baseRx;
      let ry = baseRy;
      let rz = baseRz;
      let posOffsetY = 0;
      let posOffsetZ = 0;

      if (this.swingTimer >= 0) {
        const s = Math.sin((this.swingTimer / 0.28) * Math.PI);
        // Classic Minecraft swipe: swings down and inward
        rx = baseRx - s * 0.95;
        ry = baseRy - s * 0.55;
        rz = baseRz + s * 0.65;
        posOffsetY = -s * 0.05;
        posOffsetZ = -s * 0.07;
      } else if (this.breakingBlock) {
        const bob = Math.sin(performance.now() * 0.035);
        rx = baseRx - Math.abs(bob) * 0.55;
        ry = baseRy - Math.abs(bob) * 0.25;
        rz = baseRz + Math.abs(bob) * 0.35;
      }

      this.handGroup.rotation.x += (rx - this.handGroup.rotation.x) * Math.min(1, dt * 20);
      this.handGroup.rotation.y += (ry - this.handGroup.rotation.y) * Math.min(1, dt * 20);
      this.handGroup.rotation.z += (rz - this.handGroup.rotation.z) * Math.min(1, dt * 20);

      const walkFactor = Math.min(1, Math.hypot(this.vel.x, this.vel.z) / 4);
      this.handGroup.position.x = 0.36 + Math.cos(this.walkPhase * 0.5) * 0.015 * walkFactor;
      this.handGroup.position.y = -0.28 + Math.sin(this.walkPhase) * 0.02 * walkFactor + posOffsetY;
      this.handGroup.position.z = -0.48 + posOffsetZ;
    } else {
      // 3rd Person
      this.donkey3P.visible = true;
      this.handGroup.visible = false;

      this.donkey3P.position.set(this.pos.x, this.pos.y + (this.isDead ? 0.22 : (this.isSneaking ? -0.22 : 0)), this.pos.z);
      this.donkey3P.rotation.y = this.yaw + Math.PI;
      this.donkey3P.rotation.z += ((this.isDead ? -Math.PI / 2 : 0) - this.donkey3P.rotation.z) * Math.min(1, dt * 12);

      // Animate Donkey limbs (4 legs + head)
      const ud = this.donkey3P.userData;
      const swing = Math.sin(this.walkPhase) * 0.65 * Math.min(1, Math.hypot(this.vel.x, this.vel.z) / 3);
      if (!this.isDead && ud.legs && ud.legs.length === 4) {
        // Front-left, front-right (swinging with mine/attack), back-left, back-right
        ud.legs[0].rotation.x = swing;
        ud.legs[1].rotation.x = this.swingTimer >= 0 ? -Math.sin((this.swingTimer / 0.3) * Math.PI) * 1.5 : -swing;
        ud.legs[2].rotation.x = -swing;
        ud.legs[3].rotation.x = swing;
      }
      if (!this.isDead && ud.headGroup) {
        ud.headGroup.rotation.x = this.isSneaking ? 0.35 : (this.swingTimer >= 0 ? Math.sin((this.swingTimer / 0.3) * Math.PI) * 0.3 : 0);
      }

      // Third-person camera positioning with obstacle push-in
      const d = this.getLookDir();
      const dist = 3.6;
      let camX = eye.x - d.x * dist;
      let camY = eye.y - d.y * dist + 0.6;
      let camZ = eye.z - d.z * dist;

      for (let s = 0.4; s <= dist; s += 0.4) {
        const sx = eye.x - d.x * s;
        const sy = eye.y - d.y * s + 0.3;
        const sz = eye.z - d.z * s;
        if (this.world.getBlockPhys(Math.floor(sx), Math.floor(sy), Math.floor(sz)) !== BlockType.AIR) {
          camX = sx;
          camY = sy;
          camZ = sz;
          break;
        }
      }
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(eye.x, eye.y, eye.z);
    }
  }

  // ================= INPUT LISTENERS =================
  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      this.keys[e.code] = true;

      if (!this.isPaused && !this.isDead) {
        // Hotbar selection 1-9
        if (/^Digit[1-9]$/.test(e.code)) {
          this.selectedSlot = Number(e.code.slice(5)) - 1;
          this.updateHeldItemModel();
          this.onHUDUpdate?.();
        }
        // Toggle 3rd person perspective
        else if (e.code === this.keyBindings.perspective) {
          e.preventDefault();
          this.isThirdPerson = !this.isThirdPerson;
          this.onToast?.(this.isThirdPerson ? '3. Şahıs Görünüm' : '1. Şahıs Görünüm');
        }
        // Drop held item
        else if (e.code === this.keyBindings.drop) {
          e.preventDefault();
          const held = this.inventory[this.selectedSlot];
          if (held && held.count > 0) {
            const dir = this.getLookDir();
            this.spawnDrop(this.pos.x + dir.x * 0.8, this.pos.y + 1.2, this.pos.z + dir.z * 0.8, held.id, 1);
            held.count--;
            if (held.count <= 0) this.inventory[this.selectedSlot] = null;
            this.updateHeldItemModel();
            this.onHUDUpdate?.();
          }
        }
        // Swap with offhand
        else if (e.code === this.keyBindings.offhand) {
          e.preventDefault();
          const tmp = this.inventory[this.selectedSlot];
          this.inventory[this.selectedSlot] = this.offhand;
          this.offhand = tmp;
          this.updateHeldItemModel();
          this.onHUDUpdate?.();
        }
        // Creative flight toggle (Double Jump)
        else if (e.code === this.keyBindings.jump && this.gameMode === 'creative') {
          const now = performance.now();
          if (now - this.flyCooldown < 300) {
            this.isFlying = !this.isFlying;
            this.onToast?.(this.isFlying ? 'Uçuş Modu Açık' : 'Uçuş Modu Kapalı');
          }
          this.flyCooldown = now;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
      if (this.isPaused || this.isDead || this.isGUIOpen) return;
      if ((e.target as HTMLElement)?.closest('.mc-panel, .mc-slot, .mc-btn, input, select, button')) {
        return;
      }
      if (!this.isPointerLocked) {
        this.requestPointerLock();
        return;
      }
      if (e.button === 0) {
        this.mouseLeft = true;
        if (this.swingTimer < 0) this.swingTimer = 0;
      } else if (e.button === 2) {
        this.mouseRight = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isGUIOpen) {
        this.mouseLeft = false;
        this.mouseRight = false;
        return;
      }
      if (e.button === 0) this.mouseLeft = false;
      else if (e.button === 2) this.mouseRight = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || this.isPaused || this.isDead || this.isGUIOpen) return;
      const s = this.mouseSensitivity * 0.0022;
      this.yaw -= e.movementX * s;
      this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch - e.movementY * s));
    });

    window.addEventListener('wheel', (e) => {
      if (this.isPaused || this.isDead || this.isGUIOpen) return;
      this.selectedSlot = (this.selectedSlot + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
      this.updateHeldItemModel();
      this.onHUDUpdate?.();
    });

    window.addEventListener('contextmenu', (e) => {
      if (this.isPointerLocked || this.isGUIOpen) {
        e.preventDefault();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
      if (!this.isPointerLocked && !this.isPaused && !this.isDead && !this.isGUIOpen && !this.onlineMode) {
        this.isPaused = true;
        this.mouseLeft = false;
        this.mouseRight = false;
        this.onUIStateChange?.('paused');
      }
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public requestPointerLock() {
    try {
      this.renderer.domElement.requestPointerLock();
    } catch {
      // pointerlock error
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }
}
