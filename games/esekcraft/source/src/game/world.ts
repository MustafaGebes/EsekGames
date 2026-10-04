/**
 * Minecraft Web - Voxel World, Generation, Ores & Meshing
 */
import * as THREE from 'three';
import { SX, SY, SZ, BlockType, FurnaceData, ChestData, getBedState, getBlockHeight, getBlockOffsetY, getDoorLocalBounds, getDoorState, isBedBlock, isDoorBlock, isSlabBlock } from './types';
import { BLOCK_DEFS, TILE, TILE_SIZE, TILES_PER_ROW, ATLAS_SIZE, atlasTexture } from './textures';

export const IDX = (x: number, y: number, z: number) => (y * SZ + z) * SX + x;
export const inBounds = (x: number, y: number, z: number) =>
  x >= 0 && x < SX && y >= 0 && y < SY && z >= 0 && z < SZ;

// Box faces: dir + corners [x, y, z, u, v]
const FACES = [
  { dir: [-1, 0, 0], corners: [[0, 1, 0, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 1], [0, 0, 1, 1, 0]] }, // -X
  { dir: [1, 0, 0], corners: [[1, 1, 1, 0, 1], [1, 0, 1, 0, 0], [1, 1, 0, 1, 1], [1, 0, 0, 1, 0]] }, // +X
  { dir: [0, -1, 0], corners: [[1, 0, 1, 1, 0], [0, 0, 1, 0, 0], [1, 0, 0, 1, 1], [0, 0, 0, 0, 1]] }, // -Y (Bottom)
  { dir: [0, 1, 0], corners: [[0, 1, 1, 1, 1], [1, 1, 1, 0, 1], [0, 1, 0, 1, 0], [1, 1, 0, 0, 0]] }, // +Y (Top)
  { dir: [0, 0, -1], corners: [[1, 0, 0, 0, 0], [0, 0, 0, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 1, 1]] }, // -Z
  { dir: [0, 0, 1], corners: [[0, 0, 1, 0, 0], [1, 0, 1, 1, 0], [0, 1, 1, 0, 1], [1, 1, 1, 1, 1]] }, // +Z
];

const FACE_SHADE = [0.65, 0.65, 0.5, 1.0, 0.8, 0.8];

function valueNoise(seed: number) {
  function nrnd(ix: number, iz: number) {
    let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 144665)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  return function (x: number, z: number) {
    const ix = Math.floor(x),
      iz = Math.floor(z);
    let fx = x - ix,
      fz = z - iz;
    fx = fx * fx * (3 - 2 * fx);
    fz = fz * fz * (3 - 2 * fz);
    const a = nrnd(ix, iz),
      b = nrnd(ix + 1, iz),
      c = nrnd(ix, iz + 1),
      d = nrnd(ix + 1, iz + 1);
    return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
  };
}

export function hashString(s: string): number {
  s = String(s);
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function intersectPartialBlockRay(
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  x: number,
  y: number,
  z: number,
  offsetY: number,
  height: number,
  minX = 0,
  maxX = 1,
  minZ = 0,
  maxZ = 1,
): { distance: number; nx: number; ny: number; nz: number } | null {
  const bounds = [
    { origin: origin.x, dir: dir.x, min: x + minX, max: x + maxX, axis: 0 },
    { origin: origin.y, dir: dir.y, min: y + offsetY, max: y + offsetY + height, axis: 1 },
    { origin: origin.z, dir: dir.z, min: z + minZ, max: z + maxZ, axis: 2 },
  ];
  let enter = -Infinity;
  let exit = Infinity;
  let nx = 0, ny = 0, nz = 0;
  for (const bound of bounds) {
    if (Math.abs(bound.dir) < 1e-9) {
      if (bound.origin < bound.min || bound.origin > bound.max) return null;
      continue;
    }
    const t1 = (bound.min - bound.origin) / bound.dir;
    const t2 = (bound.max - bound.origin) / bound.dir;
    const near = Math.min(t1, t2);
    const far = Math.max(t1, t2);
    if (near > enter) {
      enter = near;
      const normal = t1 < t2 ? -1 : 1;
      nx = bound.axis === 0 ? normal : 0;
      ny = bound.axis === 1 ? normal : 0;
      nz = bound.axis === 2 ? normal : 0;
    }
    exit = Math.min(exit, far);
    if (exit < Math.max(enter, 0)) return null;
  }
  if (exit < 0) return null;
  if (enter < 0) return { distance: 0, nx: 0, ny: 0, nz: 0 };
  return { distance: enter, nx, ny, nz };
}

export class VoxelWorld {
  public data: Uint8Array;
  public mods: Record<number, number> = {};
  public furnaces: Record<number, FurnaceData> = {};
  public chests: Record<number, ChestData> = {};
  public mesh: THREE.Mesh | null = null;
  public seed: number;

  constructor(seedStr = 'minecraft') {
    this.seed = hashString(seedStr);
    this.data = new Uint8Array(SX * SY * SZ);
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (!inBounds(x, y, z)) return BlockType.AIR;
    return this.data[IDX(x, y, z)];
  }

  public getBlockMesh(x: number, y: number, z: number): BlockType {
    if (y < 0) return BlockType.BEDROCK;
    if (!inBounds(x, y, z)) return BlockType.AIR;
    return this.data[IDX(x, y, z)];
  }

  public getBlockPhys(x: number, y: number, z: number): BlockType {
    if (y < 0) return BlockType.BEDROCK;
    if (y >= SY) return BlockType.AIR;
    if (x < 0 || x >= SX || z < 0 || z >= SZ) return BlockType.BEDROCK;
    return this.data[IDX(x, y, z)];
  }

  public setBlock(x: number, y: number, z: number, type: BlockType, record = true) {
    if (!inBounds(x, y, z)) return;
    const idx = IDX(x, y, z);
    this.data[idx] = type;
    if (record) {
      this.mods[idx] = type;
    }
    // Clean up tile entities if removed
    if (type !== BlockType.FURNACE && type !== BlockType.FURNACE_LIT) {
      delete this.furnaces[idx];
    }
    if (type !== BlockType.CHEST) {
      delete this.chests[idx];
    }
  }

  public getTopSolid(x: number, z: number): number {
    for (let y = SY - 1; y >= 0; y--) {
      const b = this.getBlock(x, y, z);
      if (b !== BlockType.AIR && b !== BlockType.OAK_LEAVES && b !== BlockType.TORCH && !isDoorBlock(b)) {
        return y;
      }
    }
    return 0;
  }

  public getTopSurface(x: number, z: number): number {
    for (let y = SY - 1; y >= 0; y--) {
      const block = this.getBlock(x, y, z);
      if (block !== BlockType.AIR && block !== BlockType.OAK_LEAVES && block !== BlockType.TORCH && !isDoorBlock(block)) {
        return y + getBlockOffsetY(block) + getBlockHeight(block);
      }
    }
    return 0;
  }

  /**
   * Procedural World Terrain Generator
   */
  public async generate(onProgress?: (pct: number, stage: string, fps: number) => void): Promise<void> {
    const n1 = valueNoise(this.seed);
    const n2 = valueNoise(this.seed * 7 + 13);
    const n3 = valueNoise(this.seed * 31 + 19);
    let fps = 60;
    let rowsPerFrame = 1;
    let previousFrame = performance.now();
    const processRows = async (
      start: number,
      end: number,
      processRow: (row: number) => void,
      progressStart: number,
      progressEnd: number,
      stage: string
    ) => {
      let row = start;
      while (row < end) {
        const batchEnd = Math.min(end, row + rowsPerFrame);
        while (row < batchEnd) processRow(row++);

        const frameTime = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
        const frameMs = Math.max(1, frameTime - previousFrame);
        previousFrame = frameTime;
        fps = Math.round(1000 / frameMs);
        if (fps < 38) rowsPerFrame = Math.max(1, Math.floor(rowsPerFrame / 2));
        else if (fps > 54) rowsPerFrame = Math.min(6, rowsPerFrame + 1);

        const pct = progressStart + ((row - start) / (end - start)) * (progressEnd - progressStart);
        onProgress?.(pct, stage, fps);
      }
    };

    // Heightmap terrain
    await processRows(0, SZ, (z) => {
      for (let x = 0; x < SX; x++) {
        const heightNoise = (n1(x * 0.04, z * 0.04) * 1.0 + n2(x * 0.1, z * 0.1) * 0.4 + n3(x * 0.25, z * 0.25) * 0.15) / 1.55;
        const groundHeight = Math.max(10, Math.min(SY - 10, Math.floor(18 + heightNoise * 25)));

        // Desert beach biome patch
        const isSandBiome = n2(x * 0.05, z * 0.05) > 0.65;

        for (let y = 0; y <= groundHeight; y++) {
          let b: BlockType;
          if (y === 0) {
            b = BlockType.BEDROCK;
          } else if (y <= 2 && (x * 7 + y * 13 + z * 5) % 4 === 0) {
            b = BlockType.BEDROCK;
          } else if (y === groundHeight) {
            b = isSandBiome ? BlockType.SAND : BlockType.GRASS;
          } else if (y >= groundHeight - 3) {
            b = isSandBiome ? BlockType.SAND : BlockType.DIRT;
          } else {
            // Stone layer with Ore Veins
            const oreRnd = ((Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed) * 43758.5453) % 1 + 1) % 1;
            // Y-level based distribution: deep diamond/gold, mid iron, upper coal.
            const veinNoise = ((Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed) * 43758.5453) % 1 + 1) % 1;
            if (y <= 10 && veinNoise < 0.022) {
              b = BlockType.DIAMOND_ORE;
            } else if (y <= 24 && veinNoise < 0.038) {
              b = BlockType.GOLD_ORE;
            } else if (y >= 8 && y <= 42 && veinNoise < 0.072) {
              b = BlockType.IRON_ORE;
            } else if (y >= 4 && veinNoise < 0.135) {
              b = BlockType.COAL_ORE;
            } else {
              b = BlockType.STONE;
            }
          }
          this.data[IDX(x, y, z)] = b;
        }
      }
    }, 0, 36, 'Arazi katmanları oluşturuluyor...');

    // Carve deterministic underground cave pockets and tunnels below the surface.
    await processRows(2, SZ - 2, (z) => {
      for (let x = 2; x < SX - 2; x++) {
        const surface = this.getTopSolid(x, z);
        for (let y = 4; y < Math.min(surface - 2, SY - 4); y++) {
          const tunnel = Math.sin(x * 0.29 + y * 0.61 + z * 0.37 + this.seed * 0.0001);
          const chamber = Math.sin(x * 0.13 + y * 0.21 + z * 0.17 + this.seed * 0.00007);
          if (tunnel > 0.78 && chamber > -0.25) this.data[IDX(x, y, z)] = BlockType.AIR;
        }
      }
    }, 36, 60, 'Mağaralar ve maden damarları hazırlanıyor...');

    // Trees
    await processRows(3, SZ - 3, (z) => {
      for (let x = 3; x < SX - 3; x++) {
        const trnd = ((Math.sin(x * 91.1 + z * 47.7 + this.seed * 3) * 43758.5453) % 1 + 1) % 1;
        if (trnd < 0.02) {
          const y = this.getTopSolid(x, z);
          if (this.getBlock(x, y, z) === BlockType.GRASS && y + 8 < SY) {
            this.spawnTree(x, y + 1, z);
          }
        }
      }
    }, 60, 72, 'Ağaçlar ve bitki örtüsü yükleniyor...');

    // Apply saved modifications if any
    for (const key in this.mods) {
      this.data[Number(key)] = this.mods[key];
    }

    onProgress?.(74, 'Kayıtlı blok değişiklikleri uygulanıyor...', fps);
  }

  private spawnTree(x: number, y: number, z: number) {
    const height = 4 + Math.floor(Math.random() * 3);
    // Trunk
    for (let ty = 0; ty < height; ty++) {
      this.data[IDX(x, y + ty, z)] = BlockType.OAK_LOG;
    }
    // Leaves crown
    for (let ly = height - 2; ly <= height + 1; ly++) {
      const radius = ly <= height - 1 ? 2 : 1;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx === 0 && dz === 0 && ly < height) continue;
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() < 0.4) continue;
          const px = x + dx,
            py = y + ly,
            pz = z + dz;
          if (inBounds(px, py, pz) && this.getBlock(px, py, pz) === BlockType.AIR) {
            this.data[IDX(px, py, pz)] = BlockType.OAK_LEAVES;
          }
        }
      }
    }
  }

  private *createMeshBuffers(renderDistance: number, centerX: number, centerZ: number): Generator<number, {
    pos: number[]; norm: number[]; uv: number[]; col: number[]; idx: number[];
  }, void> {
    const pos: number[] = [];
    const norm: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    let vc = 0;

    const tileUvSize = TILE_SIZE / ATLAS_SIZE;
    // Compute visible X/Z columns once; doing this inside every block face was a major startup cost.
    const visible = new Uint8Array(SX * SZ);
    const fullView = renderDistance >= Math.max(SX, SZ);
    for (let z = 0; z < SZ; z++) for (let x = 0; x < SX; x++) {
      if (fullView || Math.hypot(x + 0.5 - centerX, z + 0.5 - centerZ) <= renderDistance) visible[z * SX + x] = 1;
    }

    const emitTexturedBox = (
      x: number, y: number, z: number,
      minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number,
      faceTiles: readonly number[],
      skipFaces: readonly number[] = [],
    ) => {
      for (let f = 0; f < 6; f++) {
        if (skipFaces.includes(f)) continue;
        const tileIdx = faceTiles[f];
        const tx = tileIdx % TILES_PER_ROW;
        const ty = Math.floor(tileIdx / TILES_PER_ROW);
        const u0 = tx * tileUvSize;
        const u1 = u0 + tileUvSize;
        const v0 = 1 - (ty + 1) * tileUvSize;
        const v1 = 1 - ty * tileUvSize;
        const face = FACES[f];
        for (const c of face.corners) {
          pos.push(
            x + minX + c[0] * (maxX - minX),
            y + minY + c[1] * (maxY - minY),
            z + minZ + c[2] * (maxZ - minZ),
          );
          norm.push(face.dir[0], face.dir[1], face.dir[2]);
          uv.push(u0 + c[3] * (u1 - u0), v0 + c[4] * (v1 - v0));
          const shade = FACE_SHADE[f];
          col.push(shade, shade, shade);
        }
        idx.push(vc, vc + 1, vc + 2, vc + 2, vc + 1, vc + 3);
        vc += 4;
      }
    };

    for (let y = 0; y < SY; y++) {
      for (let z = 0; z < SZ; z++) {
        for (let x = 0; x < SX; x++) {
          if (!visible[z * SX + x]) continue;
          const block = this.data[IDX(x, y, z)];
          // Torches are rendered as dedicated models with point lights by the engine.
          if (block === BlockType.AIR || block === BlockType.TORCH) continue;

          const def = BLOCK_DEFS[block];
          if (!def) continue;

          const doorState = getDoorState(block);
          if (doorState) {
            const bounds = getDoorLocalBounds(block)!;
            const widthAlongX = (doorState.facing % 2 === 0) !== doorState.open;
            const frontTile = def.front ?? def.side;
            const doorTiles = [def.side, def.side, def.bottom, def.top, def.side, def.side];
            if (widthAlongX) {
              doorTiles[4] = frontTile;
              doorTiles[5] = frontTile;
            } else {
              doorTiles[0] = frontTile;
              doorTiles[1] = frontTile;
            }
            emitTexturedBox(
              x, y, z,
              bounds.minX, bounds.maxX, 0, 1, bounds.minZ, bounds.maxZ,
              doorTiles,
              doorState.upper ? [2] : [3],
            );
            continue;
          }

          const bedState = getBedState(block);
          if (bedState) {
            const headTopTiles = [TILE.BED_HEAD_NORTH, TILE.BED_HEAD_WEST, TILE.BED_HEAD_SOUTH, TILE.BED_HEAD_EAST];
            const mattressTop = bedState.head ? headTopTiles[bedState.facing] : TILE.BED_TOP_FOOT;
            const bedSideTiles = [TILE.BED_SIDE, TILE.BED_SIDE, TILE.BED_FRAME, mattressTop, TILE.BED_SIDE, TILE.BED_SIDE];
            const frameTiles = [TILE.BED_FRAME, TILE.BED_FRAME, TILE.BED_FRAME, TILE.BED_FRAME, TILE.BED_FRAME, TILE.BED_FRAME];
            const axisX = bedState.facing === 1 || bedState.facing === 3;
            // A continuous wooden underside hides the supporting block through the gaps in the frame.
            emitTexturedBox(x, y, z, 0, 1, 0, 0.10, 0, 1, frameTiles);

            // Let the mattress and frame meet exactly at the foot/head cell boundary.
            const mattressMinX = axisX ? 0 : 0.07;
            const mattressMaxX = axisX ? 1 : 0.93;
            const mattressMinZ = axisX ? 0.07 : 0;
            const mattressMaxZ = axisX ? 0.93 : 1;
            emitTexturedBox(x, y, z, mattressMinX, mattressMaxX, 0.245, 0.5625, mattressMinZ, mattressMaxZ, bedSideTiles);
            emitTexturedBox(x, y, z, axisX ? 0 : 0.12, axisX ? 1 : 0.88, 0.10, 0.25, axisX ? 0.12 : 0, axisX ? 0.88 : 1, frameTiles);

            const headEndIsMin = bedState.facing === 0 || bedState.facing === 1;
            const legAtMin = bedState.head === headEndIsMin;
            const edgeMin = legAtMin ? 0.02 : 0.82;
            for (const cross of [0.12, 0.76]) {
              if (axisX) {
                emitTexturedBox(x, y, z, edgeMin, edgeMin + 0.12, 0.02, 0.24, cross, cross + 0.12, frameTiles);
              } else {
                emitTexturedBox(x, y, z, cross, cross + 0.12, 0.02, 0.24, edgeMin, edgeMin + 0.12, frameTiles);
              }
            }
            continue;
          }

          const blockHeight = getBlockHeight(block);
          const blockBottom = getBlockOffsetY(block);
          const blockTop = blockBottom + blockHeight;

          // Check all 6 faces
          for (let f = 0; f < 6; f++) {
            const d = FACES[f].dir;
            const nx = x + d[0]; const nz = z + d[2];
            const neighborInView = nx >= 0 && nx < SX && nz >= 0 && nz < SZ && (fullView || visible[nz * SX + nx] === 1);
            const neighbor = neighborInView ? this.getBlockMesh(nx, y + d[1], nz) : BlockType.AIR;

            let faceLowerY = blockBottom;
            let faceUpperY = blockTop;
            // Hide only the part of a face which is actually covered by the adjacent block.
            if (neighbor !== BlockType.AIR) {
              const nDef = BLOCK_DEFS[neighbor];
              if (nDef?.transparent) {
                if (def.transparent && neighbor === block) continue; // don't draw inner leaves
              } else if (d[1] === 0) {
                const neighborBottom = getBlockOffsetY(neighbor);
                const neighborTop = neighborBottom + getBlockHeight(neighbor);
                const overlapBottom = Math.max(blockBottom, neighborBottom);
                const overlapTop = Math.min(blockTop, neighborTop);
                if (overlapBottom <= blockBottom && overlapTop >= blockTop) continue;
                if (overlapTop > overlapBottom) {
                  if (overlapBottom <= blockBottom) faceLowerY = overlapTop;
                  else if (overlapTop >= blockTop) faceUpperY = overlapBottom;
                }
              } else if (d[1] === 1) {
                const neighborBottom = 1 + getBlockOffsetY(neighbor);
                if (neighborBottom <= blockTop) continue;
              } else if (d[1] === -1) {
                const neighborTop = -1 + getBlockOffsetY(neighbor) + getBlockHeight(neighbor);
                if (neighborTop >= blockBottom) continue;
              }
            }

            // Determine tile index for this face
            let tileIdx: number;
            if (f === 3) {
              tileIdx = def.top; // +Y
            } else if (f === 2) {
              tileIdx = def.bottom; // -Y
            } else if (f === 5 && def.front !== undefined) {
              tileIdx = def.front; // +Z (Front)
            } else {
              tileIdx = def.side;
            }

            const tx = tileIdx % TILES_PER_ROW;
            const ty = Math.floor(tileIdx / TILES_PER_ROW);
            const u0 = tx * tileUvSize;
            const u1 = u0 + tileUvSize;
            const v0 = 1 - (ty + 1) * tileUvSize;
            const v1 = 1 - ty * tileUvSize;

            const shade = FACE_SHADE[f];
            const corners = FACES[f].corners;

            for (let i = 0; i < 4; i++) {
              const c = corners[i];
              const localY = d[1] === 0
                ? faceLowerY + c[1] * (faceUpperY - faceLowerY)
                : d[1] === 1 ? blockTop : blockBottom;
              pos.push(x + c[0], y + localY, z + c[2]);
              norm.push(d[0], d[1], d[2]);
              uv.push(u0 + c[3] * (u1 - u0), v0 + c[4] * (v1 - v0));
              col.push(shade, shade, shade);
            }

            idx.push(vc, vc + 1, vc + 2, vc + 2, vc + 1, vc + 3);
            vc += 4;
          }
        }
      }
      // A completed vertical layer is a safe yield point for the loading screen.
      yield y + 1;
    }

    return { pos, norm, uv, col, idx };
  }

  private installMesh(scene: THREE.Scene, worldMaterial: THREE.Material, buffers: {
    pos: number[]; norm: number[]; uv: number[]; col: number[]; idx: number[];
  }) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(buffers.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(buffers.norm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(buffers.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(buffers.col, 3));
    geo.setIndex(buffers.idx);

    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    this.mesh = new THREE.Mesh(geo, worldMaterial);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  /** Builds the combined mesh synchronously for edits made after the game has started. */
  public buildMesh(scene: THREE.Scene, worldMaterial: THREE.Material, renderDistance = Math.max(SX, SZ), centerX = SX / 2, centerZ = SZ / 2) {
    const builder = this.createMeshBuffers(renderDistance, centerX, centerZ);
    let result = builder.next();
    while (!result.done) result = builder.next();
    this.installMesh(scene, worldMaterial, result.value);
  }

  /** Build the initial visible mesh in FPS-adaptive frame slices while the loading screen stays responsive. */
  public async buildMeshAdaptive(
    scene: THREE.Scene,
    worldMaterial: THREE.Material,
    renderDistance: number,
    centerX: number,
    centerZ: number,
    onProgress?: (pct: number, stage: string, fps: number) => void,
    shouldInstall: () => boolean = () => true
  ): Promise<void> {
    const builder = this.createMeshBuffers(renderDistance, centerX, centerZ);
    let result = builder.next();
    let layersPerFrame = 1;
    let previousFrame = performance.now();
    let fps = 60;

    while (!result.done) {
      if (!shouldInstall()) return;
      let layers = 0;
      while (!result.done && layers < layersPerFrame) {
        result = builder.next();
        layers++;
      }

      const frameTime = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
      const frameMs = Math.max(1, frameTime - previousFrame);
      previousFrame = frameTime;
      fps = Math.round(1000 / frameMs);
      if (fps < 38) layersPerFrame = Math.max(1, Math.floor(layersPerFrame / 2));
      else if (fps > 54) layersPerFrame = Math.min(5, layersPerFrame + 1);

      const completedLayers = result.done ? SY : result.value;
      onProgress?.((completedLayers / SY) * 100, 'Görünür blok yüzeyleri hazırlanıyor...', fps);
    }

    if (!shouldInstall()) return;
    this.installMesh(scene, worldMaterial, result.value);
    onProgress?.(100, 'Arka plan ve bloklar hazır.', fps);
  }

  /**
   * Fast DDA Voxel Raycaster
   */
  public raycast(
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    maxDistance = 5
  ): { x: number; y: number; z: number; nx: number; ny: number; nz: number; id: BlockType; distance: number } | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const sx = dir.x > 0 ? 1 : -1;
    const sy = dir.y > 0 ? 1 : -1;
    const sz = dir.z > 0 ? 1 : -1;

    const ix = dir.x !== 0 ? 1 / Math.abs(dir.x) : Infinity;
    const iy = dir.y !== 0 ? 1 / Math.abs(dir.y) : Infinity;
    const iz = dir.z !== 0 ? 1 / Math.abs(dir.z) : Infinity;

    let tx = dir.x !== 0 ? (sx > 0 ? x + 1 - origin.x : origin.x - x) * ix : Infinity;
    let ty = dir.y !== 0 ? (sy > 0 ? y + 1 - origin.y : origin.y - y) * iy : Infinity;
    let tz = dir.z !== 0 ? (sz > 0 ? z + 1 - origin.z : origin.z - z) * iz : Infinity;

    let nx = 0,
      ny = 0,
      nz = 0,
      t = 0;

    while (t <= maxDistance) {
      if (inBounds(x, y, z)) {
        const block = this.data[IDX(x, y, z)];
        if (block !== BlockType.AIR) {
          if (isDoorBlock(block)) {
            const bounds = getDoorLocalBounds(block)!;
            const hit = intersectPartialBlockRay(
              origin, dir, x, y, z, 0, 1,
              bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ,
            );
            if (hit && hit.distance <= maxDistance) return { x, y, z, nx: hit.nx, ny: hit.ny, nz: hit.nz, id: block, distance: hit.distance };
          } else if (isSlabBlock(block) || isBedBlock(block)) {
            const hit = intersectPartialBlockRay(origin, dir, x, y, z, getBlockOffsetY(block), getBlockHeight(block));
            if (hit && hit.distance <= maxDistance) return { x, y, z, nx: hit.nx, ny: hit.ny, nz: hit.nz, id: block, distance: hit.distance };
          } else {
            return { x, y, z, nx, ny, nz, id: block, distance: t };
          }
        }
      }
      if (tx < ty && tx < tz) {
        x += sx;
        t = tx;
        tx += ix;
        nx = -sx;
        ny = 0;
        nz = 0;
      } else if (ty < tz) {
        y += sy;
        t = ty;
        ty += iy;
        nx = 0;
        ny = -sy;
        nz = 0;
      } else {
        z += sz;
        t = tz;
        tz += iz;
        nx = 0;
        ny = 0;
        nz = -sz;
      }
    }

    return null;
  }
}
