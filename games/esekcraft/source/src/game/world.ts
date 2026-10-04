/**
 * Minecraft Web - Voxel World, Generation, Ores & Meshing
 */
import * as THREE from 'three';
import { SX, SY, SZ, BlockType, FurnaceData, ChestData } from './types';
import { BLOCK_DEFS, TILE_SIZE, TILES_PER_ROW, ATLAS_SIZE, atlasTexture } from './textures';

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
      if (b !== BlockType.AIR && b !== BlockType.OAK_LEAVES && b !== BlockType.TORCH) {
        return y;
      }
    }
    return 0;
  }

  /**
   * Procedural World Terrain Generator
   */
  public generate(onProgress?: (pct: number, stage: string) => void) {
    const n1 = valueNoise(this.seed);
    const n2 = valueNoise(this.seed * 7 + 13);
    const n3 = valueNoise(this.seed * 31 + 19);

    // Heightmap terrain
    for (let z = 0; z < SZ; z++) {
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
    }

    // Carve deterministic underground cave pockets and tunnels below the surface.
    for (let z = 2; z < SZ - 2; z++) {
      for (let x = 2; x < SX - 2; x++) {
        const surface = this.getTopSolid(x, z);
        for (let y = 4; y < Math.min(surface - 2, SY - 4); y++) {
          const tunnel = Math.sin(x * 0.29 + y * 0.61 + z * 0.37 + this.seed * 0.0001);
          const chamber = Math.sin(x * 0.13 + y * 0.21 + z * 0.17 + this.seed * 0.00007);
          if (tunnel > 0.78 && chamber > -0.25) this.data[IDX(x, y, z)] = BlockType.AIR;
        }
      }
    }
    if (onProgress) onProgress(60, 'Mağaralar, ağaçlar ve madenler oluşturuluyor...');

    // Trees
    for (let z = 3; z < SZ - 3; z++) {
      for (let x = 3; x < SX - 3; x++) {
        const trnd = ((Math.sin(x * 91.1 + z * 47.7 + this.seed * 3) * 43758.5453) % 1 + 1) % 1;
        if (trnd < 0.02) {
          const y = this.getTopSolid(x, z);
          if (this.getBlock(x, y, z) === BlockType.GRASS && y + 8 < SY) {
            this.spawnTree(x, y + 1, z);
          }
        }
      }
    }

    // Apply saved modifications if any
    for (const key in this.mods) {
      this.data[Number(key)] = this.mods[key];
    }

    if (onProgress) onProgress(90, 'Blok ağları derleniyor...');
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

  /**
   * Builds the combined mesh for all visible block faces in the world
   */
  public buildMesh(scene: THREE.Scene, worldMaterial: THREE.Material, renderDistance = Math.max(SX, SZ), centerX = SX / 2, centerZ = SZ / 2) {
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

    for (let y = 0; y < SY; y++) {
      for (let z = 0; z < SZ; z++) {
        for (let x = 0; x < SX; x++) {
          if (!visible[z * SX + x]) continue;
          const block = this.data[IDX(x, y, z)];
          // Torches are rendered as dedicated models with point lights by the engine.
          if (block === BlockType.AIR || block === BlockType.TORCH) continue;

          const def = BLOCK_DEFS[block];
          if (!def) continue;

          // Check all 6 faces
          for (let f = 0; f < 6; f++) {
            const d = FACES[f].dir;
            const nx = x + d[0]; const nz = z + d[2];
            const neighborInView = nx >= 0 && nx < SX && nz >= 0 && nz < SZ && (fullView || visible[nz * SX + nx] === 1);
            const neighbor = neighborInView ? this.getBlockMesh(nx, y + d[1], nz) : BlockType.AIR;

            // If neighbor is solid, skip hidden face (unless neighbor is transparent and this isn't same transparent)
            if (neighbor !== BlockType.AIR) {
              const nDef = BLOCK_DEFS[neighbor];
              if (!nDef?.transparent) continue;
              if (def.transparent && neighbor === block) continue; // don't draw inner leaves
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
              pos.push(x + c[0], y + c[1], z + c[2]);
              norm.push(d[0], d[1], d[2]);
              uv.push(u0 + c[3] * (u1 - u0), v0 + c[4] * (v1 - v0));
              col.push(shade, shade, shade);
            }

            idx.push(vc, vc + 1, vc + 2, vc + 2, vc + 1, vc + 3);
            vc += 4;
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);

    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    this.mesh = new THREE.Mesh(geo, worldMaterial);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  /**
   * Fast DDA Voxel Raycaster
   */
  public raycast(
    origin: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    maxDistance = 5
  ): { x: number; y: number; z: number; nx: number; ny: number; nz: number; id: BlockType } | null {
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
      if (inBounds(x, y, z) && this.data[IDX(x, y, z)] !== BlockType.AIR) {
        return { x, y, z, nx, ny, nz, id: this.data[IDX(x, y, z)] };
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
